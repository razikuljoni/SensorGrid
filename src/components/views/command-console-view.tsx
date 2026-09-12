'use client';

// ─────────────────────────────────────────────────────────────────────────────
// SensorGrid — Command Console View (Task 13-combined)
// Developer control plane: dispatch raw JSON payloads to a device and watch
// acknowledgements arrive in real time. Driven by useDevices() +
// useDeviceCommands() + useRealtimeNotifications() + sonner toasts.
// ─────────────────────────────────────────────────────────────────────────────

import * as React from 'react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Send,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { COMMAND_STATUS_META, formatTime, timeAgo } from '@/lib/status';
import { qk, useDeviceCommands, useDevices, useRealtimeNotifications } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import type { CommandDTO, CommandStatus } from '@/lib/types';

// ─── Presets + Templates ────────────────────────────────────────────────────

interface Preset {
  label: string;
  payload: Record<string, unknown>;
}

const PRESETS: Preset[] = [
  { label: 'Fan: On', payload: { fan: true } },
  { label: 'Fan: Off', payload: { fan: false } },
  { label: 'LED + 80% brightness', payload: { led: false, brightness: 80 } },
  { label: 'Vent: Open', payload: { vent: true } },
  { label: 'Reboot device', payload: { reboot: true } },
  { label: 'Report state', payload: { reportState: true } },
];

interface Template {
  name: string;
  description: string;
  payload: Record<string, unknown>;
}

const TEMPLATES: Template[] = [
  {
    name: 'Climate Control',
    description: 'Engage ventilation and target a comfortable ambient temperature.',
    payload: { fan: true, targetTemp: 22, mode: 'auto' },
  },
  {
    name: 'Lighting Scene',
    description: 'Dim the main LED and switch off auxiliary lights for an evening scene.',
    payload: { led: true, brightness: 35, auxLights: false },
  },
  {
    name: 'Diagnostics',
    description: 'Request a firmware health report from the ESP32 device.',
    payload: { diagnostics: true, include: ['heap', 'uptime', 'wifi_rssi'] },
  },
];

// ─── Command status badge ────────────────────────────────────────────────────

function CommandStatusBadge({ status }: { status: CommandStatus }) {
  const meta = COMMAND_STATUS_META[status] ?? COMMAND_STATUS_META.PENDING;
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap',
        meta.color,
        meta.bg,
        meta.border
      )}
    >
      <Icon className="size-3" />
      {meta.label}
    </span>
  );
}

// ─── JSON validation hook ─────────────────────────────────────────────────────

function useJsonValidation(text: string): {
  parsed: Record<string, unknown> | null;
  error: string | null;
} {
  return React.useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return { parsed: null, error: 'Payload cannot be empty.' };
    try {
      const value = JSON.parse(trimmed);
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return { parsed: null, error: 'Payload must be a JSON object (e.g. { "fan": true }).' };
      }
      return { parsed: value as Record<string, unknown>, error: null };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Invalid JSON';
      return { parsed: null, error: msg };
    }
  }, [text]);
}

// ─── View ────────────────────────────────────────────────────────────────────

