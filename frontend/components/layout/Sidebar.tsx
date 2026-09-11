'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  ShieldAlert,
  ClipboardList,
  BarChart3,
  Upload,
  Shield,
  ChevronLeft,
  ChevronRight,
  Settings,
  HelpCircle,
  Cpu,
} from 'lucide-react'
import { sound } from '@/lib/sound'

const NAV_ITEMS = [
  { href: '/',          label: 'Dashboard',       icon: LayoutDashboard, badge: null },
  { href: '/predict',   label: 'Risk Assessment',  icon: ShieldAlert,     badge: 'AI' },
  { href: '/triage',    label: 'Incident History', icon: ClipboardList,   badge: null },
  { href: '/analytics', label: 'Analytics',        icon: BarChart3,       badge: null },
  { href: '/upload',    label: 'Bulk Import',      icon: Upload,          badge: null },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`hidden md:flex flex-col flex-shrink-0 relative z-20 transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)] ${
        collapsed ? 'w-[68px]' : 'w-[228px]'
      }`}
      style={{
        background: 'var(--bg-base)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* ── Logo ──────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 h-14 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-dim)' }}
      >
        <div
          className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-lg"
          style={{
            background: 'linear-gradient(135deg, var(--teal-500), var(--violet-600))',
            boxShadow: '0 0 16px rgba(0,180,216,0.35)',
          }}
        >
          <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.18 }}
              className="min-w-0 overflow-hidden"
            >
              <div
                className="text-[13px] font-bold leading-tight tracking-tight"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
              >
                OIL INDIA
              </div>
              <div className="text-[10px] font-medium" style={{ color: 'var(--teal-500)' }}>
                Safety Intelligence
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Navigation ────────────────────────────────────────── */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {/* Section label */}
        {!collapsed && (
          <div
            className="text-[10px] font-semibold uppercase tracking-widest px-3 pt-2 pb-1.5"
            style={{ color: 'var(--text-dim)' }}
          >
            Navigation
          </div>
        )}

        {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
          const isActive = href === '/'
            ? pathname === '/' || pathname === '/predict'
            : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              onClick={() => sound.playClick()}
              title={collapsed ? label : undefined}
              className={`sidebar-nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon
                className="flex-shrink-0"
                style={{
                  width: 16,
                  height: 16,
                  color: isActive ? 'var(--teal-400)' : 'var(--text-dim)',
                }}
              />

              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1 truncate"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>

              {badge && !collapsed && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    background: 'rgba(139,92,246,0.15)',
                    color: 'var(--violet-300)',
                    border: '1px solid rgba(139,92,246,0.25)',
                  }}
                >
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Footer ────────────────────────────────────────────── */}
      <div
        className="p-2 space-y-1"
        style={{ borderTop: '1px solid var(--border-dim)' }}
      >
        {/* System status */}
        {!collapsed && (
          <div
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-1"
            style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)' }}
          >
            <div className="status-dot live" />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold" style={{ color: 'var(--green-300)' }}>
                System Operational
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                NLP Engine · v3.1.0
              </div>
            </div>
            <Cpu style={{ width: 13, height: 13, color: 'var(--green-400)', flexShrink: 0 }} />
          </div>
        )}

        <button
          onClick={() => { sound.playClick(); setCollapsed(!collapsed) }}
          title={collapsed ? 'Expand' : 'Collapse'}
          className="btn-ghost w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px]"
          style={{ color: 'var(--text-dim)' }}
        >
          {collapsed
            ? <ChevronRight style={{ width: 15, height: 15 }} />
            : (
              <>
                <ChevronLeft style={{ width: 15, height: 15 }} />
                <span>Collapse</span>
              </>
            )
          }
        </button>
      </div>
    </aside>
  )
}
