/**
 * Data export utilities for downloading tabular datasets in JSON or CSV format.
 */

import type { IncidentReport } from '@/types'

export function exportToJson(data: IncidentReport[], filename = 'oil_sif_incidents.json') {
  if (!data || data.length === 0) return
  const jsonStr = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' })
  downloadBlob(blob, filename)
}

export function exportToCsv(data: IncidentReport[], filename = 'oil_sif_incidents.csv') {
  if (!data || data.length === 0) return

  const headers = [
    'ID',
    'Timestamp',
    'Location',
    'Facility Zone',
    'SIF Potential',
    'Confidence %',
    'IOGP Rule',
    'Severity',
    'Status',
    'Precursor Tokens',
    'Narrative',
  ]

  const csvRows: string[] = []
  csvRows.push(headers.join(','))

  for (const item of data) {
    const tokens = (item.xai_tokens ?? []).join('; ')
    const row = [
      escapeCsvCell(item.id),
      escapeCsvCell(item.timestamp),
      escapeCsvCell(item.location),
      escapeCsvCell(item.facility_zone),
      item.sif_potential ? 'TRUE' : 'FALSE',
      (item.confidence_score * 100).toFixed(1) + '%',
      escapeCsvCell(item.iogp_rule ?? 'None'),
      escapeCsvCell(item.severity_level),
      escapeCsvCell(item.status),
      escapeCsvCell(tokens),
      escapeCsvCell(item.free_text),
    ]
    csvRows.push(row.join(','))
  }

  const csvStr = csvRows.join('\r\n')
  const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, filename)
}

function escapeCsvCell(val: string | null | undefined): string {
  if (val == null) return '""'
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return `"${str}"`
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
