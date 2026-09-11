/**
 * Typed API client for the OIL SIF Precursor Detection Platform backend.
 * All functions target the FastAPI server at NEXT_PUBLIC_API_URL.
 */

import type {
  PredictRequest,
  PredictResponse,
  IncidentReport,
  IncidentListResponse,
  TriageUpdate,
  BulkUploadResponse,
  AnalyticsData,
  FilterState,
} from '@/types'

// Always use relative routes in the browser so requests hit the Next.js server on port 3000 directly
const API_BASE = ''

// ─────────────────────────────────────────────────────────────────────────────
// Generic Fetch Wrapper with Timeout
// ─────────────────────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = 3000
): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(error.detail ?? `HTTP ${res.status}`)
    }
    return res.json() as Promise<T>
  } catch (err) {
    clearTimeout(timeout)
    throw err
  }
}

import {
  clientClassify,
  clientFetchIncidents,
  clientTriageIncident,
  clientBulkUpload,
  getStoredIncidents,
  saveStoredIncidents,
} from './clientInference'
import { parseCsvContent } from './csvParser'

// ─────────────────────────────────────────────────────────────────────────────
// Smart Backend Availability Cache
// After a failed API request, skip the network for 30s and go straight to
// the instant client-side NLP engine.
// ─────────────────────────────────────────────────────────────────────────────
let apiAvailable = true
let apiLastFailure = 0
const API_COOLDOWN_MS = 30_000

export async function predictSIF(req: PredictRequest): Promise<PredictResponse> {
  // Skip network if API was recently unavailable
  const now = Date.now()
  if (!apiAvailable && (now - apiLastFailure) < API_COOLDOWN_MS) {
    return clientClassify(req.text, req.location, req.facility_zone)
  }

  try {
    const res = await apiFetch<PredictResponse>('/api/predict', {
      method: 'POST',
      body: JSON.stringify(req),
    }, 3000)

    // API is reachable — mark available
    apiAvailable = true

    // Maintain client cache immediately so history is bulletproof
    if (typeof window !== 'undefined') {
      const existing = getStoredIncidents()
      const report: IncidentReport = {
        id: res.incident_id,
        timestamp: res.timestamp,
        location: req.location || 'Field Facility',
        facility_zone: req.facility_zone || 'Operations Area',
        free_text: req.text,
        sif_potential: res.sif_potential,
        confidence_score: res.confidence_score,
        iogp_rule: res.iogp_rule,
        xai_tokens: res.xai_tokens,
        tracked_words: res.tracked_words,
        status: 'Pending',
        severity_level: res.severity_level,
        reporter_name: req.reporter_name || 'Field Safety Auditor',
        reporter_role: req.reporter_role || 'Safety Lead',
        action_checklist: res.action_checklist,
        barriers: res.barriers,
      }
      saveStoredIncidents([report, ...existing.filter((i) => i.id !== report.id)])
    }

    return res
  } catch (err) {
    // Mark API as unavailable so subsequent requests skip the network
    apiAvailable = false
    apiLastFailure = Date.now()
    return clientClassify(req.text, req.location, req.facility_zone)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bulk Upload
// ─────────────────────────────────────────────────────────────────────────────

export async function uploadBulk(file: File, textColumn?: string): Promise<BulkUploadResponse> {
  try {
    const form = new FormData()
    form.append('file', file)
    if (textColumn) {
      form.append('text_column', textColumn)
    }
    const res = await fetch(`${API_BASE}/api/upload-bulk`, {
      method: 'POST',
      body: form,
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(error.detail ?? `HTTP ${res.status}`)
    }
    return await res.json()
  } catch {
    const text = await file.text()
    const parsed = parseCsvContent(text)
    const target = textColumn || parsed.suggestedTextColumn || parsed.headers[0] || 'text'
    return clientBulkUpload(parsed.rows, target)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Incidents
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchIncidents(
  filters: FilterState = {},
  page = 1,
  page_size = 50
): Promise<IncidentListResponse> {
  try {
    const params = new URLSearchParams()
    if (filters.severity) params.set('severity', filters.severity)
    if (filters.facility_zone) params.set('facility_zone', filters.facility_zone)
    if (filters.iogp_rule) params.set('iogp_rule', filters.iogp_rule)
    if (filters.status) params.set('status', filters.status)
    if (filters.query) params.set('query', filters.query)
    if (filters.hazard && filters.hazard !== 'all') params.set('hazard', filters.hazard)
    params.set('page', String(page))
    params.set('page_size', String(page_size))

    const serverRes = await apiFetch<IncidentListResponse>(`/api/incidents?${params.toString()}`)
    if (typeof window !== 'undefined' && serverRes.incidents && page === 1 && !filters.query && (!filters.hazard || filters.hazard === 'all')) {
      const local = getStoredIncidents()
      const localOnly = local.filter((l) => !serverRes.incidents.some((s) => s.id === l.id))
      if (localOnly.length > 0) {
        serverRes.incidents = [...localOnly, ...serverRes.incidents]
      }
    }
    return serverRes
  } catch {
    return clientFetchIncidents(filters, page, page_size)
  }
}

export async function fetchIncidentById(id: string): Promise<IncidentReport> {
  return apiFetch<IncidentReport>(`/api/incidents/${id}`)
}

export async function triageIncident(
  id: string,
  update: TriageUpdate
): Promise<IncidentReport> {
  try {
    return await apiFetch<IncidentReport>(`/api/incidents/${id}/triage`, {
      method: 'PATCH',
      body: JSON.stringify(update),
    })
  } catch {
    return clientTriageIncident(id, update)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchAnalytics(): Promise<AnalyticsData> {
  return apiFetch<AnalyticsData>('/api/metrics/analytics')
}

// ─────────────────────────────────────────────────────────────────────────────
// IOGP Rules metadata
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchIOGPRules(): Promise<Record<string, { description: string; color: string; keyword_count: number }>> {
  const data = await apiFetch<{ rules: Record<string, any> }>('/api/iogp-rules')
  return data.rules
}

// ─────────────────────────────────────────────────────────────────────────────
// Severity & zone color helpers
// ─────────────────────────────────────────────────────────────────────────────

export const SEVERITY_COLORS: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f59e0b',
  Medium: '#3b82f6',
  Low: '#22c55e',
}

export const SEVERITY_BG: Record<string, string> = {
  Critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  High: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Low: 'bg-green-500/20 text-green-400 border-green-500/30',
}

export const STATUS_BG: Record<string, string> = {
  Pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Reviewed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Escalated: 'bg-red-500/20 text-red-400 border-red-500/30',
  Resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
}

export const IOGP_COLORS: Record<string, string> = {
  'Energy Isolation': '#ef4444',
  'Confined Space': '#8b5cf6',
  'Line of Fire': '#f97316',
  'Hot Work': '#dc2626',
  'Working at Heights': '#f59e0b',
  'Ground Disturbance': '#84cc16',
  'Bypassing Safety Controls': '#ec4899',
  Driving: '#06b6d4',
  Unknown: '#64748b',
}
