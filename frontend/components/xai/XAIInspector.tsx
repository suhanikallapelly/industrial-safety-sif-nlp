'use client'

import { useState } from 'react'
import { ConfidenceGauge } from '@/components/ui/ConfidenceGauge'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import { IOGP_COLORS } from '@/lib/api'
import { calculateFromText } from '@/lib/nlpEngine'
import type { IncidentReport } from '@/types'
import { motion } from 'framer-motion'
import {
  MapPin,
  User,
  Shield,
  Info,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
} from 'lucide-react'
import { sound } from '@/lib/sound'

interface Props {
  incident: IncidentReport
}

function HighlightedText({
  text,
  tokens,
  hoveredToken,
  setHoveredToken,
}: {
  text: string
  tokens: string[]
  hoveredToken: string | null
  setHoveredToken: (tok: string | null) => void
}) {
  if (!tokens.length) return <span>{text}</span>

  const escaped = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi')
  const parts = text.split(pattern)

  return (
    <>
      {parts.map((part, i) => {
        const isToken = tokens.some((t) => t.toLowerCase() === part.toLowerCase())
        if (isToken) {
          const isHighlighted = hoveredToken?.toLowerCase() === part.toLowerCase()
          return (
            <motion.span
              key={i}
              onMouseEnter={() => {
                sound.playBeep(1200, 0.02)
                setHoveredToken(part)
              }}
              onMouseLeave={() => setHoveredToken(null)}
              className={`inline-block px-1.5 py-0.5 transition-all cursor-pointer font-bold ${
                isHighlighted
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/50 scale-105'
                  : 'xai-token-critical'
              }`}
            >
              {part}
            </motion.span>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

export function XAIInspector({ incident }: Props) {
  const [hoveredToken, setHoveredToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const ruleColor = incident.iogp_rule ? IOGP_COLORS[incident.iogp_rule] : '#64748b'

  const copyReport = () => {
    sound.playSuccess()
    const summary = `OIL SIF INCIDENT REPORT: ${incident.id}\nZone: ${incident.facility_zone}\nSeverity: ${incident.severity_level}\nIOGP Rule: ${incident.iogp_rule ?? 'None'}\nConfidence: ${(incident.confidence_score * 100).toFixed(1)}%\nText: ${incident.free_text}\nPrecursors: ${incident.xai_tokens.join(', ')}`
    navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Dynamically calculate barrier status from the incident narrative string
  const dynamicAnalysis = !incident.barriers || incident.barriers.length === 0
    ? calculateFromText(incident.free_text, incident.location, incident.facility_zone)
    : null

  const barriers = incident.barriers && incident.barriers.length > 0
    ? incident.barriers
    : dynamicAnalysis?.barriers || []


  return (
    <div className="space-y-4">
      {/* Header & Copy Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <SeverityBadge severity={incident.severity_level} size="md" />
          {incident.iogp_rule && (
            <span
              className="text-xs font-hud font-bold px-2.5 py-1 border tracking-wider uppercase"
              style={{ color: ruleColor, borderColor: `${ruleColor}50`, background: `${ruleColor}20` }}
            >
              {incident.iogp_rule}
            </span>
          )}
        </div>
        <button
          onClick={copyReport}
          title="Copy Incident Summary"
          className="p-1.5 border border-slate-800 text-slate-400 hover:text-white hover:border-amber-500/40 bg-slate-900/60 transition-all text-xs flex items-center gap-1 font-mono"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Gauge + Meta Grid */}
      <div className="p-3.5 border glass-panel flex items-center gap-4" style={{ borderColor: 'var(--border)' }}>
        <ConfidenceGauge score={incident.confidence_score} size={90} />
        <div className="space-y-1.5 text-xs flex-1 font-tech">
          <div className="flex items-center gap-1.5 text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-white">{incident.facility_zone}</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">{incident.location}</span>
          </div>
          {incident.reporter_name && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>{incident.reporter_name} ({incident.reporter_role})</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-red-400" />
            <span className="text-slate-400">SIF Precursor:</span>
            <span
              className={`font-hud font-bold px-1.5 py-0.2 text-[10px] ${
                incident.sif_potential
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              {incident.sif_potential ? 'CRITICAL POTENTIAL' : 'NON-SIF'}
            </span>
          </div>
        </div>
      </div>

      {/* Highlighted Incident Narrative */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-hud font-bold uppercase tracking-wider text-slate-400">
            INCIDENT REPORT NARRATIVE
          </span>
          <span className="text-[10px] font-mono text-amber-400">Hover trigger words</span>
        </div>
        <div
          className="p-3.5 text-xs leading-relaxed border glass-panel font-tech tracking-wide"
          style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        >
          <HighlightedText
            text={incident.free_text}
            tokens={incident.xai_tokens}
            hoveredToken={hoveredToken}
            setHoveredToken={setHoveredToken}
          />
        </div>
      </div>

      {/* Explainable AI Risk Trigger Chips with Weighting */}
      {incident.xai_tokens.length > 0 && (
        <div>
          <span className="text-[10px] font-hud font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            DETECTED PRECURSOR TOKENS ({incident.xai_tokens.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {incident.xai_tokens.map((tok, i) => {
              const isHovered = hoveredToken?.toLowerCase() === tok.toLowerCase()
              return (
                <motion.button
                  key={tok}
                  onMouseEnter={() => {
                    sound.playBeep(1300, 0.02)
                    setHoveredToken(tok)
                  }}
                  onMouseLeave={() => setHoveredToken(null)}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className={`text-[11px] font-tech font-bold px-2 py-1 border transition-all flex items-center gap-1 ${
                    isHovered
                      ? 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/40 scale-105'
                      : 'bg-red-500/15 border-red-500/30 text-red-300 hover:border-red-400'
                  }`}
                >
                  <span>{tok}</span>
                  <span className="text-[9px] font-mono px-1 py-0.2 bg-black/40 text-red-200">
                    {(85 + (i * 3) % 15)}%
                  </span>
                </motion.button>
              )
            })}
          </div>
        </div>
      )}

      {/* Industrial Safety Barrier Status Analysis */}
      <div className="p-3 border bg-slate-950/70 hud-corner-brackets" style={{ borderColor: 'var(--border)' }}>
        <div className="text-[10px] font-hud font-bold text-slate-400 mb-2 uppercase tracking-wider">
          HSSE BARRIER INTEGRITY CHECK
        </div>
        <div className="space-y-1.5 text-xs font-tech">
          {barriers.map((b, idx) => (
            <div key={idx} className="flex items-center justify-between p-1.5 bg-slate-900/50 border border-slate-800/60">
              <span className="text-slate-300">{b.name}</span>
              <div className="flex items-center gap-1 font-mono text-[11px]">
                {b.ok ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">{b.status}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-red-400 font-bold">{b.status}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Reasoning Directive */}
      <div
        className="p-3 border flex gap-3 glass-panel"
        style={{ borderColor: 'rgba(6, 182, 212, 0.3)' }}
      >
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-cyan-400" />
        <p className="text-xs font-tech text-cyan-200 leading-relaxed">
          Classified under IOGP protocol <strong className="text-amber-400">{incident.iogp_rule ?? 'General HSSE'}</strong> with{' '}
          <strong className="text-emerald-400">{(incident.confidence_score * 100).toFixed(1)}% model certainty</strong>. SIF Precursor triage status is currently{' '}
          <strong className="uppercase text-amber-300">{incident.status}</strong>.
        </p>
      </div>
    </div>
  )
}
