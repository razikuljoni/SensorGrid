'use client';

// ─────────────────────────────────────────────────────────────────────────────
// SensorGrid — Analytics View (Task 12)
// Aggregated platform analytics: KPI summary + 4 charts (hourly volume,
// per-device volume, alerts by severity, multi-series trend).
// Driven by useAnalytics(range) + useRealtimeNotifications().
// ─────────────────────────────────────────────────────────────────────────────

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  Cpu,
  Gauge,
  Boxes,
  Send,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { TelemetryChart } from '@/components/charts/telemetry-chart';

import { useAnalytics, useRealtimeNotifications } from '@/lib/hooks';
import { ALERT_SEVERITY_META } from '@/lib/status';
import { cn } from '@/lib/utils';

// ─── Constants ──────────────────────────────────────────────────────────────

const RANGES: { value: string; label: string }[] = [
  { value: '1h', label: '1h' },
  { value: '6h', label: '6h' },
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
];

const SEVERITY_COLOR_VAR: Record<string, string> = {
  INFO: 'var(--info)',
  WARNING: 'var(--warning)',
  CRITICAL: 'var(--danger)',
};

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      {label !== undefined && label !== '' && (
        <div className="mb-1 font-medium text-text-secondary">{label}</div>
      )}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: p.color || p.payload?.fill || p.fill }}
            />
            <span className="text-text-muted">{p.name}</span>
          </span>
          <span className="font-medium tabular-nums">
            {typeof p.value === 'number' ? p.value.toLocaleString() : String(p.value ?? '')}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyChart({ label, icon: Icon = Activity }: { label: string; icon?: typeof Activity }) {
  return (
    <div className="flex h-[240px] flex-col items-center justify-center gap-2 text-center">
      <Icon className="size-6 text-text-muted/50" />
      <p className="text-xs text-text-muted max-w-[240px]">{label}</p>
    </div>
  );
}

// ─── KPI card ────────────────────────────────────────────────────────────────

interface KpiDef {
  key: string;
  label: string;
  icon: typeof Cpu;
  accent: string; // tailwind text color
}

const KPIS: KpiDef[] = [
  { key: 'totalDevices', label: 'Total Devices', icon: Cpu, accent: 'text-primary' },
  { key: 'onlineDevices', label: 'Online Devices', icon: Boxes, accent: 'text-success' },
  { key: 'telemetryPoints', label: 'Telemetry Points', icon: Activity, accent: 'text-info' },
  { key: 'alerts', label: 'Alerts', icon: AlertTriangle, accent: 'text-warning' },
  { key: 'automationExecutions', label: 'Automation Runs', icon: Zap, accent: 'text-primary' },
  { key: 'commands', label: 'Commands', icon: Send, accent: 'text-info' },
];

function KpiCard({
  kpi,
  value,
  loading,
}: {
  kpi: KpiDef;
  value: number | undefined;
  loading: boolean;
}) {
  const Icon = kpi.icon;
  return (
    <Card className="p-4 gap-2">
      <div className="flex items-center justify-between">
        <span className="truncate text-[11px] font-medium text-text-muted">{kpi.label}</span>
        <Icon className={cn('size-3.5', kpi.accent)} />
      </div>
      <div className="text-2xl font-semibold tabular-nums tracking-tight">
        {loading ? <Skeleton className="h-7 w-16" /> : (value ?? 0).toLocaleString()}
      </div>
    </Card>
  );
}

// ─── View ────────────────────────────────────────────────────────────────────

