'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { useDevices } from '@/lib/hooks'
import {
  batteryMeta,
  signalMeta,
  timeAgo,
  DEVICE_STATUS_META,
} from '@/lib/status'
import type { DeviceDTO, DeviceType } from '@/lib/types'
import { DeviceOrb } from '@/components/aether/device-orb'
import { DeviceStatusBadge } from '@/components/aether/status-badge'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  ChevronRight,
  Cpu,
  MapPin,
  Plug,
  Plus,
  Search,
  WifiOff,
} from 'lucide-react'

// ─── Status filter options ───────────────────────────────────────────────────
const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'OFFLINE', label: 'Offline' },
  { value: 'WARNING', label: 'Warning' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'SLEEPING', label: 'Sleeping' },
]

const DEVICE_TYPES: DeviceType[] = ['ESP32', 'RPI', 'ARDUINO', 'GATEWAY', 'GENERIC']

// ─── Devices view ────────────────────────────────────────────────────────────
export function DevicesView() {
  const openDevice = useAppStore((s) => s.openDevice)
  const { toast } = useToast()

  const [status, setStatus] = React.useState<string>('ALL')
  const [q, setQ] = React.useState<string>('')
  // Debounce search input — 250ms
  const [qInput, setQInput] = React.useState<string>('')
  React.useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 250)
    return () => clearTimeout(t)
  }, [qInput])

  const { data: devices, isLoading, isError, refetch } = useDevices(
    status === 'ALL' ? undefined : status,
    q || undefined,
  )

  const [addOpen, setAddOpen] = React.useState(false)
  const [addForm, setAddForm] = React.useState({ name: '', type: 'ESP32' as DeviceType, location: '' })

  const onSubmitAdd = () => {
    // MVP: no MQTT credentials are wired up — surface a toast and reset.
    // When /api/devices POST exists, call it here and invalidate qk.devices.
    toast({
      title: 'Device registration requires MQTT credentials',
      description: 'Configure a device credential in Settings → MQTT Broker first.',
    })
    setAddOpen(false)
    setAddForm({ name: '', type: 'ESP32', location: '' })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Devices</h1>
        <p className="text-sm text-text-muted">
          Monitor, command, and inspect every device in your fleet.
        </p>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
            <Input
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="Search by name or tag…"
              className="pl-8"
              aria-label="Search devices"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-44" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" /> Add Device
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register a new device</DialogTitle>
              <DialogDescription>
                Provide basic info to provision a device in the registry. Live
                ingestion requires MQTT credentials — see Settings.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="dev-name" className="text-xs font-medium text-text-secondary">
                  Name
                </label>
                <Input
                  id="dev-name"
                  placeholder="e.g. Living Room ESP32"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="dev-type" className="text-xs font-medium text-text-secondary">
                    Type
                  </label>
                  <Select
                    value={addForm.type}
                    onValueChange={(v) => setAddForm((f) => ({ ...f, type: v as DeviceType }))}
                  >
                    <SelectTrigger id="dev-type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEVICE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="dev-location" className="text-xs font-medium text-text-secondary">
                    Location
                  </label>
                  <Input
                    id="dev-location"
                    placeholder="e.g. Living Room"
                    value={addForm.location}
                    onChange={(e) => setAddForm((f) => ({ ...f, location: e.target.value }))}
                  />
                </div>
              </div>
              <p className="rounded-md border border-border bg-muted/40 p-3 text-xs text-text-muted">
                <span className="font-medium text-text-secondary">Note:</span> Device
                registration requires MQTT credentials — see Settings.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={onSubmitAdd}>Register</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Body */}
      <DevicesBody
        devices={devices}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        onOpen={openDevice}
      />
    </div>
  )
}

