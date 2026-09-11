'use client'

import { BulkUpload } from '@/components/upload/BulkUpload'
import { UploadCloud, Layers } from 'lucide-react'

export default function UploadPage() {
  return (
    <div className="w-full space-y-6 pb-16">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl relative overflow-hidden flex items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest font-mono">
              Batch Ingestion Engine
            </span>
            <span className="text-xs text-cyan-400 font-mono flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> High-Throughput Pipeline
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Bulk Dataset Ingestion & Precursor Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            Upload CSV or structured datasets containing workplace safety narratives. Process thousands of records with zero-shot transformer classification.
          </p>
        </div>

        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)] flex-shrink-0">
          <UploadCloud className="w-7 h-7" />
        </div>
      </div>

      <BulkUpload />
    </div>
  )
}
