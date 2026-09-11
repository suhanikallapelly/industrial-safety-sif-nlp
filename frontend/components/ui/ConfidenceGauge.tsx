'use client'

import { motion } from 'framer-motion'

interface Props {
  score: number // 0 – 1
  size?: number // px diameter, default 130
}

export function ConfidenceGauge({ score, size = 130 }: Props) {
  const pct = Math.max(0, Math.min(1, score))
  const radius = (size / 2) * 0.76
  const stroke = size * 0.09
  const cx = size / 2
  const cy = size / 2

  // Arc from 220° to 320° (280° total arc)
  const startAngle = 220
  const totalArc = 280
  const endAngle = startAngle + totalArc * pct

  function polarToXY(angleDeg: number, r: number) {
    const rad = (angleDeg - 90) * (Math.PI / 180)
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  function describeArc(start: number, end: number) {
    const s = polarToXY(start, radius)
    const e = polarToXY(end, radius)
    const large = end - start > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`
  }

  const color =
    pct >= 0.8
      ? '#ef4444'
      : pct >= 0.6
      ? '#f59e0b'
      : pct >= 0.4
      ? '#06b6d4'
      : '#10b981'

  const label =
    pct >= 0.8
      ? 'CRITICAL SIF'
      : pct >= 0.6
      ? 'ELEVATED'
      : pct >= 0.4
      ? 'MODERATE'
      : 'MINIMAL'

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="overflow-visible">
          {/* Background track */}
          <path
            d={describeArc(startAngle, startAngle + totalArc)}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {/* Fill arc */}
          {pct > 0 && (
            <path
              d={describeArc(startAngle, endAngle)}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 10px ${color})`,
                transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          )}
          {/* Center score percentage */}
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#f8fafc"
            fontSize={size * 0.22}
            fontWeight="900"
            fontFamily="Orbitron, monospace"
          >
            {Math.round(pct * 100)}%
          </text>
          <text
            x={cx}
            y={cy + size * 0.16}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize={size * 0.085}
            fontFamily="Rajdhani, sans-serif"
            fontWeight="600"
            letterSpacing="0.05em"
          >
            CONFIDENCE
          </text>
        </svg>
      </div>

      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="px-2 py-0.5 text-[10px] font-hud font-bold tracking-wider uppercase border"
        style={{
          background: `${color}15`,
          borderColor: `${color}40`,
          color,
        }}
      >
        {label}
      </motion.span>
    </div>
  )
}
