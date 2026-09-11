"""
FastAPI main application for the OIL SIF Precursor Detection Platform.
Run: uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional, List
import pandas as pd
import io
import time
import uuid

from models import (
    PredictRequest,
    PredictResponse,
    IncidentReport,
    IncidentListResponse,
    TriageUpdate,
    BulkUploadResponse,
    BulkRowResult,
    AnalyticsResponse,
)
from database import (
    init_db,
    insert_incident,
    get_all_incidents,
    get_incident_by_id,
    update_incident_triage,
    get_analytics_data,
)
from nlp_engine import classify, get_rule_metadata


# ---------------------------------------------------------------------------
# App Lifespan (DB init)
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


# ---------------------------------------------------------------------------
# App Configuration
# ---------------------------------------------------------------------------

app = FastAPI(
    title="OIL SIF Precursor Detection API",
    description=(
        "AI/NLP Engine to detect Serious Injury & Fatality (SIF) Precursors "
        "in Oil India Limited's Unsafe-Act/Unsafe-Condition and Near-Miss reports."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------

@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "ok", "service": "OIL SIF Platform API", "version": "1.0.0"}


# ---------------------------------------------------------------------------
# GET /api/iogp-rules — Rule metadata for frontend
# ---------------------------------------------------------------------------

@app.get("/api/iogp-rules", tags=["Reference"])
async def list_iogp_rules():
    """Return IOGP Life-Saving Rule metadata including colors and descriptions."""
    return {"rules": get_rule_metadata()}


# ---------------------------------------------------------------------------
# POST /api/predict — Single text classification
# ---------------------------------------------------------------------------

@app.post("/api/predict", response_model=PredictResponse, tags=["Classification"])
async def predict(request: PredictRequest):
    """
    Classify a free-text incident report for SIF potential.
    Returns: IOGP rule, confidence, XAI tokens, severity, explanation.
    """
    if len(request.text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Text must be at least 10 characters.")

    # Run NLP classification
    result = classify(request.text)

    # Persist as a new incident
    incident_id = f"INC-{uuid.uuid4().hex[:8].upper()}"
    incident = IncidentReport(
        id=incident_id,
        timestamp=datetime.utcnow(),
        location=request.location or "Unknown",
        facility_zone=request.facility_zone or "Unknown",
        free_text=request.text,
        sif_potential=result["sif_potential"],
        confidence_score=result["confidence_score"],
        iogp_rule=result["iogp_rule"],
        xai_tokens=result["xai_tokens"],
        tracked_words=result["tracked_words"],
        status="Pending",
        severity_level=result["severity_level"],
        reporter_name=request.reporter_name,
        reporter_role=request.reporter_role,
    )
    await insert_incident(incident)

    return PredictResponse(
        incident_id=incident_id,
        sif_potential=result["sif_potential"],
        confidence_score=result["confidence_score"],
        iogp_rule=result["iogp_rule"],
        xai_tokens=result["xai_tokens"],
        tracked_words=result["tracked_words"],
        severity_level=result["severity_level"],
        explanation=result["explanation"],
        latency_ms=result.get("latency_ms", 0.0),
        token_count=result.get("token_count", 0),
        label_distribution=result.get("label_distribution", {}),
        sif_distribution=result.get("sif_distribution", {}),
        timestamp=incident.timestamp,
    )


# ---------------------------------------------------------------------------
# POST /api/upload-bulk — CSV / Excel batch inference
# ---------------------------------------------------------------------------

@app.post("/api/upload-bulk", response_model=BulkUploadResponse, tags=["Bulk Upload"])
async def upload_bulk(
    file: UploadFile = File(...),
    text_column: Optional[str] = Form(None),
):
    """
    Accept a CSV or Excel file with a dynamic target text column.
    Runs SIF classification on every valid row and stores results with batch telemetry.
    """
    t_start = time.perf_counter()
    content = await file.read()

    try:
        if file.filename and file.filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))
        else:
            df = pd.read_csv(io.StringIO(content.decode("utf-8", errors="replace")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse file: {str(e)}")

    # Dynamic target column resolution
    if text_column and text_column in df.columns:
        df["text"] = df[text_column]
    elif "text" not in df.columns:
        # Try common column name variants
        col_map = {c.lower(): c for c in df.columns}
        if "report" in col_map:
            df["text"] = df[col_map["report"]]
        elif "description" in col_map:
            df["text"] = df[col_map["description"]]
        elif "incident" in col_map:
            df["text"] = df[col_map["incident"]]
        else:
            raise HTTPException(
                status_code=422,
                detail=f"Target column not found. Available columns in CSV: {list(df.columns)}",
            )

    df = df.dropna(subset=["text"])
    df = df[df["text"].astype(str).str.len() >= 5].reset_index(drop=True)

    results: List[BulkRowResult] = []
    sif_count = 0
    critical_count = 0
    high_count = 0

    for i, row in df.iterrows():
        text = str(row["text"])
        location = str(row.get("location", "Bulk Upload"))
        zone = str(row.get("facility_zone", row.get("zone", "Unknown")))

        result = classify(text)
        incident_id = f"INC-{uuid.uuid4().hex[:8].upper()}"

        incident = IncidentReport(
            id=incident_id,
            timestamp=datetime.utcnow(),
            location=location,
            facility_zone=zone,
            free_text=text,
            sif_potential=result["sif_potential"],
            confidence_score=result["confidence_score"],
            iogp_rule=result["iogp_rule"],
            xai_tokens=result["xai_tokens"],
            tracked_words=result["tracked_words"],
            status="Pending",
            severity_level=result["severity_level"],
        )
        await insert_incident(incident)

        if result["sif_potential"]:
            sif_count += 1
        if result["severity_level"] == "Critical":
            critical_count += 1
        if result["severity_level"] == "High":
            high_count += 1

        results.append(
            BulkRowResult(
                row_index=int(i) + 1,
                text_preview=text[:120] + ("..." if len(text) > 120 else ""),
                sif_potential=result["sif_potential"],
                confidence_score=result["confidence_score"],
                iogp_rule=result["iogp_rule"],
                severity_level=result["severity_level"],
                incident_id=incident_id,
            )
        )

    batch_latency = round((time.perf_counter() - t_start) * 1000, 2)

    return BulkUploadResponse(
        total_records=len(df),
        processed=len(results),
        sif_detected=sif_count,
        critical_count=critical_count,
        high_count=high_count,
        latency_ms=batch_latency,
        results=results,
    )


# ---------------------------------------------------------------------------
# GET /api/incidents — Queryable filtered incident list
# ---------------------------------------------------------------------------

@app.get("/api/incidents", response_model=IncidentListResponse, tags=["Incidents"])
async def list_incidents(
    severity: Optional[str] = Query(default=None, description="Filter by severity: Critical, High, Medium, Low"),
    facility_zone: Optional[str] = Query(default=None, description="Filter by facility zone"),
    iogp_rule: Optional[str] = Query(default=None, description="Filter by IOGP Life-Saving Rule"),
    status: Optional[str] = Query(default=None, description="Filter by status: Pending, Reviewed, Escalated, Resolved"),
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=50, ge=1, le=200, description="Records per page"),
):
    """Return a paginated, filterable list of all incident reports."""
    result = await get_all_incidents(
        severity=severity,
        facility_zone=facility_zone,
        iogp_rule=iogp_rule,
        status=status,
        page=page,
        page_size=page_size,
    )
    return IncidentListResponse(
        total=result["total"],
        page=page,
        page_size=page_size,
        incidents=result["incidents"],
    )


# ---------------------------------------------------------------------------
# GET /api/incidents/{id} — Single incident detail
# ---------------------------------------------------------------------------

@app.get("/api/incidents/{incident_id}", response_model=IncidentReport, tags=["Incidents"])
async def get_incident(incident_id: str):
    """Retrieve a single incident by ID."""
    incident = await get_incident_by_id(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")
    return incident


# ---------------------------------------------------------------------------
# PATCH /api/incidents/{id}/triage — Human-in-the-loop override
# ---------------------------------------------------------------------------

@app.patch("/api/incidents/{incident_id}/triage", response_model=IncidentReport, tags=["Triage"])
async def triage_incident(incident_id: str, update: TriageUpdate):
    """
    Human-in-the-loop endpoint: update status, override IOGP rule / SIF tag,
    and add reviewer notes for an existing incident.
    """
    incident = await get_incident_by_id(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")

    updated = await update_incident_triage(incident_id, update)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update incident.")
    return updated


# ---------------------------------------------------------------------------
# GET /api/metrics/analytics — Aggregated dashboard metrics
# ---------------------------------------------------------------------------

@app.get("/api/metrics/analytics", response_model=AnalyticsResponse, tags=["Analytics"])
async def get_analytics():
    """
    Return aggregated metrics for the analytics dashboard:
    severity distribution, IOGP rule frequency, 30-day time-series,
    top precursor keywords, and zone risk heatmap.
    """
    data = await get_analytics_data()
    return AnalyticsResponse(**data)


if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run("main:app", host="127.0.0.1", port=port, reload=True)

