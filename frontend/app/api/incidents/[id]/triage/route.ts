import { NextResponse } from 'next/server'
import { proxyToFastApi, serverTriage } from '@/lib/serverStore'
import type { IncidentReport, TriageUpdate } from '@/types'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const update: TriageUpdate = await req.json()

    // 1. Try forwarding to FastAPI
    const remote = await proxyToFastApi<IncidentReport>(`/api/incidents/${id}/triage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    })

    if (remote) {
      return NextResponse.json(remote)
    }

    // 2. Native server store fallback
    const local = serverTriage(id, update)
    if (!local) {
      return NextResponse.json({ detail: `Incident '${id}' not found` }, { status: 404 })
    }
    return NextResponse.json(local)
  } catch (error) {
    return NextResponse.json(
      { detail: (error as Error).message || 'Failed to update triage' },
      { status: 500 }
    )
  }
}
