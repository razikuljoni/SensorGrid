'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Nexora Pulse — Telemetry Explorer View (Task 9)
// Cross-device time-series telemetry browser with live sensor tiles.
// Driven by useDevices() + useDevice() + useDeviceTelemetry() + realtime socket.
// ─────────────────────────────────────────────────────────────────────────────

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  ChevronRight,
  Radio,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

import { TelemetryChart } from '@/components/charts/telemetry-chart'
import { TelemetryTile } from '@/components/aether/telemetry-tile'

import {
  useDevice,
  useDeviceTelemetry,
  useDevices,
  useRealtimeNotifications,
} from '@/lib/hooks'
import { useRealtimeSocket } from '@/lib/realtime'
import { formatTime } from '@/lib/status'
import { cn } from '@/lib/utils'

// ─── Ranges ──────────────────────────────────────────────────────────────────

const RANGES: { value: string; label: string }[] = [
  { value: '1h', label: '1h' },
  { value: '6h', label: '6h' },
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
]

// ─── Coerce a twin reported value to a number for the TelemetryTile ──────────

function toNumeric(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'boolean') return raw ? 1 : 0
  if (typeof raw === 'string') {
    const n = Number(raw)
    if (Number.isFinite(n)) return n
  }
  return null
}

// ─── View ────────────────────────────────────────────────────────────────────

