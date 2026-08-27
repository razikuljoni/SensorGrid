'use client'

import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import {
  useDevice,
  useDeviceTelemetry,
  useDeviceHistory,
  qk,
} from '@/lib/hooks'
import {
  batteryMeta,
  signalMeta,
  timeAgo,
  formatTime,
  formatNumber,
  DEVICE_STATUS_META,
  COMMAND_STATUS_META,
  sensorMeta,
} from '@/lib/status'
import type {
  DeviceDTO,
  SensorDTO,
  CommandDTO,
  AuditLogDTO,
  TelemetrySeriesDTO,
} from '@/lib/types'
import { DeviceOrb } from '@/components/aether/device-orb'
import { DeviceStatusBadge } from '@/components/aether/status-badge'
import { TelemetryTile } from '@/components/aether/telemetry-tile'
import { SignalTimeline } from '@/components/aether/signal-timeline'
import { TelemetryChart } from '@/components/charts/telemetry-chart'
import { useToast } from '@/hooks/use-toast'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Activity,
  ArrowLeft,
  Calendar,
  Cpu,
  Globe,
  Hash,
  MapPin,
  Pencil,
  Plug,
  Radio,
  Zap,
  Send,
  Save,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'

// ─── Top-level device detail view ────────────────────────────────────────────
export function DeviceDetailView() {
  const deviceId = useAppStore((s) => s.selectedDeviceId)
  const setView = useAppStore((s) => s.setView)
  const onBack = React.useCallback(() => setView('devices'), [setView])

  if (!deviceId) return <NoSelectionPlaceholder />

  return <DeviceDetailContent deviceId={deviceId} onBack={onBack} />
}

function NoSelectionPlaceholder() {
  const setView = useAppStore((s) => s.setView)
  return (
    <Card className="flex flex-col items-center gap-3 p-12 text-center mx-4 my-4 sm:mx-6 sm:my-6">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted text-text-muted">
        <Cpu className="size-6" />
      </div>
      <div>
        <p className="text-sm font-medium">No device selected</p>
        <p className="text-xs text-text-muted">
          Pick a device from the list to see its detail view.
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={() => setView('devices')}>
        <ArrowLeft className="size-4" /> Back to devices
      </Button>
    </Card>
  )
}

