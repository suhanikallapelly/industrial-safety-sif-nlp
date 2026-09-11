'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react'
import { sound } from '@/lib/sound'

interface KPICardProps {
  label: string
  value: string | number
  delta?: string
  trend?: 'up' | 'down' | 'neutral'
  icon: React.ReactNode
  color: 'amber' | 'red' | 'green' | 'blue' | 'cyan'
  subtitle?: string
}

const COLOR_MAP = {
  amber: {
    bg: 'rgba(245,158,11,0.15)',
    border: 'rgba(245,158,11,0.35)',
    text: '#f59e0b',
    glow: '0 0 25px rgba(245,158,11,0.25)',
    valueClass: 'text-amber-400 text-glow-amber',
  },
  red: {
    bg: 'rgba(239,68,68,0.15)',
    border: 'rgba(239,68,68,0.35)',
    text: '#ef4444',
    glow: '0 0 25px rgba(239,68,68,0.25)',
    valueClass: 'text-red-400 text-glow-red',
  },
  green: {
    bg: 'rgba(16,185,129,0.15)',
    border: 'rgba(16,185,129,0.35)',
    text: '#10b981',
    glow: '0 0 25px rgba(16,185,129,0.25)',
    valueClass: 'text-emerald-400',
  },
  blue: {
    bg: 'rgba(59,130,246,0.15)',
    border: 'rgba(59,130,246,0.35)',
    text: '#3b82f6',
    glow: '0 0 25px rgba(59,130,246,0.25)',
    valueClass: 'text-blue-400',
  },
  cyan: {
    bg: 'rgba(6,182,212,0.15)',
    border: 'rgba(6,182,212,0.35)',
    text: '#06b6d4',
    glow: '0 0 25px rgba(6,182,212,0.25)',
    valueClass: 'text-cyan-400 text-glow-cyan',
  },
}

export function KPICard({ label, value, delta, trend, icon, color, subtitle }: KPICardProps) {
  const c = COLOR_MAP[color]
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? '#ef4444' : trend === 'down' ? '#10b981' : '#64748b'

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: c.glow }}
      onMouseEnter={() => sound.playBeep(1100, 0.02)}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className="p-4 sm:p-5 border relative overflow-hidden glass-panel hud-corner-brackets transition-all cursor-default"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 flex items-center justify-center shadow-lg"
          style={{ background: c.bg, border: `1px solid ${c.border}` }}
        >
          <div style={{ color: c.text }}>{icon}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {delta && (
            <div
              className="flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 border"
              style={{
                background: `${trendColor}15`,
                borderColor: `${trendColor}40`,
                color: trendColor,
              }}
            >
              <TrendIcon className="w-3 h-3" />
              {delta}
            </div>
          )}
          <div className="flex items-center gap-1 text-[9px] font-mono text-slate-400">
            <Activity className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
            TELEMETRY
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`text-2xl sm:text-3xl font-hud font-bold tracking-tight mb-1 ${c.valueClass}`}
      >
        {value}
      </motion.div>

      <p className="text-xs font-tech font-bold uppercase tracking-wider text-slate-300">
        {label}
      </p>

      {subtitle && (
        <p className="text-[11px] font-mono text-slate-400 mt-1 flex items-center gap-1 truncate">
          <span className="w-1 h-1 bg-slate-600" />
          {subtitle}
        </p>
      )}
    </motion.div>
  )
}
