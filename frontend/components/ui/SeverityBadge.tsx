'use client'

import { motion } from 'framer-motion'
import type { SeverityType } from '@/types'

interface Props {
  severity: SeverityType
  size?: 'sm' | 'md'
}

const CONFIG = {
  Critical: { label: 'CRITICAL', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  High: { label: 'HIGH', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  Medium: { label: 'MEDIUM', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  Low: { label: 'LOW', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
}

export function SeverityBadge({ severity, size = 'sm' }: Props) {
  const { label, className } = CONFIG[severity]
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center border font-semibold tracking-wide ${className} ${
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      }`}
    >
      {label}
    </motion.span>
  )
}
