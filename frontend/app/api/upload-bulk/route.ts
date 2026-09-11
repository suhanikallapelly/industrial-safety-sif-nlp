import { NextResponse } from 'next/server'
import { proxyToFastApi, serverBulkUpload } from '@/lib/serverStore'
import { parseCsvContent } from '@/lib/csvParser'
import type { BulkUploadResponse } from '@/types'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const textColumn = (formData.get('text_column') as string) || ''

    if (!file) {
      return NextResponse.json({ detail: 'No file provided' }, { status: 400 })
    }

    // 1. Try forwarding to FastAPI
    try {
      const remoteForm = new FormData()
      remoteForm.append('file', file)
      if (textColumn) remoteForm.append('text_column', textColumn)

      const remote = await proxyToFastApi<BulkUploadResponse>('/api/upload-bulk', {
        method: 'POST',
        body: remoteForm,
      })
      if (remote) {
        return NextResponse.json(remote)
      }
    } catch {
      // Failover to local batch processor
    }

    // 2. Native server-side CSV parsing & classification
    const text = await file.text()
    const parsed = parseCsvContent(text)
    const target = textColumn || parsed.suggestedTextColumn || parsed.headers[0] || 'text'
    const result = serverBulkUpload(parsed.rows, target)

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { detail: (error as Error).message || 'Failed to process bulk upload' },
      { status: 500 }
    )
  }
}
