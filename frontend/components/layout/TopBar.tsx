'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Volume2, VolumeX, Bell, Command, Search, ChevronRight } from 'lucide-react'
import { sound } from '@/lib/sound'

const BREADCRUMBS: Record<string, { module: string; page: string }> = {
  '/':          { module: 'Platform',   page: 'Dashboard' },
  '/predict':   { module: 'AI Engine',  page: 'Risk Assessment' },
  '/triage':    { module: 'Operations', page: 'Incident History' },
  '/analytics': { module: 'Analytics',  page: 'Metrics & Trends' },
  '/upload':    { module: 'Data',       page: 'Bulk Import' },
  '/facility':  { module: 'Facility',   page: '3D Facility View' },
}

export function TopBar() {
  const pathname = usePathname()
  const bc = BREADCRUMBS[pathname] ?? { module: 'Platform', page: 'Safety Intelligence' }

  const [soundActive, setSoundActive] = useState(true)
  const [time, setTime] = useState('')

  useEffect(() => {
    setSoundActive(sound.isEnabled())
  }, [])

  // Live clock
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header
      className="flex items-center justify-between px-6 sm:px-12 lg:px-16 h-14 flex-shrink-0 relative z-20"
      style={{
        background: 'var(--bg-base)',
        borderBottom: '1px solid var(--border-dim)',
      }}
    >
      {/* ── Left: Breadcrumb ─────────────────────────────────── */}
      <div className="flex items-center gap-2 text-[13px]">
        <span style={{ color: 'var(--text-dim)' }}>{bc.module}</span>
        <ChevronRight style={{ width: 13, height: 13, color: 'var(--text-dim)' }} />
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{bc.page}</span>
      </div>

      {/* ── Center: Command search hint ──────────────────────── */}
      <div className="hidden lg:flex items-center">
        <button
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[12.5px] transition-all"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-dim)',
          }}
          title="Open command palette (Ctrl+K)"
        >
          <Search style={{ width: 13, height: 13 }} />
          <span>Search incidents, rules…</span>
          <span
            className="ml-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}
          >
            <Command style={{ width: 9, height: 9 }} />K
          </span>
        </button>
      </div>

      {/* ── Right: Controls ──────────────────────────────────── */}
      <div className="flex items-center gap-1.5">
        {/* Live clock */}
        <div
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11.5px]"
          style={{
            fontFamily: 'var(--font-mono)',
            background: 'rgba(0,180,216,0.05)',
            border: '1px solid rgba(0,180,216,0.1)',
            color: 'var(--teal-400)',
          }}
        >
          <div className="status-dot live" style={{ width: 5, height: 5 }} />
          {time}
        </div>

        {/* Sound toggle */}
        <button
          onClick={() => { const s = sound.toggle(); setSoundActive(s) }}
          title={soundActive ? 'Mute' : 'Enable audio'}
          className="btn btn-ghost p-2"
          style={{ borderRadius: '8px' }}
        >
          {soundActive
            ? <Volume2 style={{ width: 15, height: 15, color: 'var(--text-muted)' }} />
            : <VolumeX style={{ width: 15, height: 15, color: 'var(--text-dim)' }} />
          }
        </button>

        {/* Notifications */}
        <button
          className="btn btn-ghost p-2 relative"
          style={{ borderRadius: '8px' }}
          title="Notifications"
          onClick={() => sound.playClick()}
        >
          <Bell style={{ width: 15, height: 15, color: 'var(--text-muted)' }} />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--red-400)', boxShadow: '0 0 4px rgba(248,113,113,0.8)' }}
          />
        </button>

        <div className="w-px h-5 mx-1" style={{ background: 'var(--border-subtle)' }} />

        {/* User Avatar */}
        <button
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}
          onClick={() => sound.playClick()}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--teal-500), var(--violet-600))' }}
          >
            SL
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-[12.5px] font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
              Safety Lead
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text-dim)' }}>Oil India Ltd</div>
          </div>
        </button>
      </div>
    </header>
  )
}
