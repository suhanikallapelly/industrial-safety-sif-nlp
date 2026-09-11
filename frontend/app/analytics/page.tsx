'use client'

import { AnalyticsPanel } from '@/components/analytics/AnalyticsPanel'
import { useAnalytics } from '@/hooks/useAnalytics'
import { BarChart3, Sparkles, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AnalyticsPage() {
  const { data } = useAnalytics()

  return (
    <div className="w-full space-y-8 pb-16">
      {/* Header Banner */}
      <div className="p-6 bg-[#0D1B2A]/80 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-lg font-bold text-white">
                HSSE Metrics & Risk Intelligence
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20">
                IOGP 5x5 MAPPED
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Multi-dimensional SIF precursor aggregation, predictive trajectory modeling, and facility hazard heatmaps.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/10 text-xs font-mono text-cyan-300">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>CONFIDENCE: 94.2%</span>
        </div>
      </div>

      {/* Top Stat Ribbon */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'TOTAL LOGGED INCIDENTS', value: `${data.total_incidents.toLocaleString()}+`, class: 'text-cyan-300' },
            { label: 'SIF CORRELATION RATE', value: `${data.sif_rate.toFixed(1)}%`, class: 'text-purple-300' },
            { label: 'CRITICAL HAZARD EVENTS', value: data.critical_count.toLocaleString(), class: 'text-rose-400' },
            { label: 'AVERAGE CONFIDENCE', value: `${(data.avg_confidence * 100).toFixed(0)}%`, class: 'text-emerald-300' },
          ].map(({ label, value, class: valClass }) => (
            <div
              key={label}
              className="p-5 bg-[#0D1B2A]/60 border border-white/10 text-center"
            >
              <div className={`text-2xl sm:text-3xl font-bold font-mono mb-1 ${valClass}`}>{value}</div>
              <div className="text-[10px] font-medium tracking-wider text-slate-400">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Primary Analytics Components */}
      <AnalyticsPanel />

      {/* Facility Zone Risk Ranking Heatmap Table */}
      {data?.zone_heatmap && (
        <div className="bg-[#0D1B2A]/70 border border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                Facility Zone SIF Risk Leaderboard
              </h3>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              SCADA INDEX (0-100)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider bg-[#07111F]">
                  <th className="px-6 py-3 text-left">Facility Zone</th>
                  <th className="px-6 py-3 text-left">Total Reports</th>
                  <th className="px-6 py-3 text-left">SIF Precursors</th>
                  <th className="px-6 py-3 text-left">Critical Events</th>
                  <th className="px-6 py-3 text-left min-w-[180px]">Composite Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.zone_heatmap.map((z) => (
                  <tr
                    key={z.zone}
                    className="hover:bg-white/[0.02] transition-colors text-slate-200"
                  >
                    <td className="px-6 py-3.5 font-semibold text-white flex items-center gap-2.5">
                      <span className="w-2 h-2" style={{ background: z.risk_score > 70 ? '#EF4444' : z.risk_score > 40 ? '#F59E0B' : '#22C55E' }} />
                      {z.zone}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-300">{z.incident_count}</td>
                    <td className="px-6 py-3.5 font-mono">
                      <span className={z.sif_count > 0 ? 'text-rose-400 font-semibold' : 'text-slate-500'}>
                        {z.sif_count}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono">
                      <span className={z.critical_count > 0 ? 'text-rose-400 font-semibold' : 'text-slate-500'}>
                        {z.critical_count}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 overflow-hidden bg-[#07111F] border border-white/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${z.risk_score}%` }}
                            transition={{ duration: 0.6 }}
                            className="h-full"
                            style={{
                              background:
                                z.risk_score > 70
                                  ? '#EF4444'
                                  : z.risk_score > 40
                                  ? '#F59E0B'
                                  : '#22C55E',
                            }}
                          />
                        </div>
                        <span className="font-mono font-semibold text-xs" style={{ color: z.risk_score > 70 ? '#EF4444' : z.risk_score > 40 ? '#F59E0B' : '#22C55E' }}>
                          {z.risk_score} / 100
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

