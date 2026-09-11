'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { useBulkUpload } from '@/hooks/usePredict'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import {
  Upload,
  FileText,
  AlertTriangle,
  Download,
  Sparkles,
  CheckCircle2,
  Flame,
  Radio,
} from 'lucide-react'
import type { BulkRowResult } from '@/types'
import { sound } from '@/lib/sound'

export function BulkUpload() {
  const [results, setResults] = useState<BulkRowResult[] | null>(null)
  const [summary, setSummary] = useState<{ total: number; sif: number; critical: number } | null>(null)
  const { mutate: upload, isPending, isError, error } = useBulkUpload()

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (!accepted[0]) return
      sound.playScan()
      setResults(null)
      setSummary(null)
      upload(accepted[0], {
        onSuccess: (data) => {
          sound.playSuccess()
          setResults(data.results)
          setSummary({ total: data.total_records, sif: data.sif_detected, critical: data.critical_count })
        },
        onError: () => {
          sound.playAlert()
        },
      })
    },
    [upload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxFiles: 1,
    disabled: isPending,
  })

  const downloadSampleCSV = () => {
    sound.playClick()
    const sampleContent = `text,location,facility_zone
"Worker bypassed lockout tagout on high voltage 33kV transformer panel and received severe flash burn. No isolation certificate obtained.","Duliajan Field","Electrical Substation"
"Technician entered separator tank without gas testing. H2S concentration reached 110 ppm. Standby person absent.","Digboi Processing","Tank Farm"
"Scaffold plank dislodged at 14m height on derrick mast. Unsecured clamp fell near rotary floor. Red Zone breached.","Naharkatiya Field","Rig Floor"
"Routine visual inspection of flare line valves completed with cold work permit. All safety seals intact.","Moran Field","Flare Stack"
"Uncertified wire rope sling utilized for 4.5 ton pump lifting. Safety latch missing on crane hook.","Duliajan Central","Pipe Rack"`

    const blob = new Blob([sampleContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'OIL_Incident_Sample_Batch.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Sample Download Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 border glass-panel hud-corner-brackets" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2.5 text-xs font-tech">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-slate-300">Format Guide: CSV or XLSX with <code className="font-mono text-amber-400">text</code>, <code className="font-mono text-cyan-400">location</code>, and <code className="font-mono text-emerald-400">facility_zone</code> headers.</span>
        </div>
        <button
          onClick={downloadSampleCSV}
          className="flex items-center gap-2 px-3 py-1.5 border text-xs font-hud font-bold text-amber-300 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 transition-all cursor-pointer flex-shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          DOWNLOAD TEMPLATE (.CSV)
        </button>
      </div>

      {/* Cyber Drag and Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed p-10 sm:p-14 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden glass-panel ${
          isDragActive
            ? 'border-amber-400 bg-amber-500/10 shadow-2xl shadow-amber-500/20 scale-[1.01]'
            : 'hover:border-amber-500/50'
        }`}
        style={{ borderColor: isDragActive ? '#f59e0b' : 'var(--border)' }}
      >
        <input {...getInputProps()} />

        <motion.div
          animate={{ scale: isDragActive ? 1.15 : 1, y: isDragActive ? -4 : 0 }}
          className="w-16 h-16 flex items-center justify-center mb-4 shadow-xl relative"
          style={{ background: 'rgba(245,158,11,0.15)', border: '2px solid rgba(245,158,11,0.4)' }}
        >
          <Upload className="w-8 h-8 text-amber-400" />
        </motion.div>

        {isPending ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 -rotate-90 animate-spin" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="#132840" strokeWidth="4" />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="4"
                  strokeDasharray="150.8"
                  strokeDashoffset="38"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p className="text-xs font-hud font-bold text-amber-400 tracking-wider">
              BATCH NLP INFERENCE IN PROGRESS...
            </p>
            <span className="text-[11px] font-mono text-slate-400">Classifying SIF Precursors & IOGP rules</span>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <p className="text-sm font-hud font-bold text-slate-100 tracking-wider">
              {isDragActive ? 'RELEASE FILE TO COMMENCE INGESTION' : 'DRAG & DROP CSV / EXCEL INCIDENT DUMP'}
            </p>
            <p className="text-xs font-tech text-slate-400 max-w-md mx-auto">
              Automated multi-record parsing with batch token attribution, SIF severity labeling, and database synchronization.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              {['.CSV (Comma-Separated)', '.XLSX (Excel Sheet)'].map((ext) => (
                <span
                  key={ext}
                  className="text-[10px] px-2.5 py-1 border font-mono bg-slate-950/80 text-slate-400 border-slate-800"
                >
                  {ext}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error Feedback */}
      <AnimatePresence>
        {isError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-4 border bg-red-500/10 border-red-500/30 text-red-300 text-xs font-mono"
          >
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p>{(error as Error)?.message ?? 'Ingestion failed. Ensure column names match.'}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing Summary Ribbon */}
      <AnimatePresence>
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3.5"
          >
            {[
              { label: 'TOTAL RECORDS PROCESSED', value: summary.total, color: '#38bdf8', class: 'text-cyan-400' },
              { label: 'SIF PRECURSORS DETECTED', value: summary.sif, color: '#f59e0b', class: 'text-amber-400 text-glow-amber' },
              { label: 'CRITICAL HIGH-HAZARDS', value: summary.critical, color: '#ef4444', class: 'text-red-400 text-glow-red' },
            ].map(({ label, value, color, class: valClass }) => (
              <div
                key={label}
                className="p-4 border glass-panel text-center hud-corner-brackets"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className={`text-2xl font-hud font-bold mb-1 ${valClass}`}>{value}</div>
                <div className="text-[10px] font-tech font-bold uppercase tracking-wider text-slate-400">{label}</div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Classification Results Table */}
      <AnimatePresence>
        {results && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="border overflow-hidden glass-panel-glow"
            style={{ borderColor: 'var(--border)' }}
          >
            <div
              className="px-5 py-3.5 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-hud font-bold text-slate-100">
                  BATCH INFERENCE RESULTS ({results.length} ROWS)
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                INGESTION COMPLETE
              </span>
            </div>
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-xs font-tech">
                <thead>
                  <tr className="border-b text-slate-400 text-[10px] font-hud uppercase tracking-wider bg-slate-950/80" style={{ borderColor: 'var(--border)' }}>
                    <th className="px-4 py-2.5 text-left">#</th>
                    <th className="px-4 py-2.5 text-left">Report Preview</th>
                    <th className="px-4 py-2.5 text-left">SIF Flag</th>
                    <th className="px-4 py-2.5 text-left">Severity</th>
                    <th className="px-4 py-2.5 text-left">IOGP Rule</th>
                    <th className="px-4 py-2.5 text-left">Confidence Score</th>
                    <th className="px-4 py-2.5 text-left">Log ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {results.map((r, i) => (
                    <motion.tr
                      key={r.incident_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-amber-500/5 transition-colors text-slate-300"
                    >
                      <td className="px-4 py-2.5 font-mono text-[10px] text-slate-500">{r.row_index}</td>
                      <td className="px-4 py-2.5 max-w-xs truncate font-sans text-[11px] text-slate-200">
                        {r.text_preview}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-hud font-bold ${
                            r.sif_potential
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          }`}
                        >
                          {r.sif_potential ? 'SIF' : 'NON-SIF'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <SeverityBadge severity={r.severity_level} />
                      </td>
                      <td className="px-4 py-2.5 font-bold text-amber-300">{r.iogp_rule ?? '—'}</td>
                      <td className="px-4 py-2.5 font-mono text-emerald-400">
                        {(r.confidence_score * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-slate-500">{r.incident_id}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