export default function CommandConsoleView() {
  // Realtime subscription auto-invalidates command history on each transition.
  useRealtimeNotifications();
  const qc = useQueryClient();

  const devices = useDevices();
  const [deviceId, setDeviceId] = React.useState<string | null>(null);
  const [payloadText, setPayloadText] = React.useState<string>('{}');
  const [sending, setSending] = React.useState<boolean>(false);

  // Auto-pick first device once the list loads.
  React.useEffect(() => {
    if (!deviceId && devices.data && devices.data.length > 0) {
      setDeviceId(devices.data[0].id);
    }
  }, [deviceId, devices.data]);

  const commands = useDeviceCommands(deviceId);
  const { parsed, error } = useJsonValidation(payloadText);

  const selectedDevice = devices.data?.find((d) => d.id === deviceId);
  const deviceOffline = selectedDevice?.status === 'OFFLINE';

  // ─── Send command ────────────────────────────────────────────────────────
  const sendPayload = React.useCallback(
    async (payload: Record<string, unknown>) => {
      if (!deviceId) {
        toast.error('Select a device first.');
        return;
      }
      setSending(true);
      try {
        const r = await fetch(`/api/devices/${deviceId}/commands`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload }),
        });
        const j = await r.json();
        if (!r.ok) {
          throw new Error(j?.error ?? `Request failed (${r.status})`);
        }
        toast.success('Command dispatched', {
          description: `Payload delivered to ${selectedDevice?.name ?? 'device'}.`,
        });
        // Nudge the history query immediately — realtime invalidation will catch status updates.
        qc.invalidateQueries({ queryKey: qk.deviceCommands(deviceId) });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        toast.error('Failed to send command', { description: msg });
      } finally {
        setSending(false);
      }
    },
    [deviceId, selectedDevice, qc]
  );

  function applyPreset(p: Record<string, unknown>) {
    setPayloadText(JSON.stringify(p, null, 2));
  }

  // ─── Entrance animations ──────────────────────────────────────────────────
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  return (
    <div className="flex min-h-screen flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      {/* ─── Header ─── */}
      <motion.header
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-1"
      >
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="font-mono uppercase tracking-wider">Operations</span>
          <ChevronRight className="size-3" />
          <span className="text-text-secondary">Command Console</span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Command Console</h1>
        <p className="text-sm text-text-muted">
          Developer control plane — dispatch raw JSON payloads and watch acknowledgements arrive in
          real time.
        </p>
      </motion.header>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* ─── Left column: composer + presets + templates ─── */}
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          {/* Composer */}
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Terminal className="size-4 text-primary" />
                  Compose Command
                </CardTitle>
                <CardDescription className="text-xs">
                  Pick a device, edit the JSON payload, then dispatch.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Device */}
                <div className="space-y-1.5">
                  <Label htmlFor="device-select" className="text-xs font-medium text-text-muted">
                    Target device
                  </Label>
                  <Select value={deviceId ?? ''} onValueChange={setDeviceId}>
                    <SelectTrigger id="device-select" className="w-full">
                      <SelectValue
                        placeholder={devices.isLoading ? 'Loading devices…' : 'Select a device'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.data?.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          <span className="truncate">{d.name}</span>
                          <span className="ml-1 text-text-muted text-xs">· {d.status}</span>
                        </SelectItem>
                      ))}
                      {devices.data && devices.data.length === 0 && (
                        <div className="px-2 py-1.5 text-xs text-text-muted">
                          No devices registered.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {deviceOffline && (
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-warning">
                      <AlertCircle className="size-3" />
                      Device is currently offline — commands may time out.
                    </p>
                  )}
                </div>

                {/* Payload editor */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="payload-editor" className="text-xs font-medium text-text-muted">
                      JSON payload
                    </Label>
                    <button
                      type="button"
                      onClick={() => setPayloadText('{}')}
                      className="text-[11px] text-text-muted hover:text-text-secondary"
                    >
                      Reset
                    </button>
                  </div>
                  <Textarea
                    id="payload-editor"
                    value={payloadText}
                    onChange={(e) => setPayloadText(e.target.value)}
                    spellCheck={false}
                    className={cn(
                      'min-h-[160px] resize-y font-mono text-xs',
                      error && 'border-danger focus-visible:ring-danger/20'
                    )}
                    placeholder='{ "fan": true, "brightness": 80 }'
                    aria-invalid={!!error}
                  />
                  {error ? (
                    <p className="flex items-start gap-1.5 text-[11px] text-danger">
                      <AlertCircle className="mt-0.5 size-3 shrink-0" />
                      <span className="font-mono break-all">{error}</span>
                    </p>
                  ) : (
                    <p className="flex items-center gap-1.5 text-[11px] text-success">
                      <CheckCircle2 className="size-3" />
                      Valid JSON object
                    </p>
                  )}
                </div>

                <Button
                  className="w-full"
                  disabled={!parsed || sending || !deviceId}
                  onClick={() => parsed && sendPayload(parsed)}
                >
                  {sending ? (
                    <>
                      <Clock className="size-4 animate-pulse" />
                      Dispatching…
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      Send Command
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Presets */}
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="size-4 text-primary" />
                  Payload Presets
                </CardTitle>
                <CardDescription className="text-xs">
                  Click to load into the editor.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => applyPreset(p.payload)}
                      className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-2.5 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
                    >
                      <span className="truncate text-xs font-medium">{p.label}</span>
                      <code className="truncate font-mono text-[10px] text-text-muted">
                        {JSON.stringify(p.payload)}
                      </code>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Templates */}
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Code2 className="size-4 text-primary" />
                  Example Templates
                </CardTitle>
                <CardDescription className="text-xs">
                  Common ESP32 device workflows.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {TEMPLATES.map((t) => (
                  <div key={t.name} className="rounded-lg border border-border bg-surface p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium">{t.name}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => applyPreset(t.payload)}
                      >
                        Load
                      </Button>
                    </div>
                    <p className="mt-1 text-[11px] text-text-muted">{t.description}</p>
                    <pre className="mt-2 overflow-x-auto rounded-md bg-muted/60 p-2 font-mono text-[10px] text-text-secondary">
                      {JSON.stringify(t.payload, null, 2)}
                    </pre>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* ─── Right column: history ─── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Card className="flex h-full flex-col lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="size-4 text-primary" />
                    Command History
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs">
                    {selectedDevice ? (
                      <>
                        <span className="truncate">{selectedDevice.name}</span> ·{' '}
                        {commands.data?.length ?? 0} recent
                      </>
                    ) : (
                      'Select a device to view its history'
                    )}
                  </CardDescription>
                </div>
                {commands.isFetching && !commands.isLoading && (
                  <Badge variant="secondary" className="gap-1 text-[10px]">
                    <span className="size-1.5 animate-pulse rounded-full bg-success" />
                    syncing
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 sm:px-6 sm:pb-6">
              <div className="max-h-[calc(100vh-13rem)] overflow-y-auto px-4 pb-4 sm:px-0">
                {commands.isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full rounded-lg" />
                    ))}
                  </div>
                ) : !commands.data || commands.data.length === 0 ? (
                  <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
                    <Terminal className="size-6 text-text-muted/50" />
                    <p className="text-xs text-text-muted max-w-[260px]">
                      No commands dispatched to this device yet. Compose one to the left.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {commands.data.map((cmd) => (
                      <CommandHistoryItem
                        key={cmd.id}
                        command={cmd}
                        disabled={sending}
                        onResend={() => sendPayload(cmd.payload)}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Command history item ──────────────────────────────────────────────────────

function CommandHistoryItem({
  command,
  disabled,
  onResend,
}: {
  command: CommandDTO;
  disabled: boolean;
  onResend: () => void;
}) {
  const payloadJson = React.useMemo(() => {
    try {
      return JSON.stringify(command.payload, null, 2);
    } catch {
      return '{}';
    }
  }, [command.payload]);

  const resultJson = React.useMemo(() => {
    if (!command.result) return null;
    try {
      return JSON.stringify(command.result, null, 2);
    } catch {
      return null;
    }
  }, [command.result]);

  const isTerminal =
    command.status === 'COMPLETED' || command.status === 'FAILED' || command.status === 'TIMEOUT';

  return (
    <li className="rounded-lg border border-border bg-surface p-3">
      {/* Header: status + timestamp */}
      <div className="flex items-start justify-between gap-2">
        <CommandStatusBadge status={command.status} />
        <time
          className="font-mono text-[10px] text-text-muted"
          title={formatTime(command.createdAt)}
        >
          {timeAgo(command.createdAt)}
        </time>
      </div>

      {/* Sender + topic */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-muted">
        <span>
          by <span className="font-medium text-text-secondary">{command.senderName}</span>
        </span>
        <span className="font-mono truncate" title={command.topic}>
          {command.topic}
        </span>
      </div>

      {/* Payload */}
      <pre className="mt-2 line-clamp-3 overflow-hidden rounded-md bg-muted/60 p-2 font-mono text-[11px] text-text-secondary whitespace-pre-wrap break-all">
        {payloadJson}
      </pre>

      {/* Error */}
      {command.error && (
        <p className="mt-2 flex items-start gap-1.5 text-[11px] text-danger">
          <AlertCircle className="mt-0.5 size-3 shrink-0" />
          <span className="break-all">{command.error}</span>
        </p>
      )}

      {/* Result (collapsible) */}
      {resultJson && (
        <details className="mt-2">
          <summary className="cursor-pointer text-[11px] text-text-muted hover:text-text-secondary">
            View device result
          </summary>
          <pre className="mt-1 overflow-x-auto rounded-md bg-muted/60 p-2 font-mono text-[10px] text-text-secondary">
            {resultJson}
          </pre>
        </details>
      )}

      {/* Footer: attempts + resend */}
      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-[10px] text-text-muted">
          {command.attempts > 0
            ? `${command.attempts} attempt${command.attempts > 1 ? 's' : ''}`
            : isTerminal
              ? 'completed'
              : 'queued'}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-[11px]"
          disabled={disabled}
          onClick={onResend}
        >
          <Send className="size-3" />
          Resend
        </Button>
      </div>
    </li>
  );
}
