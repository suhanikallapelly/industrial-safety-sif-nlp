import { NextResponse } from 'next/server'
import { proxyToFastApi, serverGetIncidentById } from '@/lib/serverStore'
import type { IncidentReport } from '@/types'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const remote = await proxyToFastApi<IncidentReport>(`/api/incidents/${id}`)
    if (remote) {
      return NextResponse.json(remote)
    }

    const local = serverGetIncidentById(id)
    if (!local) {
      return NextResponse.json({ detail: `Incident ${id} not found` }, { status: 404 })
    }
    return NextResponse.json(local)
  } catch (error) {
    return NextResponse.json(
      { detail: (error as Error).message || 'Failed to fetch incident' },
      { status: 500 }
    )
  }
}
