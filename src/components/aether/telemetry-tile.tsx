'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { sensorMeta } from '@/lib/status'
import { Activity } from 'lucide-react'

// ─── TelemetryTile ───────────────────────────────────────────────────────────
// Compact live sensor display. Pulses subtly on value updates.
// Label wraps instead of truncating so "Voltage" never becomes "Vo...".

export interface TelemetryTileProps {
  sensorKey: string
  label?: string
  value: number | null
  unit?: string
  quality?: 'GOOD' | 'ESTIMATED' | 'INVALID' | 'MISSING'
  timestamp?: string | null
  icon?: React.ComponentType<{ className?: string }>
  className?: string
  compact?: boolean
}

export function TelemetryTile({
  sensorKey,
  label,
  value,
  unit,
  quality = 'GOOD',
  timestamp,
  icon: IconProp,
  className,
  compact = false,
}: TelemetryTileProps) {
  const meta = sensorMeta(sensorKey)
  const Icon = IconProp ?? meta.icon ?? Activity
  const [flicker, setFlicker] = React.useState(false)
  const prev = React.useRef(value)

  React.useEffect(() => {
    if (prev.current !== value) {
      setFlicker(true)
      const t = setTimeout(() => setFlicker(false), 900)
      prev.current = value
      return () => clearTimeout(t)
    }
  }, [value])

  const qualityColor =
    quality === 'GOOD' ? 'text-text-muted' : quality === 'ESTIMATED' ? 'text-warning' : quality === 'INVALID' ? 'text-danger' : 'text-text-muted'

  return (
    <div className={cn('aether-tile relative overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-border-subtle', compact ? 'p-2' : 'p-3', className)}>
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <Icon className="size-3 text-text-muted shrink-0" />
          <span className={cn('font-medium text-text-muted leading-tight', compact ? 'text-[9px]' : 'text-[10px]')}>
            {label ?? meta.label}
          </span>
        </div>
        <span className={cn('size-1.5 rounded-full shrink-0', quality === 'GOOD' ? 'bg-success' : quality === 'ESTIMATED' ? 'bg-warning' : quality === 'INVALID' ? 'bg-danger' : 'bg-muted-foreground/40')} title={quality} />
      </div>
      <div className="mt-1 flex items-baseline gap-0.5 flex-wrap">
        <span className={cn('font-semibold tabular-nums tracking-tight transition-colors', compact ? 'text-base' : 'text-lg', flicker && 'aether-flicker')}>
          {value === null || value === undefined ? '—' : value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
        </span>
        {unit && <span className={cn('text-text-muted', compact ? 'text-[9px]' : 'text-[10px]')}>{unit}</span>}
      </div>
      {timestamp && !compact && (
        <div className={cn('mt-0.5 text-[9px]', qualityColor)}>{new Date(timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
      )}
    </div>
  )
}
