'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Github, Radio } from 'lucide-react'
import { useRealtimeSocket } from '@/lib/realtime'

// ─── Footer ──────────────────────────────────────────────────────────────────
// Sticky footer showing realtime connection status + product info.
// Per UI rules, this sticks to the bottom of the viewport on short pages and
// is pushed down naturally on long pages.

export function Footer() {
  const { isConnected } = useRealtimeSocket(() => {})
  return (
    <footer className="mt-auto border-t border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-2 px-4 py-3 text-xs text-text-muted sm:flex-row">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <Radio className={cn('size-3', isConnected ? 'text-success' : 'text-text-muted/50')} />
            <span className="font-mono">{isConnected ? 'realtime: connected' : 'realtime: connecting…'}</span>
          </span>
          <span className="hidden sm:inline text-border">·</span>
          <span className="hidden sm:inline">Aether Grid design system v1.0</span>
        </div>
        <div className="flex items-center gap-3">
          <span>SensorGrid · Connect. Observe. Automate.</span>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors" aria-label="GitHub">
            <Github className="size-3" />
          </a>
        </div>
      </div>
    </footer>
  )
}
