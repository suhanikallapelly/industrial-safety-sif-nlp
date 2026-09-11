/**
 * Shared TypeScript types for the OIL SIF Precursor Detection Platform.
 * Mirrors the backend Pydantic models.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Domain Enums
// ─────────────────────────────────────────────────────────────────────────────

export type StatusType = 'Pending' | 'Reviewed' | 'Escalated' | 'Resolved'
export type SeverityType = 'Critical' | 'High' | 'Medium' | 'Low'
export type IOGPRuleType =
  | 'Energy Isolation'
  | 'Confined Space'
  | 'Line of Fire'
  | 'Hot Work'
  | 'Working at Heights'
  | 'Ground Disturbance'
  | 'Bypassing Safety Controls'
  | 'Driving'
  | 'Unknown'

// ─────────────────────────────────────────────────────────────────────────────
// Word Tracking Model (BERT Attention & Attribution)
// ─────────────────────────────────────────────────────────────────────────────

export interface WordTrackItem {
  word: string
  score: number
  is_precursor: boolean
  start: number
  end: number
  iogp_rule?: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Domain Model
// ─────────────────────────────────────────────────────────────────────────────

export interface IncidentReport {
  id: string
  timestamp: string
  location: string
  facility_zone: string
  free_text: string
  sif_potential: boolean
  confidence_score: number
  iogp_rule: IOGPRuleType | null
  xai_tokens: string[]
  tracked_words?: WordTrackItem[]
  status: StatusType
  severity_level: SeverityType
  reporter_name?: string
  reporter_role?: string
  reviewer_notes?: string
  reviewed_at?: string
  reviewed_by?: string
  action_checklist?: { step: string; phase: string; directive: string }[]
  barriers?: { name: string; status: string; ok: boolean }[]
}

// ─────────────────────────────────────────────────────────────────────────────
// API Responses
// ─────────────────────────────────────────────────────────────────────────────

export interface PredictRequest {
  text: string
  location?: string
  facility_zone?: string
  reporter_name?: string
  reporter_role?: string
}

export interface PredictResponse {
  incident_id: string
  sif_potential: boolean
  confidence_score: number
  iogp_rule: IOGPRuleType | null
  xai_tokens: string[]
  tracked_words?: WordTrackItem[]
  severity_level: SeverityType
  explanation: string
  timestamp: string
  model_type?: string
  latency_ms?: number
  token_count?: number
  label_distribution?: Record<string, number>
  sif_distribution?: Record<string, number>
  action_checklist?: { step: string; phase: string; directive: string }[]
  barriers?: { name: string; status: string; ok: boolean }[]
}

export interface TriageUpdate {
  status: StatusType
  override_iogp_rule?: IOGPRuleType
  override_sif_potential?: boolean
  override_severity?: SeverityType
  reviewer_notes?: string
  reviewed_by?: string
}

export interface IncidentListResponse {
  total: number
  page: number
  page_size: number
  incidents: IncidentReport[]
}

export interface BulkRowResult {
  row_index: number
  text_preview: string
  sif_potential: boolean
  confidence_score: number
  iogp_rule: IOGPRuleType | null
  severity_level: SeverityType
  incident_id: string
}

export interface BulkUploadResponse {
  total_records: number
  processed: number
  sif_detected: number
  critical_count: number
  high_count: number
  latency_ms?: number
  results: BulkRowResult[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────────────────────────────────────

export interface TimeSeriesPoint {
  date: string
  total: number
  sif: number
  critical: number
}

export interface PrecursorKeyword {
  keyword: string
  count: number
  weight: number
}

export interface ZoneHeatmapEntry {
  zone: string
  incident_count: number
  sif_count: number
  critical_count: number
  risk_score: number
}

export interface AnalyticsData {
  total_incidents: number
  sif_rate: number
  critical_count: number
  avg_confidence: number
  severity_distribution: Record<string, number>
  iogp_distribution: Record<string, number>
  time_series: TimeSeriesPoint[]
  top_precursors: PrecursorKeyword[]
  zone_heatmap: ZoneHeatmapEntry[]
}

// ─────────────────────────────────────────────────────────────────────────────
// UI Helpers
// ─────────────────────────────────────────────────────────────────────────────

export type FilterState = {
  severity?: SeverityType
  facility_zone?: string
  iogp_rule?: IOGPRuleType
  status?: StatusType
  query?: string
  hazard?: 'all' | 'hazard' | 'safe'
}

export interface KPICardData {
  label: string
  value: string | number
  delta?: string
  trend?: 'up' | 'down' | 'neutral'
  icon: string
  color: 'amber' | 'red' | 'green' | 'blue'
}
