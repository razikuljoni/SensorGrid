'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { Sparkline } from '@/components/charts/sparkline'

// ─── PulseCard ───────────────────────────────────────────────────────────────
// Signature Aether Grid component for KPI + telemetry display.
// Contains: icon, title, main value, unit, trend, sparkline, status.

export interface PulseCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  value: number | string | null
  unit?: string
  trend?: { value: number; label?: string } // percentage, e.g. +12 or -4
  sparkline?: number[]
  accent?: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info'
  footer?: React.ReactNode
  className?: string
}

const accentClass: Record<NonNullable<PulseCardProps['accent']>, string> = {
  primary: 'text-primary',
  accent: 'text-accent-foreground bg-accent/40',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
}

export function PulseCard({
  icon: Icon,
  title,
  value,
  unit,
  trend,
  sparkline,
  accent = 'primary',
  footer,
  className,
}: PulseCardProps) {
  return (
    <Card className={cn('relative overflow-hidden p-4 gap-0', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn('flex size-9 items-center justify-center rounded-xl', accentClass[accent], 'bg-muted')}>
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-muted truncate">{title}</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-semibold tabular-nums tracking-tight">
                {value ?? '—'}
              </span>
              {unit && <span className="text-xs text-text-muted">{unit}</span>}
            </div>
          </div>
        </div>
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-md',
              trend.value > 0 ? 'text-success bg-success/10' : trend.value < 0 ? 'text-danger bg-danger/10' : 'text-text-muted bg-muted'
            )}
            title={trend.label}
          >
            {trend.value > 0 ? <ArrowUpRight className="size-3" /> : trend.value < 0 ? <ArrowDownRight className="size-3" /> : <Minus className="size-3" />}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      {sparkline && sparkline.length > 1 && (
        <div className="mt-3 -mx-1 h-10">
          <Sparkline data={sparkline} accent={accent} />
        </div>
      )}

      {footer && <div className="mt-3 text-xs text-text-muted">{footer}</div>}
    </Card>
  )
}