// ─── Body: loading / empty / grid ────────────────────────────────────────────
function DevicesBody({
  devices,
  isLoading,
  isError,
  onRetry,
  onOpen,
}: {
  devices: DeviceDTO[] | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onOpen: (id: string) => void
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <DeviceCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-danger/10 text-danger">
          <WifiOff className="size-5" />
        </div>
        <div>
          <p className="text-sm font-medium">Couldn&apos;t load devices</p>
          <p className="text-xs text-text-muted">There was a problem talking to the server.</p>
        </div>
        <Button size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </Card>
    )
  }

  if (!devices || devices.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-text-muted">
          <Cpu className="size-5" />
        </div>
        <div>
          <p className="text-sm font-medium">No devices found</p>
          <p className="text-xs text-text-muted">
            Try adjusting your filters, or register a new device.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {devices.map((d) => (
        <DeviceCard key={d.id} device={d} onOpen={() => onOpen(d.id)} />
      ))}
    </div>
  )
}

// ─── Device type icon (statically declared) ─────────────────────────────────
const DEVICE_TYPE_ICON: Record<DeviceType, typeof Cpu> = {
  ESP32: Cpu,
  RPI: Cpu,
  ARDUINO: Cpu,
  GATEWAY: Plug,
  GENERIC: Cpu,
}

function DeviceTypeIcon({ type, className }: { type: DeviceType; className?: string }) {
  const Icon = DEVICE_TYPE_ICON[type] ?? Cpu
  return <Icon className={className} />
}

// ─── Device card ─────────────────────────────────────────────────────────────
function DeviceCard({ device, onOpen }: { device: DeviceDTO; onOpen: () => void }) {
  const bat = batteryMeta(device.battery)
  const sig = signalMeta(device.signal)
  const BatIcon = bat.icon
  const SigIcon = sig.icon

  return (
    <Card
      className={cn(
        'group relative p-4 gap-0 overflow-hidden transition-all hover:shadow-md hover:border-border-subtle',
        'cursor-pointer',
      )}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
    >
      {/* Status accent strip */}
      <div
        className="absolute left-0 top-0 h-full w-1"
        style={{ backgroundColor: DEVICE_STATUS_META[device.status]?.dot ?? 'var(--border)' }}
        aria-hidden
      />

      <div className="flex items-start gap-4">
        <DeviceOrb
          status={device.status}
          battery={device.battery}
          signal={device.signal}
          size={48}
          active={device.status === 'ONLINE' || device.status === 'WARNING'}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{device.name}</p>
              <p className="flex items-center gap-1 text-xs text-text-muted">
                <MapPin className="size-3" />
                <span className="truncate">
                  {device.location?.name ?? 'Unassigned'}
                </span>
              </p>
            </div>
            <DeviceStatusBadge status={device.status} size="sm" />
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-medium">
              <DeviceTypeIcon type={device.type} className="size-3" />
              {device.type}
            </span>
            <span className={cn('inline-flex items-center gap-1', bat.color)}>
              <BatIcon className="size-3" />
              {bat.label}
            </span>
            <span className={cn('inline-flex items-center gap-1', sig.color)}>
              <SigIcon className="size-3" />
              {sig.label}
            </span>
          </div>

          <div className="mt-1 text-[11px] text-text-muted">
            Last seen {timeAgo(device.lastSeen)}
          </div>

          {device.tags?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {device.tags.slice(0, 4).map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className="bg-accent/40 text-accent-foreground text-[10px] px-1.5 py-0 h-4"
                >
                  {t}
                </Badge>
              ))}
              {device.tags.length > 4 && (
                <span className="text-[10px] text-text-muted">
                  +{device.tags.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer action */}
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="font-mono text-[10px] text-text-muted">{device.id}</span>
        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={(e) => {
          e.stopPropagation()
          onOpen()
        }}>
          View
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </Card>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function DeviceCardSkeleton() {
  return (
    <Card className="p-4 gap-0">
      <div className="flex items-start gap-4">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-2.5 w-1/2" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-14" />
          </div>
          <Skeleton className="h-2.5 w-24" />
          <div className="flex gap-1 pt-1">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <Skeleton className="h-2.5 w-28" />
        <Skeleton className="h-6 w-16" />
      </div>
    </Card>
  )
}
