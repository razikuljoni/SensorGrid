'use client'

import * as React from 'react'
import { useId } from 'react'
import { cn } from '@/lib/utils'

// ─── Sparkline ───────────────────────────────────────────────────────────────
// Lightweight SVG sparkline for PulseCard. No axes, no tooltip — pure signal.

export interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  accent?: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

const colorVar: Record<NonNullable<SparklineProps['accent']>, string> = {
  primary: 'var(--primary)',
  accent: 'var(--accent)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
  info: 'var(--info)',
}

export function Sparkline({ data, width = 200, height = 40, accent = 'primary', className }: SparklineProps) {
  const id = useId()
  if (data.length < 2) return <div className={cn('h-full w-full', className)} />

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const stepX = width / (data.length - 1)
  const points = data.map((v, i) => ({ x: i * stepX, y: height - ((v - min) / range) * (height - 4) - 2 }))
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
  const areaPath = `${path} L${width},${height} L0,${height} Z`
  const color = colorVar[accent]

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn('h-full w-full', className)}
    >
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-${id})`} />
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={2} fill={color} />
    </svg>
  )
}
