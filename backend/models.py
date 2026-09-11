"""
Pydantic v2 data models for the OIL SIF Precursor Detection Platform.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Literal, Dict, Any
from datetime import datetime
import uuid


# ---------------------------------------------------------------------------
# Domain Enums (as Literals for Pydantic v2)
# ---------------------------------------------------------------------------

StatusType = Literal["Pending", "Reviewed", "Escalated", "Resolved"]
SeverityType = Literal["Critical", "High", "Medium", "Low"]
IOGPRuleType = Literal[
    "Energy Isolation",
    "Confined Space",
    "Line of Fire",
    "Hot Work",
    "Working at Heights",
    "Ground Disturbance",
    "Bypassing Safety Controls",
    "Driving",
    "Unknown",
]


# ---------------------------------------------------------------------------
# Word Tracking Model
# ---------------------------------------------------------------------------

class WordTrackItem(BaseModel):
    """Word tracked by BERT with attribution score and character boundaries."""
    word: str
    score: float = Field(ge=0.0, le=1.0, description="SIF attribution weight computed by BERT")
    is_precursor: bool = Field(description="Whether this word specifically triggered the SIF flag")
    start: int = Field(description="Start character index in original sentence")
    end: int = Field(description="End character index in original sentence")
    iogp_rule: Optional[str] = None


# ---------------------------------------------------------------------------
# Core Domain Model
# ---------------------------------------------------------------------------

class IncidentReport(BaseModel):
    """Full incident report stored in the database."""
    id: str = Field(default_factory=lambda: f"INC-{uuid.uuid4().hex[:8].upper()}")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    location: str = Field(description="Geographic / field location (e.g. Duliajan Field)")
    facility_zone: str = Field(description="Zone within the facility (e.g. Rig Floor, Tank Farm)")
    free_text: str = Field(description="Raw incident report text submitted by the reporter")
    sif_potential: bool = Field(description="Whether AI has flagged this as a SIF precursor")
    confidence_score: float = Field(ge=0.0, le=1.0, description="Model confidence in SIF classification")
    iogp_rule: Optional[str] = Field(default=None, description="Most applicable IOGP Life-Saving Rule")
    xai_tokens: List[str] = Field(default_factory=list, description="Trigger phrases highlighted by XAI")
    tracked_words: List[WordTrackItem] = Field(default_factory=list, description="All sentence words tracked by BERT")
    status: StatusType = Field(default="Pending")
    severity_level: SeverityType = Field(default="Low")
    reporter_name: Optional[str] = None
    reporter_role: Optional[str] = None
    reviewer_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------

class PredictRequest(BaseModel):
    """Payload for POST /api/predict."""
    text: str = Field(min_length=10, description="Free-text incident report to classify")
    location: Optional[str] = Field(default="Unknown", description="Geographic location")
    facility_zone: Optional[str] = Field(default="Unknown", description="Facility zone")
    reporter_name: Optional[str] = None
    reporter_role: Optional[str] = None


class PredictResponse(BaseModel):
    """Result returned by POST /api/predict with BERT word tracking."""
    model_config = {"protected_namespaces": ()}
    incident_id: str
    sif_potential: bool
    confidence_score: float
    iogp_rule: Optional[str]
    xai_tokens: List[str]
    tracked_words: List[WordTrackItem] = Field(default_factory=list)
    severity_level: SeverityType
    explanation: str
    model_type: str = Field(default="BERT-Transformer")
    latency_ms: float = Field(default=0.0, description="Inference processing latency in milliseconds")
    token_count: int = Field(default=0, description="Number of tokens evaluated by BERT")
    label_distribution: Dict[str, float] = Field(default_factory=dict, description="Softmax distribution across categories")
    sif_distribution: Dict[str, float] = Field(default_factory=dict, description="Binary SIF vs Non-SIF probability")
    timestamp: datetime


class TriageUpdate(BaseModel):
    """Payload for PATCH /api/incidents/{id}/triage (human-in-the-loop)."""
    status: StatusType
    override_iogp_rule: Optional[IOGPRuleType] = None
    override_sif_potential: Optional[bool] = None
    override_severity: Optional[SeverityType] = None
    reviewer_notes: Optional[str] = None
    reviewed_by: Optional[str] = Field(default="HSSE Officer")


class BulkRowResult(BaseModel):
    """Per-row result from bulk CSV/Excel upload."""
    row_index: int
    text_preview: str
    sif_potential: bool
    confidence_score: float
    iogp_rule: Optional[str]
    severity_level: SeverityType
    incident_id: str


class BulkUploadResponse(BaseModel):
    """Response for POST /api/upload-bulk."""
    total_records: int
    processed: int
    sif_detected: int
    critical_count: int
    high_count: int
    latency_ms: float = Field(default=0.0, description="Total batch inference latency in milliseconds")
    results: List[BulkRowResult]


class IncidentListResponse(BaseModel):
    """Response for GET /api/incidents."""
    total: int
    page: int
    page_size: int
    incidents: List[IncidentReport]


class SeverityDistribution(BaseModel):
    Critical: int = 0
    High: int = 0
    Medium: int = 0
    Low: int = 0


class TimeSeriesPoint(BaseModel):
    date: str
    total: int
    sif: int
    critical: int


class PrecursorKeyword(BaseModel):
    keyword: str
    count: int
    weight: float  # normalized 0-1


class ZoneHeatmapEntry(BaseModel):
    zone: str
    incident_count: int
    sif_count: int
    critical_count: int
    risk_score: float  # 0-100


class AnalyticsResponse(BaseModel):
    """Response for GET /api/metrics/analytics."""
    total_incidents: int
    sif_rate: float
    critical_count: int
    avg_confidence: float
    severity_distribution: Dict[str, int]
    iogp_distribution: Dict[str, int]
    time_series: List[Dict[str, Any]]
    top_precursors: List[Dict[str, Any]]
    zone_heatmap: List[Dict[str, Any]]
