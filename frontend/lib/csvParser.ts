/**
 * Lightweight client-side CSV and TSV schema parser & data validator.
 * Validates dynamic schemas, detects corrupted rows, skips empty cells,
 * and auto-suggests the most likely free-text incident description column.
 */

export interface ParsedCsvResult {
  headers: string[]
  rows: Record<string, string>[]
  emptyRowsCount: number
  totalRowsCount: number
  suggestedTextColumn: string
  error?: string
}

export function parseCsvContent(content: string): ParsedCsvResult {
  if (!content || !content.trim()) {
    return {
      headers: [],
      rows: [],
      emptyRowsCount: 0,
      totalRowsCount: 0,
      suggestedTextColumn: '',
      error: 'The uploaded file is empty.',
    }
  }

  // Handle delimiter detection (comma vs tab vs semicolon)
  const firstLine = content.split(/\r?\n/)[0] || ''
  let delimiter = ','
  if (firstLine.includes('\t') && firstLine.split('\t').length > firstLine.split(',').length) {
    delimiter = '\t'
  } else if (firstLine.includes(';') && firstLine.split(';').length > firstLine.split(',').length) {
    delimiter = ';'
  }

  // Split into raw rows respecting quotes
  const rawRows: string[][] = []
  let currentRow: string[] = []
  let currentToken = ''
  let insideQuotes = false

  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    const nextChar = content[i + 1]

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentToken += '"'
        i++ // skip escaped quote
      } else {
        insideQuotes = !insideQuotes
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentToken.trim())
      currentToken = ''
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++ // skip newline pair
      }
      currentRow.push(currentToken.trim())
      currentToken = ''
      if (currentRow.some((col) => col.length > 0)) {
        rawRows.push(currentRow)
      }
      currentRow = []
    } else {
      currentToken += char
    }
  }

  if (currentToken.length > 0 || currentRow.length > 0) {
    currentRow.push(currentToken.trim())
    if (currentRow.some((col) => col.length > 0)) {
      rawRows.push(currentRow)
    }
  }

  if (rawRows.length === 0) {
    return {
      headers: [],
      rows: [],
      emptyRowsCount: 0,
      totalRowsCount: 0,
      suggestedTextColumn: '',
      error: 'No valid rows found in file.',
    }
  }

  const rawHeaders = rawRows[0].map((h) => h.replace(/^["']|["']$/g, '').trim())
  const dataRows = rawRows.slice(1)

  const rows: Record<string, string>[] = []
  let emptyRowsCount = 0

  for (const row of dataRows) {
    const rowObj: Record<string, string> = {}
    let hasData = false

    rawHeaders.forEach((header, idx) => {
      const val = (row[idx] ?? '').replace(/^["']|["']$/g, '').trim()
      rowObj[header] = val
      if (val.length > 0) hasData = true
    })

    if (!hasData) {
      emptyRowsCount++
    } else {
      rows.push(rowObj)
    }
  }

  // Auto-detect best candidate text column
  const textCandidates = ['text', 'report', 'description', 'incident', 'narrative', 'details', 'summary', 'event']
  let suggestedTextColumn = rawHeaders[0] || ''

  for (const candidate of textCandidates) {
    const match = rawHeaders.find((h) => h.toLowerCase().includes(candidate))
    if (match) {
      suggestedTextColumn = match
      break
    }
  }

  // Fallback: Pick column with longest average string length
  if (!suggestedTextColumn && rows.length > 0) {
    let maxAvgLen = 0
    rawHeaders.forEach((header) => {
      const avgLen = rows.reduce((acc, r) => acc + (r[header]?.length ?? 0), 0) / rows.length
      if (avgLen > maxAvgLen) {
        maxAvgLen = avgLen
        suggestedTextColumn = header
      }
    })
  }

  return {
    headers: rawHeaders,
    rows,
    emptyRowsCount,
    totalRowsCount: dataRows.length,
    suggestedTextColumn,
  }
}
