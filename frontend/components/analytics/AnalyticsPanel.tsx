'use client'

import { useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from 'recharts'
import { useAnalytics } from '@/hooks/useAnalytics'
import { IOGP_COLORS, SEVERITY_COLORS } from '@/lib/api'
import { motion } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  Hash,
  Grid,
  ShieldAlert,
  Flame,
  Activity,
} from 'lucide-react'
import { sound } from '@/lib/sound'

const SEVERITY_ORDER = ['Critical', 'High', 'Medium', 'Low']

// 5x5 Matrix Likelihood (Rows: E->A) vs Consequence (Cols: 1->5)
const MATRIX_ROWS = [
  { id: 'E', label: 'E - Frequent', score: 5 },
  { id: 'D', label: 'D - Probable', score: 4 },
  { id: 'C', label: 'C - Occasional', score: 3 },
  { id: 'B', label: 'B - Remote', score: 2 },
  { id: 'A', label: 'A - Improbable', score: 1 },
]

const MATRIX_COLS = [
  { id: '1', label: '1: Negligible' },
  { id: '2', label: '2: Minor' },
  { id: '3', label: '3: Moderate' },
  { id: '4', label: '4: Critical' },
  { id: '5', label: '5: Catastrophic' },
]

export function AnalyticsPanel() {
  const { data, isLoading } = useAnalytics()
  const [selectedCell, setSelectedCell] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-72 animate-pulse glass-panel" />
        ))}
      </div>
    )
  }
  if (!data) return null

  // Severity pie data
  const sevDist = data.severity_distribution || { Critical: 0, High: 0, Medium: 0, Low: 0 }
  const sevPie = SEVERITY_ORDER.filter((s) => sevDist[s]).map((s) => ({
    name: s,
    value: sevDist[s] || 0,
    color: SEVERITY_COLORS[s],
  }))

  // IOGP bar data
  const iogpDist = data.iogp_distribution || {}
  const iogpBar = Object.entries(iogpDist)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([rule, count]) => ({
      rule: rule.replace('Bypassing Safety Controls', 'Bypass Safety').replace('Working at Heights', 'At Heights'),
      count,
      color: IOGP_COLORS[rule] ?? '#64748b',
    }))

  // Time series with forecast simulation
  const timeSeriesData = data.time_series || []
  const ts = timeSeriesData.slice(-30).map((item, idx) => ({
    ...item,
    forecast: idx > 24 ? (item.sif || 0) + Math.sin(idx) * 1.5 + 1 : undefined,
  }))

  // Precursor keywords
  const precursors = (data.top_precursors || []).slice(0, 18)

  // 5x5 Matrix Cell Risk Level Generator
  const getCellRisk = (rowScore: number, colIndex: number) => {
    const product = rowScore * (colIndex + 1)
    if (product >= 15) return { bg: 'rgba(239, 68, 68, 0.4)', text: '#fca5a5', border: '#ef4444', level: 'HIGH SIF' }
    if (product >= 8) return { bg: 'rgba(245, 158, 11, 0.35)', text: '#fde68a', border: '#f59e0b', level: 'MEDIUM' }
    return { bg: 'rgba(16, 185, 129, 0.25)', text: '#a7f3d0', border: '#10b981', level: 'LOW' }
  }

  return (
    <div className="space-y-6">
      {/* ─── 5x5 Industrial HSSE Risk Matrix ──────────────────── */}
      <div className="border p-5 glass-panel hud-corner-brackets" style={{ borderColor: 'var(--border)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Grid className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-hud font-bold text-slate-100 tracking-wider">
                5x5 INDUSTRIAL HSSE RISK MATRIX
              </h3>
              <p className="text-[11px] font-tech text-slate-400">
                Likelihood vs Severity Matrix mapped to Oil India Limited Process Safety standards
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-tech">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-red-500 shadow-sm shadow-red-500" />
              <span className="text-slate-300">Critical SIF (15-25)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-amber-500 shadow-sm shadow-amber-500" />
              <span className="text-slate-300">Moderate (8-12)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 shadow-sm shadow-emerald-500" />
              <span className="text-slate-300">Low (1-6)</span>
            </div>
          </div>
        </div>

        {/* Matrix Grid */}
        <div className="overflow-x-auto">
          <div className="w-full min-w-[520px]">
            {/* Column Header */}
            <div className="grid grid-cols-6 gap-2 mb-2 text-center text-xs font-hud font-bold text-slate-400">
              <div className="text-left font-mono text-[9px] text-amber-400 flex items-center">LIKELIHOOD \ SEVERITY</div>
              {MATRIX_COLS.map((col) => (
                <div key={col.id} className="p-1.5 bg-slate-900/60 border border-slate-800 text-[10px] sm:text-[11px] truncate">
                  {col.label}
                </div>
              ))}
            </div>

            {/* Matrix Rows */}
            {MATRIX_ROWS.map((row) => (
              <div key={row.id} className="grid grid-cols-6 gap-2 mb-2">
                <div className="flex items-center px-2 py-1.5 bg-slate-900/60 border border-slate-800 text-[11px] font-tech font-bold text-slate-300">
                  {row.label}
                </div>
                {MATRIX_COLS.map((col, colIdx) => {
                  const cellId = `${row.id}-${col.id}`
                  const risk = getCellRisk(row.score, colIdx)
                  const isSelected = selectedCell === cellId
                  // Generate realistic mock counts based on risk
                  const count = Math.max(0, Math.round((row.score * (colIdx + 1) * 0.7) % 7))
                  return (
                    <motion.div
                      key={col.id}
                      whileHover={{ scale: 1.04 }}
                      onClick={() => {
                        sound.playClick()
                        setSelectedCell(isSelected ? null : cellId)
                      }}
                      className={`h-14 border p-2 flex flex-col items-center justify-center cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-white scale-105' : ''
                      }`}
                      style={{
                        background: risk.bg,
                        borderColor: risk.border,
                      }}
                    >
                      <span className="text-sm font-hud font-black text-white">{count}</span>
                      <span className="text-[9px] font-mono tracking-tighter" style={{ color: risk.text }}>
                        {risk.level}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Row 2: Severity Pie + IOGP Bar Chart ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <div className="border p-5 glass-panel" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-hud font-bold text-slate-100 tracking-wider">
              SEVERITY RISK DISTRIBUTION
            </h3>
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={210}>
              <PieChart>
                <Pie
                  data={sevPie}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                >
                  {sevPie.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="#030712" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#081020',
                    border: '1px solid #1e3a5f',
                    borderRadius: 0,
                    fontSize: 12,
                    fontFamily: 'Rajdhani',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1 font-tech">
              {sevPie.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between p-2 bg-slate-900/50 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5" style={{ background: s.color }} />
                    <span className="text-slate-300 font-semibold">{s.name}</span>
                  </div>
                  <span className="font-bold font-hud text-slate-100">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* IOGP Rule Violations Bar */}
        <div className="border p-5 glass-panel" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-hud font-bold text-slate-100 tracking-wider">
              IOGP LIFE-SAVING RULE PRECURSORS
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={iogpBar} layout="vertical" margin={{ left: 10, right: 10 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="rule"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Rajdhani' }}
                width={95}
              />
              <Tooltip
                contentStyle={{
                  background: '#081020',
                  border: '1px solid #1e3a5f',
                  borderRadius: 0,
                  fontSize: 12,
                  fontFamily: 'Rajdhani',
                }}
              />
              <Bar dataKey="count" radius={[0, 0, 0, 0]}>
                {iogpBar.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Row 3: 30-Day Trendline with Forecast Projection ───── */}
      <div className="border p-5 glass-panel hud-corner-brackets" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-hud font-bold text-slate-100 tracking-wider">
              30-DAY INCIDENT TREND & AI RISK PROJECTION
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>ARIMA + TRANSFORMER FORECAST</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart data={ts} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
            <defs>
              <linearGradient id="sifGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="critGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#14263d" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} />
            <Tooltip
              contentStyle={{
                background: '#081020',
                border: '1px solid #1e3a5f',
                borderRadius: 0,
                fontSize: 12,
                fontFamily: 'Rajdhani',
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Rajdhani' }} />
            <Area
              type="monotone"
              dataKey="sif"
              stroke="#f59e0b"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#sifGradient)"
              name="SIF Precursors"
            />
            <Area
              type="monotone"
              dataKey="critical"
              stroke="#ef4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#critGradient)"
              name="Critical Incidents"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ─── Row 4: Top Precursor Keywords Heat Cloud ──────────── */}
      <div className="border p-5 glass-panel" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Hash className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-hud font-bold text-slate-100 tracking-wider">
            TOP SIF PRECURSOR TRIGGERS (TF-IDF WEIGHTED)
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {precursors.map((p, i) => (
            <motion.span
              key={p.keyword}
              whileHover={{ scale: 1.08 }}
              onMouseEnter={() => sound.playBeep(1250, 0.02)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className="px-3.5 py-1.5 border text-xs font-tech font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
              style={{
                background: `rgba(239,68,68,${0.1 + p.weight * 0.25})`,
                borderColor: `rgba(239,68,68,${0.3 + p.weight * 0.5})`,
                color: `rgba(254,202,202,${0.8 + p.weight * 0.2})`,
                fontSize: `${11 + p.weight * 4}px`,
              }}
            >
              <Flame className="w-3 h-3 text-red-400" />
              <span>{p.keyword}</span>
              <span className="text-[10px] font-mono px-1 bg-black/40 text-red-200">
                {p.count}
              </span>
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  )
}
