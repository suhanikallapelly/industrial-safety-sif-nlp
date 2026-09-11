'use client'

import { TriageQueue } from '@/components/triage/TriageQueue'
import { ClipboardList, ShieldAlert } from 'lucide-react'

export default function TriagePage() {
  return (
    <div className="h-full flex flex-col space-y-6 w-full">
      {/* Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl relative overflow-hidden flex items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 uppercase tracking-widest font-mono">
              Incident Governance
            </span>
            <span className="text-xs text-purple-400 font-mono flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> 5,250+ Baseline Audit Records
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Safety Precursor Review & Triage Stream
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            Real-time audit queue of processed workplace incidents. Filter by severity level or operational state, inspect token-level explainability, and take immediate escalation action.
          </p>
        </div>

        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.2)] flex-shrink-0">
          <ClipboardList className="w-7 h-7" />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <TriageQueue />
      </div>
    </div>
  )
}
