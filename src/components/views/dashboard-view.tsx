'use client';

// ─────────────────────────────────────────────────────────────────────────────
// SensorGrid — Dashboard View (Task 7)
// Landing view showing KPI row, AtmospherePanel, device grid, signal timeline
// and recent alerts. Driven by useDashboard() + useRealtimeNotifications().
// ─────────────────────────────────────────────────────────────────────────────

import * as React from 'react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Gauge,
  MapPin,
  ShieldAlert,
  Zap,
} from 'lucide-react';

import { useDashboard, useRealtimeNotifications, qk } from '@/lib/hooks';
import { useAppStore } from '@/lib/store';
import { ALERT_SEVERITY_META, formatNumber, sensorMeta, timeAgo } from '@/lib/status';
import type {
  AlertEventDTO,
  AlertSeverity,
  AuditLogDTO,
  DeviceDTO,
  EnvironmentSnapshotDTO,
} from '@/lib/types';
import { cn } from '@/lib/utils';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

import { PulseCard } from '@/components/aether/pulse-card';
import { AtmospherePanel } from '@/components/aether/atmosphere-panel';
import { DeviceOrb } from '@/components/aether/device-orb';
import { TelemetryTile } from '@/components/aether/telemetry-tile';
import { SignalTimeline } from '@/components/aether/signal-timeline';
import { DeviceStatusBadge } from '@/components/aether/status-badge';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TELEMETRY_PRIORITY = [
  'temperature',
  'humidity',
  'pressure',
  'co2',
  'light',
  'voltage',
  'current',
  'power',
  'motion',
] as const;

interface TwinReading {
  key: string;
  value: number;
  unit?: string;
  label?: string;
}

function extractTwinReadings(device: DeviceDTO, max = 3): TwinReading[] {
  const reported = device.twin?.reported;
  if (!reported || typeof reported !== 'object') return [];
  const out: TwinReading[] = [];
  const seen = new Set<string>();
  // Walk priority list first, then any extra numeric keys.
  for (const key of TELEMETRY_PRIORITY) {
    const raw = (reported as Record<string, unknown>)[key];
    if (typeof raw === 'number' && !Number.isNaN(raw)) {
      out.push({ key, value: raw, unit: sensorMeta(key).unit, label: sensorMeta(key).label });
      seen.add(key);
      if (out.length >= max) return out;
    }
  }
  for (const [key, raw] of Object.entries(reported as Record<string, unknown>)) {
    if (seen.has(key)) continue;
    if (typeof raw === 'number' && !Number.isNaN(raw)) {
      out.push({ key, value: raw, unit: sensorMeta(key).unit, label: sensorMeta(key).label });
      if (out.length >= max) break;
    }
  }
  return out;
}

function buildTelemetrySparkline(devices: DeviceDTO[] | undefined): number[] {
  if (!devices || devices.length === 0) return [];
  const vals: number[] = [];
  for (const d of devices) {
    if (d.status !== 'ONLINE' && d.status !== 'WARNING') continue;
    const readings = extractTwinReadings(d, 1);
    if (readings.length > 0) vals.push(readings[0].value);
  }
  return vals.slice(0, 12);
}

// ─── Inline AlertSeverityBadge ──────────────────────────────────────────────
// (The shared AlertSeverityBadge component is not yet exported from
// status-badge.tsx; we render an equivalent pill using ALERT_SEVERITY_META.)

function AlertSeverityBadge({
  severity,
  className,
}: {
  severity: AlertSeverity;
  className?: string;
}) {
  const meta = ALERT_SEVERITY_META[severity] ?? ALERT_SEVERITY_META.INFO;
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap',
        meta.color,
        meta.bg,
        meta.border,
        className
      )}
    >
      <Icon className="size-2.5" />
      {meta.label}
    </span>
  );
}

// ─── DashboardDeviceCard ─────────────────────────────────────────────────────

