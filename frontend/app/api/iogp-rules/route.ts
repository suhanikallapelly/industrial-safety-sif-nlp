import { NextResponse } from 'next/server'
import { proxyToFastApi, serverGetIogpRules } from '@/lib/serverStore'

export async function GET() {
  try {
    const remote = await proxyToFastApi<{ rules: Record<string, any> }>('/api/iogp-rules')
    if (remote) {
      return NextResponse.json(remote)
    }

    const rules = serverGetIogpRules()
    return NextResponse.json({ rules })
  } catch (error) {
    return NextResponse.json(
      { detail: (error as Error).message || 'Failed to fetch IOGP rules' },
      { status: 500 }
    )
  }
}
