import { NextResponse } from 'next/server'
import { proxyToFastApi, serverGetIncidents } from '@/lib/serverStore'
import type { IncidentListResponse, FilterState } from '@/types'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const severity = searchParams.get('severity') as any
    const status = searchParams.get('status') as any
    const iogp_rule = searchParams.get('iogp_rule') as any
    const query = searchParams.get('query') || undefined
    const hazard = (searchParams.get('hazard') as any) || undefined
    const facility_zone = searchParams.get('facility_zone') || undefined
    const page = parseInt(searchParams.get('page') || '1', 10)
    const page_size = parseInt(searchParams.get('page_size') || '50', 10)

    // 1. Try FastAPI backend if active and has records
    const remote = await proxyToFastApi<IncidentListResponse>(
      `/api/incidents?${searchParams.toString()}`
    )
    if (remote && remote.incidents && remote.incidents.length > 0) {
      return NextResponse.json(remote)
    }

    // 2. Fallback to native server store
    const filters: FilterState = {
      severity: severity || undefined,
      status: status || undefined,
      iogp_rule: iogp_rule || undefined,
      query,
      hazard,
      facility_zone,
    }
    const local = serverGetIncidents(filters, page, page_size)
    return NextResponse.json(local)
  } catch (error) {
    return NextResponse.json(
      { detail: (error as Error).message || 'Failed to list incidents' },
      { status: 500 }
    )
  }
}
