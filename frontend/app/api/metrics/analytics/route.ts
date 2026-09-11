import { NextResponse } from 'next/server'
import { proxyToFastApi, serverGetAnalytics } from '@/lib/serverStore'
import type { AnalyticsData } from '@/types'

export async function GET() {
  try {
    const remote = await proxyToFastApi<AnalyticsData>('/api/metrics/analytics')
    if (remote && remote.total_incidents > 0 && remote.iogp_distribution && Object.keys(remote.iogp_distribution).length > 0) {
      return NextResponse.json(remote)
    }

    const local = serverGetAnalytics()
    return NextResponse.json(local)
  } catch (error) {
    return NextResponse.json(
      { detail: (error as Error).message || 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
