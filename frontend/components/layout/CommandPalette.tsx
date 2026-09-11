'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Zap,
  BarChart3,
  Upload,
  AlertTriangle,
  Flame,
  X,
  CornerDownLeft,
} from 'lucide-react'
import { sound } from '@/lib/sound'

interface CommandItem {
  id: string
  title: string
  subtitle: string
  icon: typeof Zap
  category: 'Navigation' | 'Actions' | 'Zones'
  action: () => void
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsOpen((prev) => {
          if (!prev) sound.playClick()
          return !prev
        })
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const commands: CommandItem[] = [
    {
      id: 'nav-checker',
      title: 'Dashboard Safety Checker',
      subtitle: 'Analyze incident descriptions in plain English and check historical records',
      icon: Zap,
      category: 'Navigation',
      action: () => router.push('/'),
    },
    {
      id: 'nav-triage',
      title: 'Incident History & Records',
      subtitle: 'Review, approve, and escalate safety reports across facilities',
      icon: AlertTriangle,
      category: 'Navigation',
      action: () => router.push('/triage'),
    },
    {
      id: 'nav-analytics',
      title: 'Safety Trends & Risk Matrix',
      subtitle: 'IOGP rule breakdown, 30-day forecast and frequency heatmaps',
      icon: BarChart3,
      category: 'Navigation',
      action: () => router.push('/analytics'),
    },
    {
      id: 'nav-upload',
      title: 'Batch File Ingestion',
      subtitle: 'Batch process CSV incident spreadsheets',
      icon: Upload,
      category: 'Navigation',
      action: () => router.push('/upload'),
    },
  ]

  const filtered = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase())
  )

  const handleSelect = (item: CommandItem) => {
    sound.playSuccess()
    setIsOpen(false)
    item.action()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl border overflow-hidden z-10 glass-panel-glow"
            style={{ background: 'rgba(5, 13, 26, 0.92)' }}
          >
            {/* Top search bar */}
            <div className="flex items-center px-4 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
              <Search className="w-5 h-5 mr-3" style={{ color: 'var(--amber)' }} />
              <input
                type="text"
                autoFocus
                placeholder="Type a command, search facility zone, or run AI analyzer..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setSelectedIndex(0)
                }}
                className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-tech text-base"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results list */}
            <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-800/40">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">
                  No commands or zones matched &ldquo;{query}&rdquo;
                </div>
              ) : (
                filtered.map((item, idx) => {
                  const Icon = item.icon
                  const isSelected = idx === selectedIndex
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between p-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-500/15 border border-amber-500/40 text-white'
                          : 'hover:bg-slate-800/50 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'bg-amber-500 text-black' : 'bg-slate-800 text-amber-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm truncate flex items-center gap-2">
                            {item.title}
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-slate-800/80 text-slate-400 border border-slate-700/50">
                              {item.category}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 truncate">{item.subtitle}</div>
                        </div>
                      </div>
                      <CornerDownLeft className={`w-4 h-4 flex-shrink-0 ml-3 ${isSelected ? 'text-amber-400' : 'text-slate-600'}`} />
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer helper */}
            <div
              className="flex items-center justify-between px-4 py-2 border-t text-[11px] text-slate-400 font-mono"
              style={{ background: 'rgba(3, 7, 18, 0.7)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-3">
                <span>Navigate <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700">↑</kbd> <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700">↓</kbd></span>
                <span>Select <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700">↵</kbd></span>
                <span>Close <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700">ESC</kbd></span>
              </div>
              <span className="text-amber-400/90 font-hud">OIL HSSE COMMAND</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