function DashboardDeviceCard({ device }: { device: DeviceDTO }) {
  const openDevice = useAppStore((s) => s.openDevice);
  const readings = extractTwinReadings(device, 3);

  return (
    <motion.button
      type="button"
      onClick={() => openDevice(device.id)}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={{ y: -2 }}
      className="group relative flex h-full w-full flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-border-subtle hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Top: orb + identity */}
      <div className="flex items-start gap-2.5 sm:gap-3">
        <div className="shrink-0">
          <DeviceOrb
            status={device.status}
            battery={device.battery}
            signal={device.signal}
            size={48}
            active={device.status === 'ONLINE' || device.status === 'WARNING'}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold tracking-tight leading-snug break-words">
                {device.name}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-text-muted">
                <MapPin className="size-3 shrink-0" />
                <span className="truncate">{device.location?.name ?? 'Unassigned'}</span>
              </p>
            </div>
            <DeviceStatusBadge status={device.status} size="sm" />
          </div>
          <p className="mt-1 text-[11px] text-text-muted">
            Last seen <span className="text-text-secondary">{timeAgo(device.lastSeen)}</span>
          </p>
        </div>
      </div>

      {/* Telemetry tiles — 2 cols on narrow screens, 3 when there's room */}
      {readings.length > 0 ? (
        <div
          className={cn(
            'grid gap-2',
            readings.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'
          )}
        >
          {readings.map((r) => (
            <TelemetryTile
              key={r.key}
              sensorKey={r.key}
              label={r.label}
              value={r.value}
              unit={r.unit}
              compact
            />
          ))}
        </div>
      ) : (
        <div className="flex h-16 items-center justify-center rounded-xl border border-dashed border-border text-[11px] text-text-muted">
          No telemetry yet
        </div>
      )}

      {/* Footer tags */}
      <div className="mt-auto flex items-center justify-between gap-2 text-[10px] text-text-muted">
        <span className="font-mono uppercase tracking-wide shrink-0">{device.type}</span>
        {device.tags.length > 0 ? (
          <span className="truncate">#{device.tags.slice(0, 2).join(' #')}</span>
        ) : (
          <span className="text-text-muted/60">{device.id.slice(0, 8)}</span>
        )}
      </div>
    </motion.button>
  );
}

// ─── Skeletons ───────────────────────────────────────────────────────────────

function KpiSkeletonRow() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="size-8 sm:size-9 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
          <Skeleton className="mt-3 h-10 w-full" />
        </Card>
      ))}
    </div>
  );
}

function DeviceGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="gap-3 p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="size-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Recent Alerts panel ─────────────────────────────────────────────────────

