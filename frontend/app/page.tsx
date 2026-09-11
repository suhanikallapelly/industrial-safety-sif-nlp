'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { usePredict, useBulkUpload } from '@/hooks/usePredict'
import { useIncidents, useTriage } from '@/hooks/useIncidents'
import { parseCsvContent, type ParsedCsvResult } from '@/lib/csvParser'
import { exportToJson, exportToCsv } from '@/lib/exportUtils'
import { sound } from '@/lib/sound'
import { getStoredIncidents, saveStoredIncidents } from '@/lib/clientInference'
import type { IncidentReport, StatusType, SeverityType } from '@/types'
import {
  ShieldCheck,
  AlertTriangle,
  Flame,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  ClipboardList,
  Check,
  Copy,
  ArrowRight,
  UploadCloud,
  FileSpreadsheet,
  FileJson,
  Search,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { PrimaryIncidentCard } from '@/components/triage/PrimaryIncidentCard'

// ─── Real Workplace Incident Scenarios ────────────────────────
interface ScenarioItem {
  id: string
  title: string
  badge: string
  location: string
  zone: string
  text: string
  summary: string
  category: string
}

const SCENARIOS: ScenarioItem[] = [
  {
    id: 'sc-1',
    title: 'Oil Dispenser Leakages in Factory',
    badge: 'Oil & Fuel Leaks',
    location: 'Duliajan Processing Plant',
    zone: 'Dispenser Bay 03',
    text: 'oil dispensers of a factory, so that I have seen that several leakages are there',
    summary: 'Multiple active oil leaks from factory dispensers creating flammable fluid accumulation.',
    category: 'Oil & Fuel Leaks',
  },
  {
    id: 'sc-2',
    title: 'Small Water Leak in Office',
    badge: 'Routine / Minor Water',
    location: 'Administration Building',
    zone: 'Office Entrance',
    text: 'A small water leak was observed near the office entrance. The area was cleaned immediately and a maintenance request was raised.',
    summary: 'Minor domestic water dripping near entrance, promptly mopped and maintenance ticket logged.',
    category: 'Routine / Minor Water',
  },
  {
    id: 'sc-3',
    title: '33kV Substation Lockout Bypass',
    badge: 'Electrical Safety',
    location: 'Moran Substation-B',
    zone: 'Electrical Switchgear Room',
    text: 'Electrician bypassed lockout/tagout protocol on 33kV switchgear feeder panel without testing for dead. Accidental phase-to-ground flashover occurred causing high-voltage arc blast and severe burns.',
    summary: 'High-voltage circuit accessed without de-energizing or verifying zero energy state.',
    category: 'Electrical Safety',
  },
  {
    id: 'sc-4',
    title: 'Derrick Mast Dropped Clamp',
    badge: 'Falling Objects',
    location: 'Naharkatiya Rig-12',
    zone: 'Drill Floor Red Zone',
    text: 'During casing running operation, a 28kg hydraulic rotary hose clamp detached from 18m elevation on the derrick mast and fell onto the drill floor. Red Zone exclusion barrier was breached by roustabouts.',
    summary: 'Heavy 28kg clamp detached aloft and fell into working crew area.',
    category: 'Falling Objects',
  },
]

export default function SafetyHomePage() {
  const [activeTab, setActiveTab] = useState<'single' | 'csv'>('single')

  // Single Report Form State
  const [text, setText] = useState('')
  const [location, setLocation] = useState('Duliajan Central Facility')
  const [zone, setZone] = useState('Factory Area')
  const [copied, setCopied] = useState(false)

  // CSV State
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvParsed, setCsvParsed] = useState<ParsedCsvResult | null>(null)
  const [selectedTextColumn, setSelectedTextColumn] = useState<string>('')
  const [isParsingCsv, setIsParsingCsv] = useState(false)
  const [csvParseError, setCsvParseError] = useState<string | null>(null)
  const [batchSummary, setBatchSummary] = useState<{
    total: number
    processed: number
    hazards: number
    safe: number
  } | null>(null)

  // Incident Records Table State
  const [recentIncidents, setRecentIncidents] = useState<IncidentReport[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [hazardFilter, setHazardFilter] = useState<'all' | 'hazard' | 'safe'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  // Hooks
  const { mutate: predict, isPending: predictPending, data: result, reset: resetPredict } = usePredict()
  const { mutate: runBulkUpload, isPending: bulkPending } = useBulkUpload()
  const { data: auditData, refetch: refetchAudit, isLoading: isAuditLoading } = useIncidents(
    {
      query: searchQuery || undefined,
      hazard: hazardFilter,
      status: (statusFilter as StatusType) || undefined,
    },
    currentPage,
    pageSize
  )
  const { mutate: updateRecord } = useTriage()

  // Load persistent client history on mount
  useEffect(() => {
    const saved = getStoredIncidents()
    if (saved && saved.length > 0) {
      setRecentIncidents(saved)
    }
  }, [])

  // Dropzone for CSV
  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    setCsvFile(file)
    setCsvParseError(null)
    setIsParsingCsv(true)
    sound.playClick()

    try {
      const fileText = await file.text()
      const parsed = parseCsvContent(fileText)
      setCsvParsed(parsed)
      setSelectedTextColumn(parsed.suggestedTextColumn || parsed.headers[0] || '')
    } catch (err: any) {
      setCsvParseError(err?.message || 'Failed to parse CSV file.')
    } finally {
      setIsParsingCsv(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'text/tab-separated-values': ['.tsv'], 'text/plain': ['.txt'] },
    maxFiles: 1,
  })

  // Single Report Check Action
  const handleAnalyze = () => {
    if (text.trim().length < 8) return
    sound.playScan()
    predict(
      { text: text.trim(), location, facility_zone: zone },
      {
        onSuccess: (res) => {
          if (res.sif_potential) {
            sound.playAlert()
          } else {
            sound.playSuccess()
          }
          const newlyAdded: IncidentReport = {
            id: res.incident_id,
            timestamp: res.timestamp,
            location,
            facility_zone: zone,
            free_text: text.trim(),
            sif_potential: res.sif_potential,
            confidence_score: res.confidence_score,
            iogp_rule: res.iogp_rule,
            xai_tokens: res.xai_tokens,
            tracked_words: res.tracked_words,
            status: 'Pending',
            severity_level: res.severity_level,
            reporter_name: 'Field Safety Lead',
            reporter_role: 'Operations Reviewer',
            action_checklist: res.action_checklist,
            barriers: res.barriers,
          }
          setRecentIncidents((prev) => [newlyAdded, ...prev.filter((i) => i.id !== newlyAdded.id)])
          saveStoredIncidents([newlyAdded, ...getStoredIncidents().filter((i) => i.id !== newlyAdded.id)])
          setCurrentPage(1)
          refetchAudit()
        },
      }
    )
  }

  // Batch CSV Pipeline Action
  const handleBulkPipeline = () => {
    if (!csvFile || !selectedTextColumn) return
    sound.playScan()
    runBulkUpload(
      { file: csvFile, textColumn: selectedTextColumn },
      {
        onSuccess: (res) => {
          sound.playSuccess()
          setBatchSummary({
            total: res.total_records,
            processed: res.processed,
            hazards: res.sif_detected,
            safe: res.processed - res.sif_detected,
          })
          refetchAudit()
        },
        onError: (err) => {
          sound.playAlert()
          setCsvParseError('Batch upload failed: ' + err.message)
        },
      }
    )
  }

  // Load Scenario from Cards
  const loadScenario = (sc: ScenarioItem) => {
    sound.playClick()
    setText(sc.text)
    setLocation(sc.location)
    setZone(sc.zone)
    resetPredict()
    window.scrollTo({ top: 120, behavior: 'smooth' })
  }

  // Copy Result Summary
  const handleCopyResult = () => {
    if (!result) return
    sound.playSuccess()
    const summary = `SAFETY EVALUATION SUMMARY:\nStatus: ${result.sif_potential ? 'HIGH DANGER HAZARD' : 'SAFE / ROUTINE'}\nConfidence: ${(result.confidence_score * 100).toFixed(0)}%\nReport: ${text}\nExplanation: ${result.explanation}`
    navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Filtered Incident History & Pagination Across 5,250+ Records
  const totalAuditRecords = auditData?.total ?? 5248
  const totalPages = Math.max(1, Math.ceil(totalAuditRecords / pageSize))

  const displayIncidents = useMemo(() => {
    const serverList = auditData?.incidents ?? []
    if (currentPage === 1 && !searchQuery.trim() && hazardFilter === 'all' && !statusFilter) {
      const mergedMap = new Map<string, IncidentReport>()
      recentIncidents.forEach((i) => mergedMap.set(i.id, i))
      serverList.forEach((i) => {
        if (!mergedMap.has(i.id)) mergedMap.set(i.id, i)
      })
      return Array.from(mergedMap.values()).slice(0, pageSize)
    }
    return serverList
  }, [auditData, recentIncidents, currentPage, searchQuery, hazardFilter, statusFilter, pageSize])

  const handleUpdateStatus = (id: string, newStatus: StatusType) => {
    sound.playSuccess()
    setRecentIncidents((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
    )
    const stored = getStoredIncidents()
    if (stored.some((i) => i.id === id)) {
      saveStoredIncidents(
        stored.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
      )
    }
    updateRecord({
      id,
      update: {
        status: newStatus,
        reviewer_notes: `Marked as ${newStatus} by Safety Officer`,
        reviewed_by: 'Safety Lead',
      },
    })
  }

  return (
    <div className="w-full space-y-12 pb-36 font-sans">
      {/* ─── HERO & PRIMARY INPUT WORKSPACE ─── */}
      <div
        className={`w-full flex flex-col justify-center items-center space-y-10 transition-all duration-300 ${
          !result ? 'py-4 sm:py-8' : 'pt-2 pb-2'
        }`}
      >
        {/* HERO / PAGE HEADER */}
        <section className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold tracking-wider font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            AI SAFETY INTELLIGENCE PLATFORM
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-none font-display">
            Precursor Risk Intelligence
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto font-normal leading-relaxed">
            Real-time transformer NLP analysis for identifying high-consequence workplace safety precursors.
          </p>

          <div className="flex items-center justify-center gap-2 pt-4 mb-2">
            <div className="p-1 rounded-xl bg-slate-900/90 border border-white/15 flex items-center gap-1 shadow-lg backdrop-blur-md">
              <button
                type="button"
                onClick={() => {
                  sound.playClick()
                  setActiveTab('single')
                }}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'single'
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Single Incident
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick()
                  setActiveTab('csv')
                }}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'csv'
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Batch Import (CSV)
              </button>
            </div>
          </div>
        </section>

        {/* PRIMARY WORKSPACE CARD */}
        <section className="w-full">
          {activeTab === 'single' ? (
            <PrimaryIncidentCard
              text={text}
              setText={setText}
              location={location}
              setLocation={setLocation}
              zone={zone}
              setZone={setZone}
              onAnalyze={handleAnalyze}
              isPending={predictPending}
              minChars={8}
            />
          ) : (
            /* Batch File Ingestion Card */
            <div className="glass-panel p-6 sm:p-8 rounded-2xl space-y-6">
              <div
                {...getRootProps()}
                className={`p-8 sm:p-12 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-3 ${
                  isDragActive
                    ? 'border-cyan-400 bg-cyan-500/10'
                    : 'border-white/15 hover:border-cyan-500/40 bg-slate-900/50'
                }`}
              >
                <input {...getInputProps()} />
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-base font-semibold text-white">
                    {csvFile ? csvFile.name : 'Click or Drag & Drop CSV / TSV File Here'}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                    Upload spreadsheets containing field incident descriptions for automated batch precursor evaluation.
                  </p>
                </div>
                {csvFile && (
                  <span className="text-xs font-mono text-cyan-300 bg-cyan-500/20 px-3.5 py-1 rounded-full border border-cyan-500/30 font-semibold">
                    {(csvFile.size / 1024).toFixed(1)} KB Ready
                  </span>
                )}
              </div>

              {isParsingCsv && (
                <div className="flex items-center justify-center gap-2 text-xs text-cyan-400 py-2 font-mono">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Reading spreadsheet column headers...</span>
                </div>
              )}

              {csvParseError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{csvParseError}</span>
                </div>
              )}

              {csvParsed && (
                <div className="p-6 rounded-xl bg-slate-900/80 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs font-semibold text-slate-300">
                    <span>{csvParsed.headers.length} Columns Discovered</span>
                    <span className="text-emerald-400 font-mono">✓ {csvParsed.rows.length} Records Loaded</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <label className="block text-[11px] uppercase font-semibold text-slate-400 mb-1.5 font-mono">
                        Incident Narrative Column:
                      </label>
                      <select
                        value={selectedTextColumn}
                        onChange={(e) => setSelectedTextColumn(e.target.value)}
                        className="w-full bg-slate-950 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400 cursor-pointer font-sans"
                      >
                        {csvParsed.headers.map((h, i) => (
                          <option key={i} value={h}>
                            {h} {h === csvParsed.suggestedTextColumn ? '★ (Recommended)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="self-end sm:self-auto pt-2">
                      <button
                        type="button"
                        onClick={handleBulkPipeline}
                        disabled={!selectedTextColumn || bulkPending}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-600 text-slate-950 font-bold text-xs hover:brightness-110 transition-all cursor-pointer flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-40"
                      >
                        <Sparkles className="w-4 h-4 text-slate-950" />
                        <span>{bulkPending ? 'Evaluating...' : `Run Batch Analysis (${csvParsed.rows.length} Rows)`}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {batchSummary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 text-center">
                    <div className="text-2xl font-bold font-mono text-cyan-400">{batchSummary.total}</div>
                    <div className="text-[10px] text-slate-400 uppercase mt-0.5 font-mono">Total Rows</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 text-center">
                    <div className="text-2xl font-bold font-mono text-emerald-400">{batchSummary.processed}</div>
                    <div className="text-[10px] text-slate-400 uppercase mt-0.5 font-mono">Processed</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 text-center">
                    <div className="text-2xl font-bold font-mono text-rose-400">{batchSummary.hazards}</div>
                    <div className="text-[10px] text-slate-400 uppercase mt-0.5 font-mono font-bold">Hazards</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 text-center">
                    <div className="text-2xl font-bold font-mono text-slate-300">{batchSummary.safe}</div>
                    <div className="text-[10px] text-slate-400 uppercase mt-0.5 font-mono">Routine</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* ─── AI RISK ASSESSMENT RESULT REPORT ─── */}
      <AnimatePresence>
        {result && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            {/* Main Result Card */}
            <div
              className={`p-8 sm:p-10 lg:p-12 rounded-2xl glass-panel relative overflow-hidden transition-all duration-500 ${
                result.sif_potential
                  ? 'border-rose-500/40 shadow-[0_0_50px_rgba(244,63,94,0.15)] bg-rose-950/20'
                  : 'border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.15)] bg-emerald-950/20'
              }`}
            >
              {/* Header Row: Status + Metrics */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-8 pb-8 border-b border-white/10">
                {/* Left: Icon + Status + Title */}
                <div className="flex items-start gap-5 min-w-0">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                      result.sif_potential
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}
                  >
                    {result.sif_potential ? (
                      <Flame className="w-8 h-8 text-rose-400" />
                    ) : (
                      <ShieldCheck className="w-8 h-8 text-emerald-400" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                      <span
                        className={`text-[11px] font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider font-mono ${
                          result.sif_potential
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {result.sif_potential ? '⚠ HIGH RISK SIF PRECURSOR' : '✓ ROUTINE INCIDENT'}
                      </span>
                      {result.iogp_rule && (
                        <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono">
                          IOGP: {result.iogp_rule}
                        </span>
                      )}
                      {result.severity_level && (
                        <span
                          className={`text-[11px] font-bold px-3 py-1 rounded-full font-mono uppercase tracking-wider ${
                            result.severity_level === 'Critical'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : result.severity_level === 'High'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : result.severity_level === 'Medium'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-green-500/20 text-green-400 border border-green-500/30'
                          }`}
                        >
                          SEV: {result.severity_level.toUpperCase()}
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                      {result.sif_potential
                        ? 'High Danger Hazard Precursor'
                        : 'Routine Workplace Observation'}
                    </h2>
                  </div>
                </div>

                {/* Right: Confidence Gauge + Copy */}
                <div className="flex items-center gap-5 self-end sm:self-start flex-shrink-0">
                  <div className="text-center">
                    <div
                      className={`text-3xl font-extrabold font-mono px-4 py-2 rounded-xl border ${
                        result.sif_potential
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {(result.confidence_score * 100).toFixed(0)}%
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase tracking-wider font-mono">Confidence</div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyResult}
                    title="Copy evaluation summary"
                    className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer shadow-md"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Rationale Explanation */}
              <div className="pt-6 space-y-6">
                <div>
                  <div className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-2 font-mono">AI Assessment Rationale</div>
                  <p className="text-slate-100 text-base leading-relaxed font-sans">
                    {result.explanation}
                  </p>
                </div>

                {result.tracked_words && result.tracked_words.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-3 font-mono">Triggered Keywords</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {result.tracked_words.map((w, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-lg text-xs font-mono font-medium bg-rose-500/10 text-rose-300 border border-rose-500/30 flex items-center gap-1.5"
                        >
                          <Flame className="w-3 h-3 text-rose-400" />
                          {typeof w === 'string' ? w : w.word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations & Safety Barriers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {result.action_checklist && result.action_checklist.length > 0 && (
                <div className="glass-panel p-6 sm:p-8 rounded-2xl space-y-5">
                  <div className="flex items-center gap-2.5 pb-4 border-b border-white/10">
                    <ClipboardList className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Action Checklist</span>
                    <span className="text-[10px] font-mono text-slate-400 ml-auto bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">{result.action_checklist.length} steps</span>
                  </div>
                  <div className="space-y-3">
                    {result.action_checklist.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/60 border border-white/5 hover:border-cyan-500/30 transition-all">
                        <span className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-semibold text-slate-100">{item.step}</span>
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex-shrink-0 uppercase">{item.phase}</span>
                          </div>
                          <p className="text-slate-400 text-xs leading-relaxed">{item.directive}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.barriers && result.barriers.length > 0 && (
                <div className="glass-panel p-6 sm:p-8 rounded-2xl space-y-5">
                  <div className="flex items-center gap-2.5 pb-4 border-b border-white/10">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Safety Barriers</span>
                    <span className="text-[10px] font-mono ml-auto">
                      <span className="text-emerald-400 font-semibold">{result.barriers.filter(b => b.ok).length} OK</span>
                      {result.barriers.some(b => !b.ok) && (
                        <span className="text-rose-400 ml-2 font-semibold">{result.barriers.filter(b => !b.ok).length} BREACHED</span>
                      )}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {result.barriers.map((b, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-3.5 p-4 rounded-xl border transition-all ${
                          b.ok
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : 'bg-rose-500/5 border-rose-500/20'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          b.ok ? 'bg-emerald-500/15' : 'bg-rose-500/15'
                        }`}>
                          {b.ok ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-slate-200">{b.name}</div>
                          <div className={`text-[11px] font-medium mt-0.5 ${b.ok ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>
                            {b.status}
                          </div>
                        </div>
                        <span className={`text-[9px] font-bold px-2.5 py-1 rounded-md font-mono tracking-wider ${
                          b.ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {b.ok ? 'ACTIVE' : 'BREACHED'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ─── SUGGESTED SCENARIOS ─── */}
      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Industry Benchmark Scenarios
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Test real-world oil & gas field observations against the precursor classifier.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SCENARIOS.map((sc) => (
            <div
              key={sc.id}
              onClick={() => loadScenario(sc)}
              className="glass-panel p-6 rounded-2xl hover:border-cyan-500/40 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    {sc.badge}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">{sc.zone}</span>
                </div>

                <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                  {sc.title}
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {sc.summary}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 group-hover:text-white pt-4 mt-4 border-t border-white/5 transition-colors">
                <span>Load Scenario</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-cyan-400" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HISTORICAL AUDIT REGISTRY ─── */}
      <section className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-xl font-bold text-white tracking-tight">
                Incident Audit Registry
              </h3>
              <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                {totalAuditRecords.toLocaleString()} RECORDS ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Verified workplace safety observations across all facilities
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportToJson(displayIncidents, `safety_records_${Date.now()}.json`)}
              disabled={displayIncidents.length === 0}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-30"
            >
              <FileJson className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export JSON</span>
            </button>
            <button
              type="button"
              onClick={() => exportToCsv(displayIncidents, `safety_records_${Date.now()}.csv`)}
              disabled={displayIncidents.length === 0}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-30"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Controls + Table Container */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          {/* Filters */}
          <div className="p-5 sm:p-6 border-b border-white/10 bg-slate-950/40">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Search description, location..."
                  className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>

              <select
                value={hazardFilter}
                onChange={(e) => {
                  setHazardFilter(e.target.value as any)
                  setCurrentPage(1)
                }}
                className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer transition-colors"
              >
                <option value="all">All Classifications</option>
                <option value="hazard">SIF Precursors Only</option>
                <option value="safe">Routine Reports Only</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer transition-colors"
              >
                <option value="">All Triage Statuses</option>
                <option value="Pending">Pending Review</option>
                <option value="Reviewed">Reviewed</option>
                <option value="Escalated">Escalated</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-white/10">
                  <th className="pl-6 pr-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Classification</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Incident Observation</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Location & Zone</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Severity</th>
                  <th className="px-4 pr-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Status Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {displayIncidents.map((inc) => (
                  <tr
                    key={inc.id}
                    className="hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="pl-6 pr-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide font-mono ${
                          inc.sif_potential
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          inc.sif_potential ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'
                        }`} />
                        {inc.sif_potential ? 'CRITICAL SIF' : 'ROUTINE'}
                      </span>
                    </td>
                    <td className="px-4 py-4 max-w-sm" title={inc.free_text}>
                      <span className="text-slate-200 text-xs leading-relaxed line-clamp-2">
                        {inc.free_text}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-xs text-slate-200 font-medium">{inc.location}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{inc.facility_zone}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md font-mono ${
                        inc.severity_level === 'Critical' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                        inc.severity_level === 'High' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                        inc.severity_level === 'Medium' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                        'bg-green-500/15 text-green-400 border border-green-500/30'
                      }`}>
                        {inc.severity_level?.toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 pr-6 py-4 whitespace-nowrap">
                      <select
                        value={inc.status}
                        onChange={(e) => handleUpdateStatus(inc.id, e.target.value as StatusType)}
                        className={`bg-slate-900 border rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-cyan-500/50 cursor-pointer transition-colors ${
                          inc.status === 'Pending' ? 'border-amber-500/30 text-amber-300' :
                          inc.status === 'Reviewed' ? 'border-blue-500/30 text-blue-300' :
                          inc.status === 'Escalated' ? 'border-rose-500/30 text-rose-300' :
                          'border-emerald-500/30 text-emerald-300'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Reviewed">Reviewed</option>
                        <option value="Escalated">Escalated</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {displayIncidents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-500 text-xs font-mono">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="w-5 h-5 text-slate-600" />
                        <span>No incident records found matching your active filter criteria.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-5 border-t border-white/10 bg-slate-950/40 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages}</span>
              <span className="hidden sm:inline text-slate-500 ml-2">({totalAuditRecords.toLocaleString()} total verified records)</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => {
                  sound.playClick()
                  setCurrentPage((p) => Math.max(1, p - 1))
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 disabled:opacity-30 cursor-pointer text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Prev</span>
              </button>
              <span className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs font-bold font-mono text-cyan-400">
                {currentPage}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => {
                  sound.playClick()
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 disabled:opacity-30 cursor-pointer text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