export default function AnalyticsView() {
  useRealtimeNotifications();

  const [range, setRange] = React.useState<string>('24h');
  const { data, isLoading, isError, error } = useAnalytics(range);

  const summary = data?.summary;
  const series = data?.series ?? [];
  const hourlyVolume = data?.hourlyVolume ?? [];
  const deviceVolume = data?.deviceVolume ?? [];
  const alertsBySeverity = data?.alertsBySeverity ?? [];

  // Animation stagger variants.
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } },
  };
  const item = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  return (
    <div className="flex min-h-screen flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      {/* ─── Header + range ─── */}
      <motion.header
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className="font-mono uppercase tracking-wider">Overview</span>
            <ChevronRight className="size-3" />
            <span className="text-text-secondary">Analytics</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Platform Analytics</h1>
          <p className="mt-1 text-sm text-text-muted">
            Aggregated platform activity and sensor trends over the selected range.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-muted">Range</span>
          <ToggleGroup
            type="single"
            value={range}
            onValueChange={(v) => v && setRange(v)}
            variant="outline"
            size="sm"
          >
            {RANGES.map((r) => (
              <ToggleGroupItem key={r.value} value={r.value} aria-label={`${r.label} range`}>
                {r.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </motion.header>

      {/* ─── Error ─── */}
      {isError && (
        <Card className="border-danger/40 bg-danger/5 p-4">
          <div className="flex items-center gap-3 text-danger">
            <AlertTriangle className="size-5" />
            <div>
              <p className="text-sm font-medium">Failed to load analytics</p>
              <p className="text-xs text-text-muted">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ─── KPI row ─── */}
      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        {KPIS.map((kpi) => (
          <motion.div key={kpi.key} variants={item}>
            <KpiCard
              kpi={kpi}
              value={summary ? (summary as Record<string, number>)[kpi.key] : undefined}
              loading={isLoading}
            />
          </motion.div>
        ))}
      </motion.section>

      {/* ─── Charts ─── */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Hourly volume */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4 text-primary" />
              Telemetry Volume by Hour
            </CardTitle>
            <CardDescription className="text-xs">
              Hourly ingest count over the selected range.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : hourlyVolume.length === 0 ? (
              <EmptyChart label="No telemetry ingested in this range." />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={hourlyVolume} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-subtle)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="hour"
                    stroke="var(--text-muted)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={20}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    width={48}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: 'var(--accent)', fillOpacity: 0.1 }}
                  />
                  <Bar
                    dataKey="count"
                    name="Points"
                    fill="var(--chart-2)"
                    radius={[3, 3, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Device volume */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="size-4 text-primary" />
              Telemetry Volume by Device
            </CardTitle>
            <CardDescription className="text-xs">
              Top {deviceVolume.length || 8} devices by points ingested.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : deviceVolume.length === 0 ? (
              <EmptyChart label="No device telemetry in this range." icon={Cpu} />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={deviceVolume}
                  layout="vertical"
                  margin={{ top: 8, right: 16, bottom: 0, left: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-subtle)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    stroke="var(--text-muted)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="deviceName"
                    stroke="var(--text-muted)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    width={110}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: 'var(--accent)', fillOpacity: 0.1 }}
                  />
                  <Bar
                    dataKey="count"
                    name="Points"
                    fill="var(--chart-1)"
                    radius={[0, 3, 3, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Alerts by severity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-warning" />
              Alerts by Severity
            </CardTitle>
            <CardDescription className="text-xs">
              Distribution of triggered alerts in this range.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : alertsBySeverity.length === 0 ? (
              <EmptyChart label="No alerts triggered in this range. All clear." icon={Sparkles} />
            ) : (
              <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[200px_1fr]">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={alertsBySeverity}
                      dataKey="count"
                      nameKey="severity"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={2}
                      isAnimationActive={false}
                    >
                      {alertsBySeverity.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={SEVERITY_COLOR_VAR[entry.severity as string] ?? 'var(--chart-3)'}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {alertsBySeverity.map((a) => {
                    const sev = a.severity as keyof typeof ALERT_SEVERITY_META;
                    const meta = ALERT_SEVERITY_META[sev] ?? ALERT_SEVERITY_META.INFO;
                    const Icon = meta.icon;
                    return (
                      <div
                        key={a.severity as string}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className={cn('size-3.5 shrink-0', meta.color)} />
                          <span className="truncate text-xs font-medium">{meta.label}</span>
                        </div>
                        <span className="text-sm font-semibold tabular-nums">
                          {a.count.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Multi-series trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="size-4 text-primary" />
              Sensor Trends (All Devices)
            </CardTitle>
            <CardDescription className="text-xs">
              Multi-series view across all sensors in the org.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : series.length === 0 ? (
              <EmptyChart label="No telemetry series in this range." icon={Gauge} />
            ) : (
              <TelemetryChart series={series} variant="area" height={240} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
