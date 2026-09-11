import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/lib/providers'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { CommandPalette } from '@/components/layout/CommandPalette'

export const metadata: Metadata = {
  title: 'Apex Safety Intelligence — Oil India HSSE Platform',
  description:
    'Enterprise AI/NLP engine for real-time SIF precursor detection across Oil India Limited field operations, drilling, and processing facilities.',
  keywords: ['SIF', 'HSSE', 'Oil India', 'safety AI', 'NLP', 'precursor detection', 'IOGP'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className="flex h-screen overflow-hidden"
        style={{ background: 'var(--bg-void)', color: 'var(--text-primary)' }}
      >
        <Providers>
          <CommandPalette />
          <Sidebar />
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <TopBar />
            <main
              className="flex-1 overflow-y-auto bg-grid"
              style={{ background: 'var(--bg-void)' }}
            >
              <div className="w-full min-h-full px-6 sm:px-12 lg:px-16 py-8">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
