'use client';

import * as React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TelemetrySeriesDTO } from '@/lib/types';
import { sensorMeta } from '@/lib/status';

// ─── TelemetryChart ──────────────────────────────────────────────────────────
// Multi-series chart with minimal gridlines, clear tooltips, accessible legend.

export interface TelemetryChartProps {
  series: TelemetrySeriesDTO[];
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  variant?: 'area' | 'line';
}

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

function formatXAxis(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="font-medium text-text-secondary mb-1">
        {new Date(label).toLocaleString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-text-muted">{p.name}</span>
          </span>
          <span className="font-medium tabular-nums">
            {typeof p.value === 'number' ? p.value.toFixed(1) : p.value} {p.payload?.unit ?? ''}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TelemetryChart({
  series,
  height = 260,
  showLegend = true,
  showGrid = true,
  variant = 'area',
}: TelemetryChartProps) {
  if (series.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-text-muted">
        No telemetry data for the selected range.
      </div>
    );
  }

  // Merge series by timestamp
  const tsSet = new Set<string>();
  for (const s of series) for (const p of s.points) tsSet.add(p.timestamp);
  const timestamps = Array.from(tsSet).sort();
  const data = timestamps.map((ts) => {
    const row: Record<string, any> = { timestamp: ts };
    for (const s of series) {
      const p = s.points.find((p) => p.timestamp === ts);
      if (p) {
        row[s.sensorKey] = p.value;
        row.unit = s.unit;
      }
    }
    return row;
  });

  const Chart = variant === 'area' ? AreaChart : LineChart;

  return (
    <div className="w-full">
      {showLegend && (
        <div className="mb-3 flex flex-wrap items-center gap-3">
          {series.map((s, i) => (
            <span key={s.sensorKey} className="flex items-center gap-1.5 text-xs">
              <span
                className="size-2.5 rounded-sm"
                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              <span className="text-text-secondary">{sensorMeta(s.sensorKey).label}</span>
              <span className="text-text-muted">({s.unit})</span>
            </span>
          ))}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <Chart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          )}
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatXAxis}
            stroke="var(--text-muted)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            minTickGap={40}
          />
          <YAxis
            stroke="var(--text-muted)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} />
          {series.map((s, i) => {
            const color = CHART_COLORS[i % CHART_COLORS.length];
            if (variant === 'area') {
              return (
                <Area
                  key={s.sensorKey}
                  type="monotone"
                  dataKey={s.sensorKey}
                  name={sensorMeta(s.sensorKey).label}
                  stroke={color}
                  fill={color}
                  fillOpacity={0.15}
                  strokeWidth={1.5}
                  isAnimationActive={false}
                  dot={false}
                  connectNulls
                />
              );
            }
            return (
              <Line
                key={s.sensorKey}
                type="monotone"
                dataKey={s.sensorKey}
                name={sensorMeta(s.sensorKey).label}
                stroke={color}
                strokeWidth={1.5}
                isAnimationActive={false}
                dot={false}
                connectNulls
              />
            );
          })}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}