// ─── Device detail content ──────────────────────────────────────────────────
function DeviceDetailContent({
  deviceId,
  onBack,
}: {
  deviceId: string
  onBack: () => void
}) {
  const { data: device, isLoading, isError, refetch } = useDevice(deviceId)
  const [tab, setTab] = React.useState('overview')

  if (isError) {
    return (
      <Card className="flex flex-col items-center gap-3 p-12 text-center mx-4 my-4 sm:mx-6 sm:my-6">
        <div className="flex size-12 items-center justify-center rounded-full bg-danger/10 text-danger">
          <AlertTriangle className="size-5" />
        </div>
        <div>
          <p className="text-sm font-medium">Couldn&apos;t load this device</p>
          <p className="text-xs text-text-muted">It may have been removed.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </Card>
    )
  }

  if (isLoading || !device) return <DetailSkeleton onBack={onBack} />

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <DetailTopBar device={device} onBack={onBack} />
      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <TabsList className="w-fit overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="telemetry">Telemetry</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
          <TabsTrigger value="twin">Twin</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab device={device} />
        </TabsContent>
        <TabsContent value="telemetry">
          <TelemetryTab deviceId={device.id} sensors={device.sensors} />
        </TabsContent>
        <TabsContent value="controls">
          <ControlsTab device={device} />
        </TabsContent>
        <TabsContent value="twin">
          <TwinTab device={device} />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab deviceId={device.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Device type icon (statically declared) ─────────────────────────────────
const DEVICE_TYPE_ICON: Record<DeviceDTO['type'], typeof Cpu> = {
  ESP32: Cpu,
  RPI: Cpu,
  ARDUINO: Cpu,
  GATEWAY: Plug,
  GENERIC: Cpu,
}

function DeviceTypeIcon({
  type,
  className,
}: {
  type: DeviceDTO['type']
  className?: string
}) {
  const Icon = DEVICE_TYPE_ICON[type] ?? Cpu
  return <Icon className={className} />
}

// ─── Top bar ─────────────────────────────────────────────────────────────────
function DetailTopBar({ device, onBack }: { device: DeviceDTO; onBack: () => void }) {
  const qc = useQueryClient()
  const { toast } = useToast()
  const [editOpen, setEditOpen] = React.useState(false)
  const [name, setName] = React.useState(device.name)
  const [notes, setNotes] = React.useState(device.notes ?? '')
  const [tagsInput, setTagsInput] = React.useState((device.tags ?? []).join(', '))

  // Reset form when device changes
  React.useEffect(() => {
    setName(device.name)
    setNotes(device.notes ?? '')
    setTagsInput((device.tags ?? []).join(', '))
  }, [device.id, device.name, device.notes, device.tags])

  const onSave = async () => {
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    try {
      const r = await fetch(`/api/devices/${device.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, notes, tags }),
      })
      if (!r.ok) throw new Error('Failed to save')
      toast({ title: 'Device updated', description: `${name} has been saved.` })
      setEditOpen(false)
      qc.invalidateQueries({ queryKey: qk.device(device.id) })
      qc.invalidateQueries({ queryKey: ['devices'] })
    } catch (e) {
      toast({
        title: 'Update failed',
        description: (e as Error).message,
      })
    }
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-4 min-w-0">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to devices" className="shrink-0">
          <ArrowLeft className="size-4" />
        </Button>
        <DeviceOrb
          status={device.status}
          battery={device.battery}
          signal={device.signal}
          size={64}
          active={device.status === 'ONLINE' || device.status === 'WARNING'}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight truncate">{device.name}</h1>
            <DeviceStatusBadge status={device.status} size="sm" />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" />
              {device.location?.name ?? 'Unassigned'}
            </span>
            <span className="inline-flex items-center gap-1">
              <DeviceTypeIcon type={device.type} className="size-3" />
              {device.type}
            </span>
            {device.firmwareVersion && (
              <span className="inline-flex items-center gap-1">
                <Hash className="size-3" />
                fw {device.firmwareVersion}
              </span>
            )}
            {device.macAddress && (
              <span className="inline-flex items-center gap-1 font-mono">
                <Cpu className="size-3" />
                {device.macAddress}
              </span>
            )}
            {device.ipAddress && (
              <span className="inline-flex items-center gap-1 font-mono">
                <Globe className="size-3" />
                {device.ipAddress}
              </span>
            )}
          </div>
          <p className="mt-1 font-mono text-[10px] text-text-muted">{device.id}</p>
        </div>
      </div>

      <Button variant="outline" size="sm" className="gap-1.5 self-start lg:self-auto" onClick={() => setEditOpen(true)}>
        <Pencil className="size-3.5" /> Edit
      </Button>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b border-border">
            <SheetTitle className="text-sm">Edit device</SheetTitle>
            <SheetDescription className="text-xs">
              Update the name, notes, or tags for this device.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add context for operators…"
                className="min-h-24"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-tags">Tags</Label>
              <Input
                id="edit-tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="environment, primary"
              />
              <p className="text-[11px] text-text-muted">Comma-separated</p>
            </div>
            {device.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {device.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="bg-accent/40 text-accent-foreground">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <SheetFooter className="flex-row border-t border-border p-3 gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1 gap-1.5" onClick={onSave}>
              <Save className="size-3.5" /> Save
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ─── Overview tab ───────────────────────────────────────────────────────────
function OverviewTab({ device }: { device: DeviceDTO }) {
  const { data: history } = useDeviceHistory(device.id)
  const audits: AuditLogDTO[] = history?.audits ?? []

  const reported = (device.twin?.reported ?? {}) as Record<string, unknown>

  // Build a list of telemetry tiles: each declared sensor + any extra numeric
  // reported values that aren't covered by a sensor definition.
  const reportedTiles = React.useMemo(() => {
    const tiles: Array<{ key: string; label: string; unit: string; value: number | null }> = []
    const seen = new Set<string>()
    for (const s of device.sensors ?? []) {
      const v = reported[s.key]
      tiles.push({
        key: s.key,
        label: s.label,
        unit: s.unit,
        value: typeof v === 'number' ? v : null,
      })
      seen.add(s.key)
    }
    for (const [k, v] of Object.entries(reported)) {
      if (seen.has(k)) continue
      if (typeof v === 'number') {
        const meta = sensorMeta(k)
        tiles.push({ key: k, label: meta.label, unit: meta.unit, value: v })
      }
    }
    return tiles
  }, [device.sensors, reported])

  const uptimeLabel = formatUptime(device.createdAt)
  const bat = batteryMeta(device.battery)
  const sig = signalMeta(device.signal)
  const BatIcon = bat.icon
  const SigIcon = sig.icon

  return (
    <div className="flex flex-col gap-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          icon={<CheckCircle2 className="size-4" />}
          label="Status"
          value={DEVICE_STATUS_META[device.status]?.label ?? device.status}
          accent="primary"
          footer={<span className={DEVICE_STATUS_META[device.status]?.color}>since {timeAgo(device.lastSeen)}</span>}
        />
        <KpiCard
          icon={<BatIcon className={bat.color} />}
          label="Battery"
          value={bat.label}
          accent={device.battery === null ? 'info' : device.battery < 15 ? 'danger' : device.battery < 40 ? 'warning' : 'success'}
          footer={
            device.battery !== null ? (
              <Progress value={device.battery} className="h-1.5" />
            ) : (
              <span className="text-text-muted">Mains powered</span>
            )
          }
        />
        <KpiCard
          icon={<SigIcon className={sig.color} />}
          label="Signal"
          value={sig.label}
          accent={device.signal === null ? 'info' : device.signal > -55 ? 'success' : device.signal > -75 ? 'warning' : 'danger'}
          footer={<span className="text-text-muted">RSSI</span>}
        />
        <KpiCard
          icon={<Calendar className="size-4" />}
          label="Uptime"
          value={uptimeLabel}
          accent="info"
          footer={<span className="text-text-muted">since {formatTime(device.createdAt, false)}</span>}
        />
      </div>

      {/* Latest telemetry tiles */}
      <Card className="p-4 gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-text-muted" />
            <h3 className="text-sm font-semibold">Latest telemetry</h3>
          </div>
          <span className="text-[11px] text-text-muted">from reported twin state</span>
        </div>
        {reportedTiles.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-text-muted">
            No reported telemetry yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {reportedTiles.map((t) => (
              <TelemetryTile
                key={t.key}
                sensorKey={t.key}
                label={t.label}
                value={t.value}
                unit={t.unit}
                quality="GOOD"
                timestamp={device.twin?.updatedAt ?? null}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Recent activity */}
      <Card className="p-4 gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="size-4 text-text-muted" />
            <h3 className="text-sm font-semibold">Recent activity</h3>
          </div>
          <span className="text-[11px] text-text-muted">{audits.length} events</span>
        </div>
        <Separator />
        <SignalTimeline
          events={audits}
          maxItems={15}
          className="max-h-80"
          emptyMessage="No recent activity for this device."
        />
      </Card>
    </div>
  )
}

// ─── Telemetry tab ──────────────────────────────────────────────────────────
const RANGES = ['1h', '6h', '24h', '7d', '30d'] as const
type Range = (typeof RANGES)[number]

function TelemetryTab({
  deviceId,
  sensors,
}: {
  deviceId: string
  sensors: SensorDTO[]
}) {
  const [range, setRange] = React.useState<Range>('24h')
  const [sensorKey, setSensorKey] = React.useState<string>('all')

  const { data, isLoading } = useDeviceTelemetry(
    deviceId,
    sensorKey === 'all' ? null : sensorKey,
    range,
  )
  const series: TelemetrySeriesDTO[] = data?.series ?? []

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4 gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-text-muted" />
            <h3 className="text-sm font-semibold">Telemetry</h3>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={sensorKey} onValueChange={setSensorKey}>
              <SelectTrigger size="sm" className="w-full sm:w-44" aria-label="Sensor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sensors</SelectItem>
                {sensors.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.label} ({s.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={range} onValueChange={(v) => setRange(v as Range)}>
              <SelectTrigger size="sm" className="w-full sm:w-28" aria-label="Range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Separator />
        {isLoading ? (
          <Skeleton className="h-[260px] w-full rounded-md" />
        ) : (
          <TelemetryChart series={series} height={280} />
        )}
      </Card>
    </div>
  )
}

// ─── Controls tab ───────────────────────────────────────────────────────────
function ControlsTab({ device }: { device: DeviceDTO }) {
  const qc = useQueryClient()
  const { toast } = useToast()
  const desired = (device.twin?.desired ?? {}) as Record<string, unknown>

  // Local editable copy of desired values
  const [values, setValues] = React.useState<Record<string, unknown>>(() => ({ ...desired }))
  React.useEffect(() => {
    setValues({ ...desired })
  }, [device.id, device.twin?.version])

  const sensorByKey = React.useMemo(() => {
    const m = new Map<string, SensorDTO>()
    for (const s of device.sensors ?? []) m.set(s.key, s)
    return m
  }, [device.sensors])

  const entries = Object.entries(values)
  const [sending, setSending] = React.useState(false)

  const setVal = (k: string, v: unknown) =>
    setValues((prev) => ({ ...prev, [k]: v }))

  const onSend = async () => {
    setSending(true)
    try {
      const r = await fetch(`/api/devices/${device.id}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: values }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error ?? 'Failed to send command')
      toast({
        title: 'Command sent',
        description: `Payload dispatched to ${device.name}.`,
      })
      qc.invalidateQueries({ queryKey: qk.deviceCommands(device.id) })
      qc.invalidateQueries({ queryKey: qk.deviceHistory(device.id) })
    } catch (e) {
      toast({
        title: 'Command failed',
        description: (e as Error).message,
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4 gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-text-muted" />
            <h3 className="text-sm font-semibold">Desired state controls</h3>
          </div>
          <span className="text-[11px] text-text-muted">twin v{device.twin?.version ?? 0}</span>
        </div>
        <Separator />
        {entries.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-text-muted">
            No desired-state properties defined for this device.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {entries.map(([key, value]) => (
              <ControlWidget
                key={key}
                propKey={key}
                value={value}
                sensor={sensorByKey.get(key)}
                onChange={(v) => setVal(key, v)}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Send command */}
      <Card className="p-4 gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="size-4 text-text-muted" />
            <h3 className="text-sm font-semibold">Send command</h3>
          </div>
          <Button size="sm" className="gap-1.5" onClick={onSend} disabled={sending || device.status === 'OFFLINE'}>
            <Send className="size-3.5" />
            {sending ? 'Sending…' : 'Send Command'}
          </Button>
        </div>
        <Separator />
        <pre className="max-h-64 overflow-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed text-text-secondary">
{JSON.stringify(values, null, 2)}
        </pre>
        {device.status === 'OFFLINE' && (
          <p className="text-xs text-warning">
            Device is offline — commands cannot be sent until it reconnects.
          </p>
        )}
      </Card>
    </div>
  )
}

function ControlWidget({
  propKey,
  value,
  sensor,
  onChange,
}: {
  propKey: string
  value: unknown
  sensor: SensorDTO | undefined
  onChange: (v: unknown) => void
}) {
  const label = sensor?.label ?? propKey
  return (
    <div className="rounded-lg border border-border bg-surface p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-text-secondary">{label}</Label>
        <span className="font-mono text-[10px] text-text-muted">{propKey}</span>
      </div>
      <ControlInput propKey={propKey} value={value} sensor={sensor} onChange={onChange} />
    </div>
  )
}

function ControlInput({
  propKey,
  value,
  sensor,
  onChange,
}: {
  propKey: string
  value: unknown
  sensor: SensorDTO | undefined
  onChange: (v: unknown) => void
}) {
  if (typeof value === 'boolean') {
    return (
      <div className="flex items-center justify-between gap-3 pt-1">
        <span className={cn('text-xs', value ? 'text-success' : 'text-text-muted')}>
          {value ? 'On' : 'Off'}
        </span>
        <Switch checked={value} onCheckedChange={(v) => onChange(v)} aria-label={propKey} />
      </div>
    )
  }
  if (typeof value === 'number') {
    const min = sensor?.min ?? 0
    const max = sensor?.max ?? 100
    // Clamp current value into range for display, but keep precision on change.
    const clamped = Math.max(min, Math.min(max, value))
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold tabular-nums">
            {formatNumber(value, 1)}
          </span>
          {sensor?.unit && <span className="text-[11px] text-text-muted">{sensor.unit}</span>}
        </div>
        <Slider
          value={[clamped]}
          min={min}
          max={max}
          step={(max - min) <= 10 ? 0.1 : 1}
          onValueChange={(arr) => onChange(arr[0])}
          aria-label={propKey}
        />
        <div className="flex justify-between text-[10px] text-text-muted font-mono">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    )
  }
  if (typeof value === 'string') {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={propKey}
        className="font-mono text-xs"
      />
    )
  }
  // Object/array — fall back to JSON textarea
  return (
    <Textarea
      value={JSON.stringify(value, null, 2)}
      onChange={(e) => {
        try {
          onChange(JSON.parse(e.target.value))
        } catch {
          /* ignore — keep editing */
        }
      }}
      className="font-mono text-xs min-h-20"
    />
  )
}

// ─── Twin tab ────────────────────────────────────────────────────────────────
function TwinTab({ device }: { device: DeviceDTO }) {
  const qc = useQueryClient()
  const { toast } = useToast()
  const desired = (device.twin?.desired ?? {}) as Record<string, unknown>
  const reported = (device.twin?.reported ?? {}) as Record<string, unknown>

  const [editOpen, setEditOpen] = React.useState(false)
  const [draft, setDraft] = React.useState(() => JSON.stringify(desired, null, 2))
  React.useEffect(() => {
    setDraft(JSON.stringify(desired, null, 2))
  }, [device.id, device.twin?.version])

  const onSave = async () => {
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(draft)
    } catch (e) {
      toast({ title: 'Invalid JSON', description: (e as Error).message })
      return
    }
    try {
      const r = await fetch(`/api/devices/${device.id}/twin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      })
      if (!r.ok) throw new Error('Failed to update twin')
      toast({ title: 'Desired state updated', description: `Twin version incremented.` })
      setEditOpen(false)
      qc.invalidateQueries({ queryKey: qk.device(device.id) })
      qc.invalidateQueries({ queryKey: qk.deviceTwin(device.id) })
    } catch (e) {
      toast({ title: 'Update failed', description: (e as Error).message })
    }
  }

  const diffs = computeTwinDifferences(desired, reported)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-4 gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Desired</h3>
              <Badge variant="secondary" className="bg-accent/40 text-accent-foreground text-[10px]">v{device.twin?.version ?? 0}</Badge>
            </div>
            <Button size="sm" variant="outline" className="gap-1 h-7" onClick={() => setEditOpen(true)}>
              <Pencil className="size-3" /> Edit Desired
            </Button>
          </div>
          <pre className="max-h-96 overflow-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed text-text-secondary">
{JSON.stringify(desired, null, 2)}
          </pre>
        </Card>
        <Card className="p-4 gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Reported</h3>
              <span className="text-[11px] text-text-muted">
                updated {timeAgo(device.twin?.updatedAt ?? null)}
              </span>
            </div>
          </div>
          <pre className="max-h-96 overflow-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed text-text-secondary">
{JSON.stringify(reported, null, 2)}
          </pre>
        </Card>
      </div>

      <Card className="p-4 gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-warning" />
          <h3 className="text-sm font-semibold">Differences</h3>
        </div>
        <Separator />
        {diffs.length === 0 ? (
          <div className="flex h-20 items-center justify-center text-sm text-text-muted gap-2">
            <CheckCircle2 className="size-4 text-success" />
            Desired and reported are in sync.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {diffs.map((d) => (
              <li key={d.key} className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[10px]">{d.key}</Badge>
                  {d.kind === 'only-desired' && <span className="text-[11px] text-text-muted">not yet reported</span>}
                  {d.kind === 'only-reported' && <span className="text-[11px] text-text-muted">only in reported</span>}
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="rounded bg-accent/30 px-1.5 py-0.5 text-accent-foreground">
                    {formatJsonShort(d.desired)}
                  </span>
                  <span className="text-text-muted">→</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-text-secondary">
                    {formatJsonShort(d.reported)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit desired state</DialogTitle>
            <DialogDescription>
              Provide the full desired-state JSON. It will be merged into the
              twin and a new version will be assigned.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="font-mono text-xs min-h-72"
            spellCheck={false}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button className="gap-1.5" onClick={onSave}>
              <Save className="size-3.5" /> Save desired state
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── History tab ────────────────────────────────────────────────────────────
function HistoryTab({ deviceId }: { deviceId: string }) {
  const { data, isLoading } = useDeviceHistory(deviceId)
  const commands: CommandDTO[] = data?.commands ?? []
  const audits: AuditLogDTO[] = data?.audits ?? []

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4 gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="size-4 text-text-muted" />
            <h3 className="text-sm font-semibold">Activity timeline</h3>
          </div>
          <span className="text-[11px] text-text-muted">{audits.length} events</span>
        </div>
        <Separator />
        {isLoading ? (
          <div className="space-y-2 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : (
          <SignalTimeline
            events={audits}
            maxItems={20}
            className="max-h-80"
            emptyMessage="No activity recorded yet."
          />
        )}
      </Card>

      <Card className="p-4 gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-text-muted" />
            <h3 className="text-sm font-semibold">Command history</h3>
          </div>
          <span className="text-[11px] text-text-muted">{commands.length} commands</span>
        </div>
        <Separator />
        {isLoading ? (
          <div className="space-y-2 py-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : commands.length === 0 ? (
          <div className="flex h-20 items-center justify-center text-sm text-text-muted">
            No commands have been sent to this device.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Status</TableHead>
                <TableHead>Payload</TableHead>
                <TableHead className="w-32">Sender</TableHead>
                <TableHead className="w-36">Sent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commands.map((cmd) => {
                const meta = COMMAND_STATUS_META[cmd.status] ?? COMMAND_STATUS_META.PENDING
                const Icon = meta.icon
                return (
                  <TableRow key={cmd.id}>
                    <TableCell>
                      <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium', meta.color, meta.bg, meta.border)}>
                        <Icon className="size-2.5" />
                        {meta.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <pre className="font-mono text-[11px] text-text-secondary line-clamp-2 max-w-md">
{truncateJson(cmd.payload, 120)}
                      </pre>
                    </TableCell>
                    <TableCell className="text-xs text-text-muted">{cmd.senderName}</TableCell>
                    <TableCell className="text-xs text-text-muted" title={cmd.createdAt}>
                      {timeAgo(cmd.createdAt)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}

// ─── KPI mini-card ───────────────────────────────────────────────────────────
type KpiAccent = 'primary' | 'success' | 'warning' | 'danger' | 'info'

const KPI_ACCENT_CLASS: Record<KpiAccent, string> = {
  primary: 'text-primary bg-primary/10',
  success: 'text-success bg-success/10',
  warning: 'text-warning bg-warning/10',
  danger: 'text-danger bg-danger/10',
  info: 'text-info bg-info/10',
}

function KpiCard({
  icon,
  label,
  value,
  accent,
  footer,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  accent: KpiAccent
  footer?: React.ReactNode
}) {
  return (
    <Card className="p-4 gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
          {label}
        </span>
        <span className={cn('flex size-7 items-center justify-center rounded-lg', KPI_ACCENT_CLASS[accent])}>
          {icon}
        </span>
      </div>
      <div className="text-lg font-semibold tabular-nums tracking-tight">{value}</div>
      {footer && <div className="text-[11px] text-text-muted">{footer}</div>}
    </Card>
  )
}

// ─── Detail skeleton ─────────────────────────────────────────────────────────
function DetailSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
          <ArrowLeft className="size-4" />
        </Button>
        <Skeleton className="size-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-72" />
          <Skeleton className="h-2.5 w-32" />
        </div>
      </div>
      <Skeleton className="h-9 w-full max-w-md rounded-lg" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatUptime(createdAtIso: string): string {
  const created = new Date(createdAtIso).getTime()
  const diffMs = Date.now() - created
  if (!Number.isFinite(diffMs) || diffMs < 0) return '—'
  const days = Math.floor(diffMs / 86_400_000)
  const hours = Math.floor((diffMs % 86_400_000) / 3_600_000)
  const mins = Math.floor((diffMs % 3_600_000) / 60_000)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

function truncateJson(obj: unknown, max = 120): string {
  const s = JSON.stringify(obj)
  if (s.length <= max) return s
  return s.slice(0, max) + '…'
}

function formatJsonShort(v: unknown): string {
  if (v === undefined) return '∅'
  if (typeof v === 'string') return `"${v.length > 24 ? v.slice(0, 24) + '…' : v}"`
  if (typeof v === 'object' && v !== null) return JSON.stringify(v).slice(0, 40)
  return String(v)
}

function computeTwinDifferences(
  desired: Record<string, unknown>,
  reported: Record<string, unknown>,
): Array<{ key: string; desired: unknown; reported: unknown; kind: 'diff' | 'only-desired' | 'only-reported' }> {
  const out: Array<{ key: string; desired: unknown; reported: unknown; kind: 'diff' | 'only-desired' | 'only-reported' }> = []
  const keys = new Set<string>([...Object.keys(desired), ...Object.keys(reported)])
  for (const key of keys) {
    const d = desired[key]
    const r = reported[key]
    const inDesired = key in desired
    const inReported = key in reported
    if (inDesired && !inReported) {
      out.push({ key, desired: d, reported: undefined, kind: 'only-desired' })
    } else if (!inDesired && inReported) {
      out.push({ key, desired: undefined, reported: r, kind: 'only-reported' })
    } else if (JSON.stringify(d) !== JSON.stringify(r)) {
      out.push({ key, desired: d, reported: r, kind: 'diff' })
    }
  }
  return out.sort((a, b) => a.key.localeCompare(b.key))
}
