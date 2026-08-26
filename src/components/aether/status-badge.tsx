'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  DEVICE_STATUS_META,
  ALERT_SEVERITY_META,
  ALERT_STATUS_META,
  COMMAND_STATUS_META,
} from '@/lib/status'
import type {
  AlertSeverity,
  AlertStatus,
  CommandStatus,
  DeviceStatus,
} from '@/lib/types'

// ─── StatusBadge family ─────────────────────────────────────────────────────
// Compact status pill with icon + label. Never relies on color alone.

function renderBadge(meta: any, size: 'sm' | 'md', className?: string) {
  const Icon = meta.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap',
        meta.color,
        meta.bg,
        meta.border,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        className
      )}
    >
      <span className="aether-status-dot" style={{ color: meta.dot }} />
      {Icon && <Icon className={cn(size === 'sm' ? 'size-2.5' : 'size-3')} />}
      <span>{meta.label}</span>
    </span>
  )
}

export function DeviceStatusBadge({
  status,
  size = 'md',
  className,
}: {
  status: DeviceStatus
  size?: 'sm' | 'md'
  className?: string
}) {
  const meta = DEVICE_STATUS_META[status] ?? DEVICE_STATUS_META.UNKNOWN
  return renderBadge(meta, size, className)
}

export function AlertSeverityBadge({
  severity,
  size = 'md',
  className,
}: {
  severity: AlertSeverity
  size?: 'sm' | 'md'
  className?: string
}) {
  const meta = ALERT_SEVERITY_META[severity] ?? ALERT_SEVERITY_META.WARNING
  return renderBadge(meta, size, className)
}

export function AlertStatusBadge({
  status,
  size = 'md',
  className,
}: {
  status: AlertStatus
  size?: 'sm' | 'md'
  className?: string
}) {
  const meta = ALERT_STATUS_META[status] ?? ALERT_STATUS_META.TRIGGERED
  return renderBadge(meta, size, className)
}

export function CommandStatusBadge({
  status,
  size = 'md',
  className,
}: {
  status: CommandStatus
  size?: 'sm' | 'md'
  className?: string
}) {
  const meta = COMMAND_STATUS_META[status] ?? COMMAND_STATUS_META.PENDING
  return renderBadge(meta, size, className)
}
