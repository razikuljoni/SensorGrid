'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { sensorMeta } from '@/lib/status'
import { Activity } from 'lucide-react'

// ─── TelemetryTile ───────────────────────────────────────────────────────────
// Compact live sensor display. Pulses subtly on value updates.

export interface TelemetryTileProps {
  sensorKey: string
  label?: string
  value: number | null
  unit?: string
  quality?: 'GOOD' | 'ESTIMATED' | 'INVALID' | 'MISSING'
  timestamp?: string | null
  icon?: React.ComponentType<{ className?: string }>
  className?: string
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
    <div className={cn('aether-tile relative overflow-hidden rounded-xl border border-border bg-surface p-3 transition-colors hover:border-border-subtle', className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon className="size-3.5 text-text-muted shrink-0" />
          <span className="text-[11px] font-medium text-text-muted truncate">{label ?? meta.label}</span>
        </div>
        <span className={cn('size-1.5 rounded-full', quality === 'GOOD' ? 'bg-success' : quality === 'ESTIMATED' ? 'bg-warning' : quality === 'INVALID' ? 'bg-danger' : 'bg-muted-foreground/40')} title={quality} />
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className={cn('text-xl font-semibold tabular-nums tracking-tight transition-colors', flicker && 'aether-flicker')}>
          {value === null || value === undefined ? '—' : value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
        </span>
        {unit && <span className="text-[11px] text-text-muted">{unit}</span>}
      </div>
      {timestamp && (
        <div className={cn('mt-0.5 text-[10px]', qualityColor)}>{new Date(timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
      )}
    </div>
  )
}
