'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { DEVICE_STATUS_META, batteryMeta } from '@/lib/status'
import type { DeviceStatus } from '@/lib/types'

// ─── DeviceOrb ───────────────────────────────────────────────────────────────
// Circular device health visualization.
// Displays: connectivity (status icon), battery ring, activity pulse.
// Renders as a <button> only when onClick is provided; otherwise a <div> so it
// can be safely nested inside other interactive elements.

export interface DeviceOrbProps {
  status: DeviceStatus
  battery?: number | null
  signal?: number | null
  size?: number
  label?: string
  /** @deprecated — kept for API compatibility but no longer rendered (caused icon overlap) */
  sublabel?: boolean
  active?: boolean
  onClick?: () => void
  className?: string
}

export function DeviceOrb({
  status,
  battery = null,
  signal = null,
  size = 96,
  label,
  // sublabel is intentionally unused — the absolute-positioned battery/signal
  // icons overlapped with the center icon on small orbs. Battery is already
  // shown via the progress ring; signal is shown in the card body.
  sublabel: _sublabel = false,
  active = true,
  onClick,
  className,
}: DeviceOrbProps) {
  const meta = DEVICE_STATUS_META[status] ?? DEVICE_STATUS_META.UNKNOWN
  const bat = batteryMeta(battery)
  const Icon = meta.icon

  const batPct = battery === null ? null : Math.max(0, Math.min(100, battery))
  const circumference = 2 * Math.PI * (size / 2 - 4)
  const batOffset = batPct === null ? circumference : circumference * (1 - batPct / 100)

  const title = `${meta.label}${battery !== null ? ` · ${battery}%` : ''}${signal !== null ? ` · ${signal} dBm` : ''}`
  const interactive = !!onClick
  const resolvedClassName = cn(
    'group relative flex items-center justify-center',
    interactive && 'cursor-pointer',
    className
  )
  const style: React.CSSProperties = { width: size, height: size }

  const body = (
    <div className="relative rounded-full" style={{ width: size, height: size }}>
      {/* Status color glow */}
      <div
        className="absolute inset-0 rounded-full opacity-20 transition-opacity group-hover:opacity-30"
        style={{ backgroundColor: meta.dot }}
      />

      {/* Pulse ring — only when active + online-ish */}
      {active && (status === 'ONLINE' || status === 'WARNING') && (
        <div className="absolute inset-2 rounded-full" style={{ color: meta.dot }}>
          <span className="aether-pulse-ring" />
        </div>
      )}

      {/* Battery progress ring */}
      <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={size / 2 - 4} fill="none" stroke="var(--border)" strokeWidth={2} />
        {batPct !== null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 4}
            fill="none"
            stroke={bat.color === 'text-danger' ? 'var(--danger)' : bat.color === 'text-warning' ? 'var(--warning)' : 'var(--success)'}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={batOffset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        )}
      </svg>

      {/* Center icon */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: Math.max(20, size * 0.35),
            height: Math.max(20, size * 0.35),
            backgroundColor: 'color-mix(in oklch, var(--surface-elevated) 80%, transparent)',
          }}
        >
          <Icon style={{ width: Math.max(12, size * 0.2), height: Math.max(12, size * 0.2), color: meta.dot }} />
        </div>
        {label && <span className="text-[10px] font-medium text-text-secondary">{label}</span>}
      </div>
    </div>
  )

  if (!interactive) {
    return (
      <div className={resolvedClassName} style={style} title={title} role="img" aria-label={title}>
        {body}
      </div>
    )
  }

  return (
    <button type="button" onClick={onClick} className={resolvedClassName} style={style} title={title}>
      {body}
    </button>
  )
}
