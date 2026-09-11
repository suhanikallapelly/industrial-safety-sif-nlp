'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useIncidents } from '@/hooks/useIncidents'
import { IncidentCard } from './IncidentCard'
import { XAIInspector } from '@/components/xai/XAIInspector'
import type { IncidentReport, SeverityType, StatusType } from '@/types'
import { Filter, RefreshCw, X, ShieldAlert, Sparkles } from 'lucide-react'
import { sound } from '@/lib/sound'

const SEVERITY_ORDER: Record<SeverityType, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }

export function TriageQueue() {
  const [filterSeverity, setFilterSeverity] = useState<SeverityType | ''>('')
  const [filterStatus, setFilterStatus] = useState<StatusType | ''>('')
  const [selected, setSelected] = useState<IncidentReport | null>(null)

  const { data, isLoading, refetch, isFetching } = useIncidents({
    severity: filterSeverity || undefined,
    status: filterStatus || undefined,
  }, 1, 100)

  const sorted = [...(data?.incidents ?? [])].sort(
    (a, b) => SEVERITY_ORDER[a.severity_level] - SEVERITY_ORDER[b.severity_level]
  )

  // Keyboard navigation shortcuts (J/K)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement).tagName.toLowerCase())) return
      if (e.key === 'j' || e.key === 'ArrowDown') {
        if (!sorted.length) return
        const currentIndex = sorted.findIndex((i) => i.id === selected?.id)
        const nextIndex = (currentIndex + 1) % sorted.length
        setSelected(sorted[nextIndex])
        sound.playBeep(900, 0.02)
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        if (!sorted.length) return
        const currentIndex = sorted.findIndex((i) => i.id === selected?.id)
        const prevIndex = currentIndex <= 0 ? sorted.length - 1 : currentIndex - 1
        setSelected(sorted[prevIndex])
        sound.playBeep(900, 0.02)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [sorted, selected])

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-full">
      {/* Left List panel */}
      <div className="flex flex-col w-full lg:max-w-xl flex-shrink-0 h-full">
        {/* Filter Toolbar */}
        <div className="p-3.5 border glass-panel mb-3 space-y-2.5" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-hud font-bold text-slate-100">FILTER PRECURSOR MATRIX</span>
            </div>
            <button
              onClick={() => {
                sound.playClick()
                refetch()
              }}
              className="p-1.5 border border-slate-800 text-slate-400 hover:text-white hover:border-amber-500/40 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>

          {/* Severity filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap font-tech text-xs">
            <span className="text-[10px] font-mono text-slate-400 mr-1">SEVERITY:</span>
            {(['', 'Critical', 'High', 'Medium', 'Low'] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  sound.playClick()
                  setFilterSeverity(s)
                }}
                className={`px-2.5 py-1 border text-xs font-bold transition-all ${
                  filterSeverity === s
                    ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {s === '' ? 'ALL' : s.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap font-tech text-xs">
            <span className="text-[10px] font-mono text-slate-400 mr-1">STATUS:</span>
            {(['', 'Pending', 'Escalated', 'Resolved'] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  sound.playClick()
                  setFilterStatus(st)
                }}
                className={`px-2.5 py-0.5 border text-[11px] font-mono transition-all ${
                  filterStatus === st
                    ? 'bg-cyan-500 text-black border-cyan-400 font-bold'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {st === '' ? 'ALL' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Count & keyboard hint */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2 px-1">
          <span>{sorted.length} ACTIVE INCIDENTS SHOWN ({(data?.total ?? 5248).toLocaleString()}+ TOTAL AUDIT BASELINE)</span>
          <span className="hidden sm:inline text-amber-400/80">Press <kbd className="px-1 bg-slate-800 border border-slate-700">J</kbd>/<kbd className="px-1 bg-slate-800 border border-slate-700">K</kbd> to navigate</span>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 pb-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse glass-panel" />
            ))
          ) : sorted.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-slate-400 border glass-panel">
              No incidents matching the active filter criteria.
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {sorted.map((inc) => (
                <IncidentCard
                  key={inc.id}
                  incident={inc}
                  isSelected={selected?.id === inc.id}
                  onClick={() => setSelected(inc)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Right Detail panel */}
      <div className="flex-1 h-full min-h-[400px]">
        {selected ? (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full border glass-panel-glow overflow-y-auto p-5"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-hud font-bold text-slate-100">
                  DEEP XAI INSPECTION · {selected.id}
                </h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 border border-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <XAIInspector incident={selected} />
          </motion.div>
        ) : (
          <div className="h-full border glass-panel flex flex-col items-center justify-center p-8 text-center" style={{ borderColor: 'var(--border)' }}>
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div className="font-hud font-bold text-slate-200 text-sm mb-1">NO INCIDENT SELECTED</div>
            <p className="text-xs font-tech text-slate-400 max-w-xs">
              Click any incident report from the triage stream to inspect token-level XAI reasoning and barrier analysis.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
