'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, ArrowUp, MapPin, Clock, Flame } from 'lucide-react'
import type { IncidentReport } from '@/types'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import { IOGP_COLORS, STATUS_BG } from '@/lib/api'
import { useTriage } from '@/hooks/useIncidents'
import { sound } from '@/lib/sound'

interface Props {
  incident: IncidentReport
  onClick?: () => void
  isSelected?: boolean
}

export function IncidentCard({ incident, onClick, isSelected }: Props) {
  const triage = useTriage()

  const handleResolve = (e: React.MouseEvent) => {
    e.stopPropagation()
    sound.playSuccess()
    triage.mutate({ id: incident.id, update: { status: 'Resolved' } })
  }

  const handleEscalate = (e: React.MouseEvent) => {
    e.stopPropagation()
    sound.playAlert()
    triage.mutate({ id: incident.id, update: { status: 'Escalated' } })
  }

  const ruleColor = incident.iogp_rule ? IOGP_COLORS[incident.iogp_rule] : '#64748b'
  const statusClass = STATUS_BG[incident.status]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 24 }}
      whileHover={{ y: -2 }}
      onClick={() => {
        sound.playClick()
        onClick?.()
      }}
      className={`glass-panel p-5 cursor-pointer transition-all duration-300 rounded-xl relative overflow-hidden group ${
        isSelected
          ? 'border-cyan-400/80 shadow-[0_0_35px_rgba(6,182,212,0.25)] bg-slate-900/90'
          : 'hover:border-cyan-500/40 hover:bg-slate-900/70'
      }`}
    >
      {/* Glow highlight bar on left when selected */}
      {isSelected && (
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-indigo-500 rounded-l-xl" />
      )}

      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <SeverityBadge severity={incident.severity_level} />
          {incident.iogp_rule && (
            <span
              className="text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider font-mono border"
              style={{ color: ruleColor, borderColor: `${ruleColor}40`, background: `${ruleColor}15` }}
            >
              {incident.iogp_rule}
            </span>
          )}
          <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md uppercase ${statusClass}`}>
            {incident.status}
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-500 font-semibold flex-shrink-0">
          {incident.id}
        </span>
      </div>

      {/* Incident narrative preview */}
      <p className="text-xs mb-3.5 line-clamp-2 text-slate-200 leading-relaxed font-sans font-normal">
        {incident.free_text}
      </p>

      {/* XAI tokens */}
      {incident.xai_tokens.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3.5">
          {incident.xai_tokens.slice(0, 4).map((tok) => (
            <span
              key={tok}
              className="px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1 font-mono font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20"
            >
              <Flame className="w-2.5 h-2.5 text-rose-400" />
              {tok}
            </span>
          ))}
          {incident.xai_tokens.length > 4 && (
            <span className="text-[10px] font-mono text-slate-500 px-1 py-0.5">
              +{incident.xai_tokens.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Confidence bar */}
      <div className="mb-3.5">
        <div className="flex justify-between text-[10px] mb-1 font-mono text-slate-400">
          <span>CONFIDENCE SCORE</span>
          <span className="font-bold" style={{ color: incident.sif_potential ? '#ef4444' : '#10b981' }}>
            {(incident.confidence_score * 100).toFixed(0)}%
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-slate-950/80 border border-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${incident.confidence_score * 100}%` }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="h-full rounded-full"
            style={{
              background:
                incident.confidence_score >= 0.8
                  ? 'linear-gradient(90deg, #f43f5e, #ef4444)'
                  : incident.confidence_score >= 0.6
                  ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                  : 'linear-gradient(90deg, #06b6d4, #3b82f6)',
            }}
          />
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-cyan-400" />
            {incident.facility_zone}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-indigo-400" />
            {new Date(incident.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </span>
        </div>

        {incident.status === 'Pending' && (
          <div className="flex gap-1.5">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleEscalate}
              className="flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white"
            >
              <ArrowUp className="w-3 h-3" />
              Escalate
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleResolve}
              className="flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500 hover:text-black"
            >
              <CheckCircle2 className="w-3 h-3" />
              Resolve
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
