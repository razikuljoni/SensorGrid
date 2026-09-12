'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Sparkline } from '@/components/charts/sparkline';

// ─── PulseCard ───────────────────────────────────────────────────────────────
// Signature Aether Grid component for KPI + telemetry display.
// Contains: icon, title, main value, unit, trend, sparkline, status.
// Fully fluid responsive — icon + value stack gracefully on narrow widths.

export interface PulseCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: number | string | null;
  unit?: string;
  trend?: { value: number; label?: string };
  sparkline?: number[];
  accent?: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
  footer?: React.ReactNode;
  className?: string;
}

const accentClass: Record<NonNullable<PulseCardProps['accent']>, string> = {
  primary: 'text-primary',
  accent: 'text-accent-foreground bg-accent/40',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
};

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
    <Card className={cn('relative overflow-hidden p-3 sm:p-4 gap-0', className)}>
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className={cn(
              'flex size-8 sm:size-9 items-center justify-center rounded-lg sm:rounded-xl shrink-0',
              accentClass[accent],
              'bg-muted'
            )}
          >
            <Icon className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs font-medium text-text-muted truncate">{title}</p>
            <div className="flex items-baseline gap-1 mt-0.5 flex-wrap">
              <span className="text-lg sm:text-2xl font-semibold tabular-nums tracking-tight">
                {value ?? '—'}
              </span>
              {unit && <span className="text-[10px] sm:text-xs text-text-muted">{unit}</span>}
            </div>
          </div>
        </div>
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-[10px] sm:text-xs font-medium px-1.5 py-0.5 rounded-md shrink-0',
              trend.value > 0
                ? 'text-success bg-success/10'
                : trend.value < 0
                  ? 'text-danger bg-danger/10'
                  : 'text-text-muted bg-muted'
            )}
            title={trend.label}
          >
            {trend.value > 0 ? (
              <ArrowUpRight className="size-3" />
            ) : trend.value < 0 ? (
              <ArrowDownRight className="size-3" />
            ) : (
              <Minus className="size-3" />
            )}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      {sparkline && sparkline.length > 1 && (
        <div className="mt-2 sm:mt-3 -mx-1 h-8 sm:h-10">
          <Sparkline data={sparkline} accent={accent} />
        </div>
      )}

      {footer && (
        <div className="mt-2 sm:mt-3 text-[11px] sm:text-xs text-text-muted">{footer}</div>
      )}
    </Card>
  );
}
