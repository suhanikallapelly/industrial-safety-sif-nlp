import { NextResponse } from 'next/server'
import { proxyToFastApi, serverClassify, serverSaveIncident } from '@/lib/serverStore'
import type { PredictRequest, PredictResponse, IncidentReport } from '@/types'

export async function POST(req: Request) {
  try {
    const body: PredictRequest = await req.json()

    // 1. Try forwarding to FastAPI backend if active
    const remote = await proxyToFastApi<PredictResponse>('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (remote) {
      const report: IncidentReport = {
        id: remote.incident_id,
        timestamp: remote.timestamp,
        location: body.location || 'Field Facility',
        facility_zone: body.facility_zone || 'Operations Area',
        free_text: body.text,
        sif_potential: remote.sif_potential,
        confidence_score: remote.confidence_score,
        iogp_rule: remote.iogp_rule,
        xai_tokens: remote.xai_tokens,
        tracked_words: remote.tracked_words,
        status: 'Pending',
        severity_level: remote.severity_level,
        reporter_name: body.reporter_name || 'Field Safety Auditor',
        reporter_role: body.reporter_role || 'Safety Lead',
        action_checklist: remote.action_checklist,
        barriers: remote.barriers,
      }
      serverSaveIncident(report)
      return NextResponse.json(remote)
    }

    // 2. Fallback to native server-side BERT classification engine
    const local = serverClassify(
      body.text,
      body.location,
      body.facility_zone,
      body.reporter_name,
      body.reporter_role
    )
    return NextResponse.json(local)
  } catch (error) {
    return NextResponse.json(
      { detail: (error as Error).message || 'Failed to process prediction' },
      { status: 500 }
    )
  }
}