function RecentAlertsPanel({ alerts }: { alerts: AlertEventDTO[] }) {
  const qc = useQueryClient();
  const [acking, setAcking] = React.useState<string | null>(null);

  const acknowledge = React.useCallback(
    async (alert: AlertEventDTO) => {
      setAcking(alert.id);
      try {
        const r = await fetch(`/api/alerts/${alert.id}/acknowledge`, { method: 'POST' });
        if (!r.ok) throw new Error('Acknowledge failed');
        toast.success(`Acknowledged "${alert.ruleName}"`);
        qc.invalidateQueries({ queryKey: ['alerts'] });
        qc.invalidateQueries({ queryKey: qk.dashboard });
      } catch (e) {
        toast.error('Failed to acknowledge alert', {
          description: e instanceof Error ? e.message : undefined,
        });
      } finally {
        setAcking(null);
      }
    },
    [qc]
  );

  return (
    <Card className="flex h-full flex-col gap-0 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-danger/10 text-danger">
              <ShieldAlert className="size-4" />
            </span>
            <div>
              <CardTitle className="text-sm">Recent Alerts</CardTitle>
              <CardDescription className="text-xs">Latest 6 triggered events</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 px-2 pb-2">
        {alerts.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-text-muted">
            <CheckCircle2 className="size-8 text-success" />
            <p className="text-sm">No active alerts — all clear.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-96 pr-2">
            <ul className="space-y-2">
              {alerts.map((alert) => {
                const isTriggered = alert.status === 'TRIGGERED';
                return (
                  <li
                    key={alert.id}
                    className={cn(
                      'flex flex-col gap-2 rounded-xl border border-border bg-surface p-3 transition-colors',
                      isTriggered && 'border-danger/30 bg-danger/5'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <AlertSeverityBadge severity={alert.severity} />
                          {alert.device?.name && (
                            <span className="truncate text-xs text-text-muted">
                              · {alert.device.name}
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-sm font-medium leading-snug">{alert.ruleName}</p>
                        <p className="mt-0.5 text-xs text-text-muted line-clamp-2">
                          {alert.message}
                        </p>
                      </div>
                      <time className="shrink-0 text-[10px] text-text-muted">
                        {timeAgo(alert.triggeredAt)}
                      </time>
                    </div>
                    <div className="flex items-center justify-end">
                      <Button
                        size="sm"
                        variant={isTriggered ? 'outline' : 'ghost'}
                        disabled={!isTriggered || acking === alert.id}
                        onClick={() => acknowledge(alert)}
                        className="h-7 gap-1.5 px-2 text-xs"
                      >
                        {acking === alert.id ? (
                          <Activity className="size-3 animate-pulse" />
                        ) : (
                          <CheckCircle2 className="size-3" />
                        )}
                        {alert.status === 'ACKNOWLEDGED' ? 'Acknowledged' : 'Acknowledge'}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Activity panel ──────────────────────────────────────────────────────────

function ActivityPanel({ events }: { events: AuditLogDTO[] }) {
  return (
    <Card className="flex h-full flex-col gap-0 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Activity className="size-4" />
          </span>
          <div>
            <CardTitle className="text-sm">Signal Timeline</CardTitle>
            <CardDescription className="text-xs">Live system activity feed</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 px-3 pb-3">
        <div className="max-h-96 overflow-y-auto pr-2">
          <SignalTimeline events={events} emptyMessage="Waiting for activity…" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main DashboardView ─────────────────────────────────────────────────────

export default function DashboardView() {
  // Realtime subscription — invalidates queries on socket events.
  useRealtimeNotifications();

  const { data, isLoading, isError, error } = useDashboard();

  const stats = data?.stats;
  const environment: EnvironmentSnapshotDTO | null = data?.environment ?? null;
  const devices: DeviceDTO[] = data?.devices ?? [];
  const recentActivity = (data?.recentActivity ?? []) as unknown as AuditLogDTO[];
  const recentAlerts = (data?.recentAlerts ?? []) as unknown as AlertEventDTO[];

  const telemetrySparkline = React.useMemo(() => buildTelemetrySparkline(devices), [devices]);

  // Motion variants for staggered entrance.
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 },
    },
  };
  const item = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  return (
    <div className="min-h-screen flex flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      {/* ─── Header ─── */}
      <motion.header
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-1"
      >
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Dashboard</h1>
        <p className="text-sm text-text-muted">
          Real-time fleet overview · {stats ? `${stats.totalDevices} devices` : '…'} monitored
        </p>
      </motion.header>

      {/* ─── Error state ─── */}
      {isError && (
        <Card className="border-danger/40 bg-danger/5 p-4">
          <div className="flex items-center gap-3 text-danger">
            <AlertTriangle className="size-5" />
            <div>
              <p className="text-sm font-medium">Failed to load dashboard</p>
              <p className="text-xs text-text-muted">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ─── KPI row ─── */}
      {isLoading && !stats ? (
        <KpiSkeletonRow />
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5"
        >
          <motion.div variants={item}>
            <PulseCard
              icon={Cpu}
              title="Online Devices"
              value={stats ? formatNumber(stats.onlineDevices, 0) : '—'}
              unit={stats ? `/ ${stats.totalDevices}` : undefined}
              accent="success"
              sparkline={telemetrySparkline}
              footer={
                stats ? (
                  <span>
                    {stats.offlineDevices} offline · {stats.warningDevices} warning
                  </span>
                ) : null
              }
            />
          </motion.div>

          <motion.div variants={item}>
            <PulseCard
              icon={AlertTriangle}
              title="Offline / Critical"
              value={stats ? formatNumber(stats.offlineDevices + stats.criticalDevices, 0) : '—'}
              accent="warning"
              footer={
                stats ? (
                  <span>
                    {stats.criticalDevices} critical · {stats.offlineDevices} offline
                  </span>
                ) : null
              }
            />
          </motion.div>

          <motion.div variants={item}>
            <PulseCard
              icon={ShieldAlert}
              title="Active Alerts"
              value={stats ? formatNumber(stats.activeAlerts, 0) : '—'}
              accent="danger"
              footer={
                <span className={stats && stats.activeAlerts > 0 ? 'text-danger' : 'text-success'}>
                  {stats && stats.activeAlerts > 0 ? 'Requires attention' : 'All systems nominal'}
                </span>
              }
            />
          </motion.div>

          <motion.div variants={item}>
            <PulseCard
              icon={Zap}
              title="Automations Today"
              value={stats ? formatNumber(stats.automationsToday, 0) : '—'}
              accent="primary"
              footer={stats ? <span>{stats.commandsToday} commands sent</span> : null}
            />
          </motion.div>

          <motion.div variants={item}>
            <PulseCard
              icon={Gauge}
              title="Telemetry (1h)"
              value={stats ? formatNumber(stats.telemetryPointsToday, 0) : '—'}
              unit="pts"
              accent="info"
              footer={<span>Last hour ingest</span>}
            />
          </motion.div>
        </motion.div>
      )}

      {/* ─── Atmosphere panel ─── */}
      <motion.section
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        {isLoading && !environment ? (
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          </Card>
        ) : (
          <AtmospherePanel snapshot={environment} />
        )}
      </motion.section>

      {/* ─── Device grid ─── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-tight">Devices</h2>
          <span className="text-xs text-text-muted">
            {devices.length} total · {devices.filter((d) => d.status === 'ONLINE').length} online
          </span>
        </div>

        {isLoading && devices.length === 0 ? (
          <DeviceGridSkeleton />
        ) : devices.length === 0 ? (
          <Card className="flex h-48 items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-text-muted">
              <Cpu className="size-8" />
              <p className="text-sm">No devices registered yet.</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {devices.map((device) => (
              <DashboardDeviceCard key={device.id} device={device} />
            ))}
          </div>
        )}
      </section>

      {/* ─── Activity + Alerts ─── */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="lg:col-span-2"
        >
          <ActivityPanel events={recentActivity} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <RecentAlertsPanel alerts={recentAlerts} />
        </motion.div>
      </section>
    </div>
  );
}
