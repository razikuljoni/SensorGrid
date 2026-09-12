'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Cpu,
  Filter,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Thermometer,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAlerts, useDevices, qk } from '@/lib/hooks';
import { ALERT_SEVERITY_META, ALERT_STATUS_META, timeAgo, formatTime } from '@/lib/status';
import type {
  AlertCondition,
  AlertEventDTO,
  AlertRuleDTO,
  AlertSeverity,
  AlertStatus,
  DeviceDTO,
} from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// The /api/alerts endpoint extends each rule with a `device` reference (for display).
// The base AlertRuleDTO doesn't include it, so we extend locally.
type AlertRuleWithDevice = AlertRuleDTO & {
  device?: { id: string; name: string } | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Local AlertSeverityBadge / AlertStatusBadge
// (Built on top of ALERT_SEVERITY_META / ALERT_STATUS_META from status.tsx)
// ─────────────────────────────────────────────────────────────────────────────

export function AlertSeverityBadge({
  severity,
  size = 'md',
  className,
}: {
  severity: AlertSeverity;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const meta = ALERT_SEVERITY_META[severity];
  const Icon = meta.icon;
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
      <Icon className={cn(size === 'sm' ? 'size-2.5' : 'size-3')} />
      <span>{meta.label}</span>
    </span>
  );
}

export function AlertStatusBadge({
  status,
  size = 'md',
  className,
}: {
  status: AlertStatus;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const meta = ALERT_STATUS_META[status];
  const Icon = meta.icon;
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
      <Icon className={cn(size === 'sm' ? 'size-2.5' : 'size-3')} />
      <span>{meta.label}</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Condition helpers
// ─────────────────────────────────────────────────────────────────────────────

const CONDITION_SYMBOL: Record<AlertCondition, string> = {
  GT: '>',
  LT: '<',
  GTE: '≥',
  LTE: '≤',
  EQ: '=',
  NEQ: '≠',
  OFFLINE_FOR: 'offline for',
  BATTERY_BELOW: 'battery <',
};

const CONDITION_LABEL: Record<AlertCondition, string> = {
  GT: 'Greater Than',
  LT: 'Less Than',
  GTE: 'Greater or Equal',
  LTE: 'Less or Equal',
  EQ: 'Equal',
  NEQ: 'Not Equal',
  OFFLINE_FOR: 'Offline For (s)',
  BATTERY_BELOW: 'Battery Below',
};

function formatCondition(rule: {
  condition: AlertCondition;
  sensorKey: string | null;
  threshold: number | null;
}): string {
  const sym = CONDITION_SYMBOL[rule.condition] ?? '?';
  if (rule.condition === 'OFFLINE_FOR') {
    return `offline_for ${rule.threshold ?? 0}s`;
  }
  if (rule.condition === 'BATTERY_BELOW') {
    return `battery < ${rule.threshold ?? 0}`;
  }
  const key = rule.sensorKey ?? 'value';
  const t = rule.threshold ?? 0;
  return `${key} ${sym} ${t}`;
}

function formatCooldown(seconds: number): string {
  if (!seconds || seconds <= 0) return 'No cooldown';
  if (seconds < 60) return `${seconds}s cooldown`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m cooldown`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h cooldown`;
  return `${Math.floor(seconds / 86400)}d cooldown`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Alert Event Row
// ─────────────────────────────────────────────────────────────────────────────

interface AlertEventRowProps {
  event: AlertEventDTO;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
  busy: boolean;
}

function AlertEventRow({ event, onAcknowledge, onResolve, busy }: AlertEventRowProps) {
  const canAck = event.status === 'TRIGGERED';
  const canResolve = event.status === 'TRIGGERED' || event.status === 'ACKNOWLEDGED';

  return (
    <Card className="p-4 gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span
            className={cn(
              'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl',
              ALERT_SEVERITY_META[event.severity].bg,
              ALERT_SEVERITY_META[event.severity].color
            )}
          >
            {event.severity === 'CRITICAL' ? (
              <ShieldAlert className="size-4" />
            ) : event.severity === 'WARNING' ? (
              <AlertTriangle className="size-4" />
            ) : (
              <Activity className="size-4" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold truncate">{event.ruleName}</h3>
              <AlertSeverityBadge severity={event.severity} size="sm" />
              <AlertStatusBadge status={event.status} size="sm" />
            </div>
            <p className="mt-1 text-xs text-text-secondary">{event.message}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-muted">
              <span className="inline-flex items-center gap-1">
                <Cpu className="size-3" />
                {event.device?.name ?? 'No device'}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" />
                {timeAgo(event.triggeredAt)}
              </span>
              {event.acknowledgedBy && (
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="size-3" />
                  ack by {event.acknowledgedBy}
                </span>
              )}
              <span title={formatTime(event.triggeredAt)} className="text-text-muted/70">
                {formatTime(event.triggeredAt, false)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {canAck && (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => onAcknowledge(event.id)}
            >
              <CheckCircle2 className="size-3.5" /> Acknowledge
            </Button>
          )}
          {canResolve && (
            <Button size="sm" disabled={busy} onClick={() => onResolve(event.id)}>
              <ShieldCheck className="size-3.5" /> Resolve
            </Button>
          )}
          {event.status === 'RESOLVED' && (
            <Badge variant="outline" className="text-success border-success/30 bg-success/10">
              <CheckCircle2 className="size-3" /> Resolved
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

function AlertEventSkeleton() {
  return (
    <Card className="p-4 gap-3">
      <div className="flex items-start gap-3">
        <Skeleton className="size-9 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Alert Rule Card
// ─────────────────────────────────────────────────────────────────────────────

interface AlertRuleCardProps {
  rule: AlertRuleWithDevice;
}

function AlertRuleCard({ rule }: AlertRuleCardProps) {
  const condition = formatCondition(rule);
  return (
    <Card className="p-4 gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <span
            className={cn(
              'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
              ALERT_SEVERITY_META[rule.severity].bg,
              ALERT_SEVERITY_META[rule.severity].color
            )}
          >
            <Bell className="size-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold truncate">{rule.name}</h3>
            <p className="text-[11px] text-text-muted truncate">
              {rule.description ?? 'No description provided.'}
            </p>
          </div>
        </div>
        <Switch checked={rule.enabled} disabled aria-label={`Rule ${rule.name} enabled`} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <AlertSeverityBadge severity={rule.severity} size="sm" />
        <Badge variant="outline" className="text-[10px]">
          {rule.enabled ? 'Active' : 'Disabled'}
        </Badge>
        <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
          <Clock className="size-3" /> {formatCooldown(rule.cooldownSeconds)}
        </span>
      </div>

      <div className="rounded-md border border-border bg-muted/40 p-3">
        <p className="text-[10px] uppercase tracking-wide text-text-muted mb-1">Condition</p>
        <div className="flex items-center gap-2">
          <Filter className="size-3.5 text-text-muted" />
          <code className="font-mono text-xs break-all">{condition}</code>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border/60 -mx-4 px-4">
        <div>
          <p className="text-text-muted uppercase tracking-wide text-[10px]">Device</p>
          <p className="font-medium truncate flex items-center gap-1">
            <Cpu className="size-3 text-text-muted" />
            {rule.device?.name ?? 'Any'}
          </p>
        </div>
        <div>
          <p className="text-text-muted uppercase tracking-wide text-[10px]">Sensor</p>
          <p className="font-mono truncate flex items-center gap-1">
            <Thermometer className="size-3 text-text-muted" />
            {rule.sensorKey ?? 'any'}
          </p>
        </div>
      </div>
    </Card>
  );
}

function AlertRuleSkeleton() {
  return (
    <Card className="p-4 gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <Skeleton className="size-8 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
        <Skeleton className="h-5 w-9 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-12 w-full" />
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// New Alert Rule Dialog
// ─────────────────────────────────────────────────────────────────────────────

interface NewAlertRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function NewAlertRuleDialog({ open, onOpenChange }: NewAlertRuleDialogProps) {
  const qc = useQueryClient();
  const { data: devices } = useDevices();

  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [deviceId, setDeviceId] = React.useState<string>('');
  const [selectedDevice, setSelectedDevice] = React.useState<DeviceDTO | null>(null);
  const [sensorKey, setSensorKey] = React.useState<string>('');
  const [condition, setCondition] = React.useState<AlertCondition>('GT');
  const [threshold, setThreshold] = React.useState<string>('30');
  const [severity, setSeverity] = React.useState<AlertSeverity>('WARNING');
  const [saving, setSaving] = React.useState(false);

  // Reset sensor when device changes
  React.useEffect(() => {
    setSensorKey('');
  }, [deviceId]);

  const devicesList = devices ?? [];
  const currentDevice = devicesList.find((d) => d.id === deviceId) ?? null;
  React.useEffect(() => {
    setSelectedDevice(currentDevice ?? null);
  }, [currentDevice]);

  const reset = () => {
    setName('');
    setDescription('');
    setDeviceId('');
    setSensorKey('');
    setCondition('GT');
    setThreshold('30');
    setSeverity('WARNING');
  };

  const submit = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        description: description.trim() || null,
        deviceId: deviceId || null,
        sensorKey: sensorKey || null,
        condition,
        threshold: threshold === '' ? null : Number(threshold),
        severity,
        enabled: true,
        cooldownSeconds: 300,
      };
      const r = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error('Failed to create alert rule');
      toast.success('Alert rule created', { description: name.trim() });
      qc.invalidateQueries({ queryKey: ['alerts'] });
      onOpenChange(false);
      reset();
    } catch (err) {
      toast.error('Could not create alert rule', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setSaving(false);
    }
  };

  const sensorOptions = selectedDevice?.sensors ?? [];

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!saving) {
          onOpenChange(o);
          if (!o) reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Alert Rule</DialogTitle>
          <DialogDescription>
            Define a condition that triggers an alert event when breached.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rule-name">Name</Label>
            <Input
              id="rule-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Server room overheat"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rule-desc">Description</Label>
            <Input
              id="rule-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this rule watches for"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Device</Label>
              <Select value={deviceId} onValueChange={setDeviceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Any device" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any device</SelectItem>
                  {devicesList.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Sensor Key</Label>
              <Select
                value={sensorKey}
                onValueChange={setSensorKey}
                disabled={!selectedDevice || sensorOptions.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      selectedDevice
                        ? sensorOptions.length
                          ? 'Pick sensor'
                          : 'No sensors'
                        : 'Pick device first'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any sensor</SelectItem>
                  {sensorOptions.map((s) => (
                    <SelectItem key={s.id} value={s.key}>
                      {s.key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Condition</Label>
              <Select value={condition} onValueChange={(v) => setCondition(v as AlertCondition)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CONDITION_LABEL) as AlertCondition[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {CONDITION_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rule-threshold">Threshold</Label>
              <Input
                id="rule-threshold"
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="font-mono"
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Severity</Label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as AlertSeverity)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INFO">Info</SelectItem>
                <SelectItem value="WARNING">Warning</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {sensorKey && threshold && (
            <div className="rounded-md border border-border bg-muted/40 p-3">
              <p className="text-[10px] uppercase tracking-wide text-text-muted mb-1">Preview</p>
              <code className="font-mono text-xs">
                {sensorKey} {CONDITION_SYMBOL[condition]} {threshold}
              </code>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || !name.trim()}>
            {saving ? 'Creating...' : 'Create Rule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main view
// ─────────────────────────────────────────────────────────────────────────────

export function AlertsView() {
  const qc = useQueryClient();
  const [newOpen, setNewOpen] = React.useState(false);
  const [eventFilter, setEventFilter] = React.useState<'all' | AlertStatus>('all');
  const [busyId, setBusyId] = React.useState<string | null>(null);

  // Always fetch all events (status omitted) so we can filter client-side
  const { data, isLoading, isError, refetch } = useAlerts(undefined);
  const events: AlertEventDTO[] = React.useMemo(() => data?.events ?? [], [data]);
  const rules: AlertRuleWithDevice[] = React.useMemo(() => data?.rules ?? [], [data]);

  const filteredEvents = React.useMemo(() => {
    if (eventFilter === 'all') return events;
    return events.filter((e) => e.status === eventFilter);
  }, [events, eventFilter]);

  const triggeredCount = React.useMemo(
    () => events.filter((e) => e.status === 'TRIGGERED').length,
    [events]
  );
  const acknowledgedCount = React.useMemo(
    () => events.filter((e) => e.status === 'ACKNOWLEDGED').length,
    [events]
  );
  const resolvedCount = React.useMemo(
    () => events.filter((e) => e.status === 'RESOLVED').length,
    [events]
  );
  const activeRules = React.useMemo(() => rules.filter((r) => r.enabled).length, [rules]);

  const patchEvent = async (id: string, action: 'acknowledge' | 'resolve') => {
    setBusyId(id);
    try {
      const r = await fetch(`/api/alerts/${id}/${action}`, { method: 'PATCH' });
      if (!r.ok) throw new Error(`Failed to ${action} alert`);
      toast.success(`Alert ${action === 'acknowledge' ? 'acknowledged' : 'resolved'}`);
      qc.invalidateQueries({ queryKey: ['alerts'] });
    } catch (err) {
      toast.error(`Could not ${action} alert`, {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-danger/10 text-danger">
            <ShieldAlert className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Alerts</h1>
            <p className="text-xs text-text-muted">
              Monitor active alert events and configure alerting rules.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="size-3.5" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setNewOpen(true)}>
            <Plus className="size-3.5" /> New Alert Rule
          </Button>
        </div>
      </header>

      <NewAlertRuleDialog open={newOpen} onOpenChange={setNewOpen} />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Triggered" value={triggeredCount} accent="danger" icon={AlertTriangle} />
        <KpiCard label="Acknowledged" value={acknowledgedCount} accent="warning" icon={Activity} />
        <KpiCard label="Resolved" value={resolvedCount} accent="success" icon={CheckCircle2} />
        <KpiCard label="Active Rules" value={activeRules} accent="info" icon={Sliders} />
      </div>

      {isError ? (
        <Card className="p-6 text-center">
          <p className="text-sm font-medium text-danger">Failed to load alerts.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Try again
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {/* ─── Active Alert Events ─── */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-text-muted" />
                <h2 className="text-sm font-semibold">Alert Events</h2>
                <span className="text-xs text-text-muted">
                  {events.length} total · {triggeredCount} active
                </span>
              </div>
            </div>

            {/* Event filter tabs */}
            <Tabs
              value={eventFilter}
              onValueChange={(v) => setEventFilter(v as typeof eventFilter)}
            >
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="all">All ({events.length})</TabsTrigger>
                <TabsTrigger value="TRIGGERED">Triggered ({triggeredCount})</TabsTrigger>
                <TabsTrigger value="ACKNOWLEDGED">Acknowledged ({acknowledgedCount})</TabsTrigger>
                <TabsTrigger value="RESOLVED">Resolved ({resolvedCount})</TabsTrigger>
              </TabsList>
              <TabsContent value={eventFilter} className="mt-3">
                {isLoading ? (
                  <div className="flex flex-col gap-3">
                    <AlertEventSkeleton />
                    <AlertEventSkeleton />
                    <AlertEventSkeleton />
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <Card className="p-8 text-center">
                    <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-muted text-text-muted">
                      <CheckCircle2 className="size-5" />
                    </div>
                    <p className="text-sm font-medium">
                      {eventFilter === 'all'
                        ? 'No alert events yet'
                        : `No ${eventFilter.toLowerCase()} events`}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      {eventFilter === 'all'
                        ? 'Alert events will appear here when rules trigger.'
                        : 'Try a different filter or wait for new activity.'}
                    </p>
                  </Card>
                ) : (
                  <div className="flex flex-col gap-3 max-h-[640px] overflow-y-auto pr-1 aether-scroll">
                    {filteredEvents.map((event) => (
                      <AlertEventRow
                        key={event.id}
                        event={event}
                        onAcknowledge={(id) => patchEvent(id, 'acknowledge')}
                        onResolve={(id) => patchEvent(id, 'resolve')}
                        busy={busyId === event.id}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </section>

          {/* ─── Alert Rules ─── */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sliders className="size-4 text-text-muted" />
                <h2 className="text-sm font-semibold">Alert Rules</h2>
                <span className="text-xs text-text-muted">
                  {rules.length} configured · {activeRules} active
                </span>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <AlertRuleSkeleton />
                <AlertRuleSkeleton />
                <AlertRuleSkeleton />
                <AlertRuleSkeleton />
              </div>
            ) : rules.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-muted text-text-muted">
                  <Sliders className="size-5" />
                </div>
                <p className="text-sm font-medium">No alert rules configured</p>
                <p className="mt-1 text-xs text-text-muted">
                  Create a rule to start receiving alerts when conditions breach.
                </p>
                <Button size="sm" className="mt-4" onClick={() => setNewOpen(true)}>
                  <Plus className="size-3.5" /> New Alert Rule
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {rules.map((rule) => (
                  <AlertRuleCard key={rule.id} rule={rule} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  accent,
  icon: Icon,
}: {
  label: string;
  value: number;
  accent: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  icon: typeof Activity;
}) {
  const accentClass: Record<typeof accent, string> = {
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    danger: 'text-danger bg-danger/10',
    info: 'text-info bg-info/10',
  };
  return (
    <Card className="p-4 gap-2">
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn('flex size-8 items-center justify-center rounded-lg', accentClass[accent])}
        >
          <Icon className="size-4" />
        </span>
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
      </div>
      <p className="text-xs text-text-muted">{label}</p>
    </Card>
  );
}

export default AlertsView;