export default function TelemetryView() {
  // Realtime subscription auto-invalidates the relevant queries on telemetry events.
  useRealtimeNotifications()

  const devices = useDevices()
  const [deviceId, setDeviceId] = React.useState<string | null>(null)
  const [sensorKey, setSensorKey] = React.useState<string>('all')
  const [range, setRange] = React.useState<string>('24h')

  // Auto-pick the first device once the list arrives.
  React.useEffect(() => {
    if (!deviceId && devices.data && devices.data.length > 0) {
      setDeviceId(devices.data[0].id)
    }
  }, [deviceId, devices.data])

  // Reset sensor filter when the device changes.
  React.useEffect(() => {
    setSensorKey('all')
  }, [deviceId])

  const device = useDevice(deviceId)
  const telemetry = useDeviceTelemetry(
    deviceId,
    sensorKey === 'all' ? null : sensorKey,
    range,
  )

  // ─── "Live" pulse — flashes for ~2.2s after each telemetry event for the selected device.
  const [live, setLive] = React.useState(false)
  const liveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  useRealtimeSocket((event) => {
    if (event.type === 'device.telemetry' && event.deviceId === deviceId) {
      setLive(true)
      if (liveTimer.current) clearTimeout(liveTimer.current)
      liveTimer.current = setTimeout(() => setLive(false), 2200)
    }
  })
  React.useEffect(() => {
    return () => {
      if (liveTimer.current) clearTimeout(liveTimer.current)
    }
  }, [])

  // ─── Derived state ─────────────────────────────────────────────────────────
  const sensors = device.data?.sensors ?? []
  const reported = (device.data?.twin?.reported ?? {}) as Record<string, unknown>
  const twinUpdatedAt = device.data?.twin?.updatedAt ?? null
  const series = telemetry.data?.series ?? []
  const hasSensors = sensors.length > 0
  const selectedSensor = sensorKey === 'all' ? null : sensors.find((s) => s.key === sensorKey) ?? null

  return (
    <div className="flex min-h-screen flex-col gap-6 p-4 sm:p-6">
      {/* ─── Header ─── */}
      <motion.header
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-1"
      >
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="font-mono uppercase tracking-wider">Overview</span>
          <ChevronRight className="size-3" />
          <span className="text-text-secondary">Telemetry</span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Telemetry Explorer</h1>
        <p className="text-sm text-text-muted">
          Cross-device time-series telemetry for any sensor over any range.
        </p>
      </motion.header>

      {/* ─── Toolbar ─── */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Device select */}
          <div className="flex items-center gap-2 min-w-[180px] flex-1">
            <label className="hidden text-xs font-medium text-text-muted sm:inline">
              Device
            </label>
            <Select value={deviceId ?? ''} onValueChange={setDeviceId}>
              <SelectTrigger className="w-full sm:w-60" size="sm">
                <SelectValue
                  placeholder={
                    devices.isLoading ? 'Loading devices…' : 'Select a device'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {devices.data?.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    <span className="truncate">{d.name}</span>
                    <span className="ml-1 text-text-muted text-xs">· {d.type}</span>
                  </SelectItem>
                ))}
                {devices.data && devices.data.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-text-muted">
                    No devices registered.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Sensor select */}
          <div className="flex items-center gap-2 min-w-[160px] flex-1">
            <label className="hidden text-xs font-medium text-text-muted sm:inline">
              Sensor
            </label>
            <Select
              value={sensorKey}
              onValueChange={setSensorKey}
              disabled={!device.data || !hasSensors}
            >
              <SelectTrigger className="w-full sm:w-48" size="sm">
                <SelectValue placeholder="All sensors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sensors</SelectItem>
                {sensors.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    <span className="truncate">{s.label}</span>
                    <span className="ml-1 text-text-muted text-xs">· {s.unit}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Range selector */}
          <div className="flex items-center gap-2 sm:ml-auto">
            <SlidersHorizontal className="size-3.5 text-text-muted hidden sm:block" />
            <span className="text-xs font-medium text-text-muted hidden sm:inline">
              Range
            </span>
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

          {/* Live indicator */}
          <div
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors',
              live
                ? 'border-success/30 bg-success/10 text-success'
                : 'border-border bg-muted text-text-muted',
            )}
            role="status"
            aria-live="polite"
          >
            <span className="relative flex size-1.5">
              {live && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
              )}
              <span
                className={cn(
                  'relative inline-flex size-1.5 rounded-full',
                  live ? 'bg-success' : 'bg-muted-foreground/40',
                )}
              />
            </span>
            {live ? 'LIVE' : 'IDLE'}
          </div>
        </div>
      </Card>

      {/* ─── Main chart ─── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="size-4 text-primary" />
                <span className="truncate">
                  {device.data ? device.data.name : 'Telemetry'}
                </span>
                <span className="text-text-muted font-normal text-xs">
                  · {selectedSensor ? selectedSensor.label : 'All sensors'}
                </span>
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                Range <span className="font-mono">{range}</span> · Last seen{' '}
                <span className="font-mono">
                  {device.data?.lastSeen ? formatTime(device.data.lastSeen, false) : '—'}
                </span>
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => telemetry.refetch()}
              disabled={telemetry.isFetching || !deviceId}
            >
              <RefreshCw className={cn('size-3.5', telemetry.isFetching && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {telemetry.isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : telemetry.isError ? (
            <div className="flex h-[300px] flex-col items-center justify-center gap-2 text-center">
              <Activity className="size-6 text-danger/60" />
              <p className="text-sm text-danger">Failed to load telemetry.</p>
              <p className="text-xs text-text-muted">Try a different range or device.</p>
            </div>
          ) : series.length === 0 ? (
            <div className="flex h-[300px] flex-col items-center justify-center gap-2 text-center">
              <Activity className="size-6 text-text-muted/50" />
              <p className="text-sm text-text-muted">No telemetry points for this range.</p>
              <p className="text-xs text-text-muted">
                The device may be offline or hasn&apos;t reported yet.
              </p>
            </div>
          ) : (
            <TelemetryChart series={series} variant="area" height={300} />
          )}
        </CardContent>
      </Card>

      {/* ─── Latest sensor tiles ─── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Radio className="size-4 text-primary" />
                Latest Sensor Values
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                Sourced from the device twin&apos;s reported state ·{' '}
                <span className="font-mono">
                  {twinUpdatedAt ? formatTime(twinUpdatedAt) : 'not synced yet'}
                </span>
              </CardDescription>
            </div>
            {device.data && (
              <span className="hidden text-[10px] font-mono uppercase tracking-wider text-text-muted sm:inline">
                {sensors.length} sensor{sensors.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!device.data ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-[88px] w-full rounded-xl" />
              ))}
            </div>
          ) : !hasSensors ? (
            <div className="flex h-32 items-center justify-center text-sm text-text-muted">
              This device has no sensors registered.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {sensors.map((s) => (
                <TelemetryTile
                  key={s.key}
                  sensorKey={s.key}
                  label={s.label}
                  value={toNumeric(reported[s.key])}
                  unit={s.unit}
                  timestamp={twinUpdatedAt}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
