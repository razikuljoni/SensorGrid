'use client';

import * as React from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
  type Connection,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Activity,
  AlarmClock,
  Bell,
  Clock,
  Cog,
  Filter,
  GitBranch,
  Layers,
  Pause,
  Pencil,
  Play,
  Plus,
  Save,
  Send,
  Settings2,
  Slash,
  Trash2,
  Workflow,
  Zap,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { useAutomations, qk } from '@/lib/hooks';
import { timeAgo, formatNumber } from '@/lib/status';
import type {
  AutomationDTO,
  AutomationNode,
  AutomationNode as RxNode,
  AutomationEdge,
  AutomationTriggerType,
} from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// ─────────────────────────────────────────────────────────────────────────────
// Node type catalog
// ─────────────────────────────────────────────────────────────────────────────

type NodeKind =
  | {
      type: 'trigger';
      kind: 'telemetry_received' | 'device_online' | 'device_offline' | 'schedule' | 'manual';
      label: string;
    }
  | { type: 'condition'; kind: 'gt' | 'lt' | 'gte' | 'lte' | 'eq'; label: string }
  | { type: 'logic'; kind: 'and' | 'or' | 'not'; label: string }
  | { type: 'delay'; kind: 'delay_seconds'; label: string }
  | { type: 'action'; kind: 'send_command' | 'set_twin'; label: string }
  | { type: 'notification'; kind: 'notify'; label: string };

interface NodePaletteEntry {
  type: AutomationNode['type'];
  kind: string;
  label: string;
  description: string;
  icon: typeof Activity;
  accent: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
  defaultConfig: Record<string, unknown>;
}

const NODE_PALETTE: NodePaletteEntry[] = [
  // Triggers
  {
    type: 'trigger',
    kind: 'telemetry_received',
    label: 'Telemetry Received',
    description: 'Fires when a device emits telemetry',
    icon: Activity,
    accent: 'info',
    defaultConfig: { deviceId: '', sensorKey: '' },
  },
  {
    type: 'trigger',
    kind: 'device_online',
    label: 'Device Online',
    description: 'Fires when a device comes online',
    icon: Zap,
    accent: 'success',
    defaultConfig: { deviceId: '' },
  },
  {
    type: 'trigger',
    kind: 'device_offline',
    label: 'Device Offline',
    description: 'Fires when a device goes offline',
    icon: Pause,
    accent: 'warning',
    defaultConfig: { deviceId: '' },
  },
  {
    type: 'trigger',
    kind: 'schedule',
    label: 'Schedule',
    description: 'Fires on a cron schedule',
    icon: Clock,
    accent: 'info',
    defaultConfig: { cron: '0 * * * *' },
  },
  {
    type: 'trigger',
    kind: 'manual',
    label: 'Manual',
    description: 'Fires only when triggered manually',
    icon: Settings2,
    accent: 'primary',
    defaultConfig: {},
  },
  // Conditions
  {
    type: 'condition',
    kind: 'gt',
    label: 'Greater Than',
    description: 'value > threshold',
    icon: Filter,
    accent: 'warning',
    defaultConfig: { sensorKey: 'temperature', threshold: 30 },
  },
  {
    type: 'condition',
    kind: 'lt',
    label: 'Less Than',
    description: 'value < threshold',
    icon: Filter,
    accent: 'warning',
    defaultConfig: { sensorKey: 'humidity', threshold: 20 },
  },
  {
    type: 'condition',
    kind: 'gte',
    label: 'Greater or Equal',
    description: 'value ≥ threshold',
    icon: Filter,
    accent: 'warning',
    defaultConfig: { sensorKey: 'temperature', threshold: 30 },
  },
  {
    type: 'condition',
    kind: 'lte',
    label: 'Less or Equal',
    description: 'value ≤ threshold',
    icon: Filter,
    accent: 'warning',
    defaultConfig: { sensorKey: 'temperature', threshold: 30 },
  },
  {
    type: 'condition',
    kind: 'eq',
    label: 'Equal',
    description: 'value = threshold',
    icon: Filter,
    accent: 'warning',
    defaultConfig: { sensorKey: 'motion', threshold: 1 },
  },
  // Logic
  {
    type: 'logic',
    kind: 'and',
    label: 'AND',
    description: 'All inputs must be true',
    icon: GitBranch,
    accent: 'primary',
    defaultConfig: {},
  },
  {
    type: 'logic',
    kind: 'or',
    label: 'OR',
    description: 'Any input must be true',
    icon: GitBranch,
    accent: 'primary',
    defaultConfig: {},
  },
  {
    type: 'logic',
    kind: 'not',
    label: 'NOT',
    description: 'Inverts an input',
    icon: Slash,
    accent: 'primary',
    defaultConfig: {},
  },
  // Delay
  {
    type: 'delay',
    kind: 'delay_seconds',
    label: 'Delay',
    description: 'Waits N seconds before continuing',
    icon: Clock,
    accent: 'accent',
    defaultConfig: { seconds: 60 },
  },
  // Actions
  {
    type: 'action',
    kind: 'send_command',
    label: 'Send Command',
    description: 'Send a command payload to a device',
    icon: Send,
    accent: 'success',
    defaultConfig: { deviceId: '', payload: { action: 'reboot' } },
  },
  {
    type: 'action',
    kind: 'set_twin',
    label: 'Set Twin State',
    description: 'Update a device twin desired state',
    icon: Cog,
    accent: 'success',
    defaultConfig: { deviceId: '', state: { power: 'on' } },
  },
  // Notifications
  {
    type: 'notification',
    kind: 'notify',
    label: 'Notify',
    description: 'Push a notification to subscribers',
    icon: Bell,
    accent: 'danger',
    defaultConfig: { category: 'ALERT', title: 'Alert', message: 'Automated notification' },
  },
];

const NODE_ACCENT_CLASS: Record<
  NodePaletteEntry['accent'],
  { dot: string; ring: string; chip: string; text: string }
> = {
  primary: {
    dot: 'bg-primary',
    ring: 'border-primary/40',
    chip: 'bg-primary/10 text-primary',
    text: 'text-primary',
  },
  accent: {
    dot: 'bg-accent-foreground',
    ring: 'border-accent/40',
    chip: 'bg-accent/40 text-accent-foreground',
    text: 'text-accent-foreground',
  },
  success: {
    dot: 'bg-success',
    ring: 'border-success/40',
    chip: 'bg-success/10 text-success',
    text: 'text-success',
  },
  warning: {
    dot: 'bg-warning',
    ring: 'border-warning/40',
    chip: 'bg-warning/10 text-warning',
    text: 'text-warning',
  },
  danger: {
    dot: 'bg-danger',
    ring: 'border-danger/40',
    chip: 'bg-danger/10 text-danger',
    text: 'text-danger',
  },
  info: { dot: 'bg-info', ring: 'border-info/40', chip: 'bg-info/10 text-info', text: 'text-info' },
};

const LEGEND: { label: string; accent: NodePaletteEntry['accent'] }[] = [
  { label: 'Trigger', accent: 'info' },
  { label: 'Condition', accent: 'warning' },
  { label: 'Logic', accent: 'primary' },
  { label: 'Delay', accent: 'accent' },
  { label: 'Action', accent: 'success' },
  { label: 'Notification', accent: 'danger' },
];

function paletteEntryFor(type: string, kind: string): NodePaletteEntry {
  return (
    NODE_PALETTE.find((p) => p.type === type && p.kind === kind) ??
    NODE_PALETTE.find((p) => p.type === type) ??
    NODE_PALETTE[0]
  );
}

function summarizeConfig(node: AutomationNode): string {
  const c = node.data.config ?? {};
  const t = node.type;
  switch (t) {
    case 'trigger': {
      if (node.data.kind === 'schedule') return `cron ${String(c.cron ?? '—')}`;
      if (node.data.kind === 'manual') return 'manual trigger';
      if (node.data.kind === 'telemetry_received')
        return `${c.sensorKey ?? 'any'} on ${c.deviceId ? String(c.deviceId).slice(0, 8) : 'any'}`;
      return c.deviceId ? `device ${String(c.deviceId).slice(0, 8)}` : 'any device';
    }
    case 'condition':
      return `${c.sensorKey ?? 'value'} ${node.data.kind} ${c.threshold ?? '—'}`;
    case 'logic':
      return node.data.kind.toUpperCase();
    case 'delay':
      return `${c.seconds ?? 0}s`;
    case 'action': {
      if (node.data.kind === 'send_command')
        return `→ ${c.deviceId ? String(c.deviceId).slice(0, 8) : 'device'}`;
      return `twin ${c.deviceId ? String(c.deviceId).slice(0, 8) : 'device'}`;
    }
    case 'notification':
      return c.title ? String(c.title) : c.category ? String(c.category) : 'notify';
    default:
      return '';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom React Flow node renderer
// ─────────────────────────────────────────────────────────────────────────────

type PulseNodeData = {
  label: string;
  kind: string;
  config: Record<string, unknown>;
  type: AutomationNode['type'];
  selected?: boolean;
};

function PulseNodeComponent({ id, data, selected }: NodeProps) {
  const d = data as PulseNodeData;
  const entry = paletteEntryFor(d.type, d.kind);
  const Icon = entry.icon;
  const accent = NODE_ACCENT_CLASS[entry.accent];
  const summary = summarizeConfig({
    id,
    type: d.type,
    position: { x: 0, y: 0 },
    data: { label: d.label, kind: d.kind, config: d.config },
  });

  return (
    <div
      className={cn(
        'group relative w-56 rounded-xl border bg-card text-card-foreground shadow-md transition-all',
        accent.ring,
        selected ? 'ring-2 ring-ring' : ''
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border-0 !bg-foreground/40"
      />
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60">
        <span className={cn('flex size-7 items-center justify-center rounded-lg', accent.chip)}>
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold leading-tight">{d.label}</p>
          <p className="text-[10px] uppercase tracking-wide text-text-muted">{entry.type}</p>
        </div>
        <span className={cn('size-2 rounded-full', accent.dot)} aria-hidden />
      </div>
      <div className="px-3 py-2">
        <p className="text-[11px] text-text-muted">Type</p>
        <p className="font-mono text-xs">{d.kind}</p>
        {summary && (
          <p className="mt-1.5 font-mono text-[11px] text-text-secondary break-words">{summary}</p>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !border-0 !bg-foreground/40"
      />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  trigger: PulseNodeComponent,
  condition: PulseNodeComponent,
  logic: PulseNodeComponent,
  delay: PulseNodeComponent,
  action: PulseNodeComponent,
  notification: PulseNodeComponent,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers for converting AutomationNode <-> React Flow Node
// ─────────────────────────────────────────────────────────────────────────────

function toFlowNode(n: AutomationNode): Node {
  return {
    id: n.id,
    type: n.type,
    position: n.position,
    data: { label: n.data.label, kind: n.data.kind, config: n.data.config ?? {}, type: n.type },
  };
}

function toFlowEdge(e: AutomationEdge): Edge {
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    animated: true,
  };
}

function toAutomationNode(n: Node): AutomationNode {
  const d = n.data as PulseNodeData;
  return {
    id: n.id,
    type: d.type,
    position: n.position,
    data: { label: d.label, kind: d.kind, config: d.config ?? {} },
  };
}

function toAutomationEdge(e: Edge): AutomationEdge {
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle ?? undefined,
    targetHandle: e.targetHandle ?? undefined,
  };
}

function makeNodeId(): string {
  return `n_${Math.random().toString(36).slice(2, 10)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inspector panel — edit selected node
// ─────────────────────────────────────────────────────────────────────────────

interface InspectorProps {
  node: Node | null;
  onChange: (id: string, data: Partial<PulseNodeData>) => void;
  onDelete: (id: string) => void;
}

function InspectorPanel({ node, onChange, onDelete }: InspectorProps) {
  if (!node) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-text-muted">
          <Settings2 className="size-5" />
        </div>
        <p className="text-sm font-medium text-text-secondary">No node selected</p>
        <p className="text-xs text-text-muted">
          Click a node on the canvas to edit its configuration.
        </p>
      </div>
    );
  }

  const d = node.data as PulseNodeData;
  const entry = paletteEntryFor(d.type, d.kind);
  const accent = NODE_ACCENT_CLASS[entry.accent];
  const Icon = entry.icon;
  const cfg = d.config ?? {};

  const setConfig = (key: string, value: unknown) => {
    onChange(node.id, { config: { ...cfg, [key]: value } });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <span className={cn('flex size-8 items-center justify-center rounded-lg', accent.chip)}>
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-text-muted">{entry.type}</p>
          <p className="text-sm font-semibold">{entry.label}</p>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="insp-label" className="text-xs text-text-muted">
              Label
            </Label>
            <Input
              id="insp-label"
              value={d.label}
              onChange={(e) => onChange(node.id, { label: e.target.value })}
              className="h-8 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-text-muted">Sub-type</Label>
            <div className="font-mono text-xs bg-muted px-2 py-1.5 rounded-md">{d.kind}</div>
          </div>

          <Separator />

          {/* Per-kind config */}
          {d.type === 'trigger' && d.kind === 'telemetry_received' && (
            <>
              <ConfigInput
                label="Device ID"
                value={cfg.deviceId}
                onChange={(v) => setConfig('deviceId', v)}
                placeholder="any"
              />
              <ConfigInput
                label="Sensor Key"
                value={cfg.sensorKey}
                onChange={(v) => setConfig('sensorKey', v)}
                placeholder="temperature"
              />
            </>
          )}
          {d.type === 'trigger' && (d.kind === 'device_online' || d.kind === 'device_offline') && (
            <ConfigInput
              label="Device ID"
              value={cfg.deviceId}
              onChange={(v) => setConfig('deviceId', v)}
              placeholder="any"
            />
          )}
          {d.type === 'trigger' && d.kind === 'schedule' && (
            <ConfigInput
              label="Cron Expression"
              value={cfg.cron}
              onChange={(v) => setConfig('cron', v)}
              placeholder="0 * * * *"
              mono
            />
          )}

          {d.type === 'condition' && (
            <>
              <ConfigInput
                label="Sensor Key"
                value={cfg.sensorKey}
                onChange={(v) => setConfig('sensorKey', v)}
                placeholder="temperature"
                mono
              />
              <ConfigNumber
                label="Threshold"
                value={cfg.threshold as number}
                onChange={(v) => setConfig('threshold', v)}
              />
            </>
          )}

          {d.type === 'delay' && (
            <ConfigNumber
              label="Seconds"
              value={cfg.seconds as number}
              onChange={(v) => setConfig('seconds', v)}
            />
          )}

          {d.type === 'action' && d.kind === 'send_command' && (
            <>
              <ConfigInput
                label="Device ID"
                value={cfg.deviceId}
                onChange={(v) => setConfig('deviceId', v)}
                mono
              />
              <ConfigTextarea
                label="Payload (JSON)"
                value={JSON.stringify(cfg.payload ?? {}, null, 2)}
                onChange={(v) => {
                  try {
                    setConfig('payload', JSON.parse(v));
                  } catch {
                    /* ignore parse errors while typing */
                  }
                }}
              />
            </>
          )}
          {d.type === 'action' && d.kind === 'set_twin' && (
            <>
              <ConfigInput
                label="Device ID"
                value={cfg.deviceId}
                onChange={(v) => setConfig('deviceId', v)}
                mono
              />
              <ConfigTextarea
                label="Desired State (JSON)"
                value={JSON.stringify(cfg.state ?? {}, null, 2)}
                onChange={(v) => {
                  try {
                    setConfig('state', JSON.parse(v));
                  } catch {
                    /* ignore */
                  }
                }}
              />
            </>
          )}

          {d.type === 'notification' && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-text-muted">Category</Label>
                <Select
                  value={String(cfg.category ?? 'ALERT')}
                  onValueChange={(v) => setConfig('category', v)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['DEVICE', 'ALERT', 'AUTOMATION', 'SYSTEM', 'SECURITY'].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ConfigInput
                label="Title"
                value={cfg.title}
                onChange={(v) => setConfig('title', v)}
              />
              <ConfigTextarea
                label="Message"
                value={cfg.message === null || cfg.message === undefined ? '' : String(cfg.message)}
                onChange={(v) => setConfig('message', v)}
              />
            </>
          )}

          {d.type === 'logic' && (
            <p className="text-xs text-text-muted">
              Logic nodes combine inputs from upstream nodes. No additional config required.
            </p>
          )}

          <Separator />
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(node.id)}
            className="w-full"
          >
            <Trash2 className="size-3.5" />
            Delete Node
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}

function ConfigInput({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string;
  value: unknown;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-text-muted">{label}</Label>
      <Input
        value={value === undefined || value === null ? '' : String(value)}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn('h-8 text-sm', mono && 'font-mono')}
      />
    </div>
  );
}

function ConfigNumber({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-text-muted">{label}</Label>
      <Input
        type="number"
        value={Number.isFinite(value as number) ? (value as number) : ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-8 text-sm font-mono"
      />
    </div>
  );
}

function ConfigTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-text-muted">{label}</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono text-xs min-h-24"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Palette sidebar
// ─────────────────────────────────────────────────────────────────────────────

function PaletteSidebar({ onAdd }: { onAdd: (entry: NodePaletteEntry) => void }) {
  const grouped = React.useMemo(() => {
    const map: Record<string, NodePaletteEntry[]> = {};
    for (const entry of NODE_PALETTE) {
      (map[entry.type] ??= []).push(entry);
    }
    return map;
  }, []);
  const order: AutomationNode['type'][] = [
    'trigger',
    'condition',
    'logic',
    'delay',
    'action',
    'notification',
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Layers className="size-4 text-text-muted" />
        <p className="text-xs uppercase tracking-wide text-text-muted">Node Palette</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3 p-3">
          {order.map((type) => (
            <div key={type} className="flex flex-col gap-1.5">
              <p className="text-[10px] uppercase tracking-wider text-text-muted px-1">{type}</p>
              {grouped[type]?.map((entry) => {
                const Icon = entry.icon;
                const accent = NODE_ACCENT_CLASS[entry.accent];
                return (
                  <button
                    key={`${entry.type}-${entry.kind}`}
                    onClick={() => onAdd(entry)}
                    className={cn(
                      'group flex items-start gap-2.5 rounded-lg border border-border bg-card p-2 text-left transition-all hover:border-ring/40 hover:bg-accent/40'
                    )}
                    title={entry.description}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md',
                        accent.chip
                      )}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium leading-tight">{entry.label}</p>
                      <p className="text-[10px] text-text-muted truncate">{entry.description}</p>
                    </div>
                    <Plus className="size-3.5 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="border-t border-border p-3">
        <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2 px-1">Legend</p>
        <div className="grid grid-cols-2 gap-1.5">
          {LEGEND.map((l) => {
            const accent = NODE_ACCENT_CLASS[l.accent];
            return (
              <div key={l.label} className="flex items-center gap-1.5 text-[11px]">
                <span className={cn('size-2 rounded-full', accent.dot)} />
                <span className="text-text-secondary">{l.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Rule Canvas (inner — uses hooks)
// ─────────────────────────────────────────────────────────────────────────────

interface RuleCanvasProps {
  automation: AutomationDTO;
  onSaved: () => void;
}

function RuleCanvasInner({ automation, onSaved }: RuleCanvasProps) {
  const qc = useQueryClient();
  const [nodes, setNodes, onNodesChange] = useNodesState(automation.nodes.map(toFlowNode));
  const [edges, setEdges, onEdgesChange] = useEdgesState(automation.edges.map(toFlowEdge));
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const rf = useReactFlow();

  // Re-sync when automation changes (e.g. switching selected automation)
  React.useEffect(() => {
    setNodes(automation.nodes.map(toFlowNode));
    setEdges(automation.edges.map(toFlowEdge));
    setSelectedNodeId(null);
    setDirty(false);
  }, [automation.id, automation.version, setNodes, setEdges]);

  const onConnect = React.useCallback(
    (c: Connection) => {
      setEdges((eds) => addEdge({ ...c, animated: true, id: `e_${makeNodeId()}` }, eds));
      setDirty(true);
    },
    [setEdges]
  );

  const addNode = (entry: NodePaletteEntry) => {
    const center = rf.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    // Fallback to a pseudo-random offset if screenToFlowPosition is unavailable
    const pos =
      center && Number.isFinite(center.x) && Number.isFinite(center.y)
        ? center
        : { x: 80 + Math.random() * 200, y: 80 + Math.random() * 160 };
    const id = makeNodeId();
    const newNode: Node = {
      id,
      type: entry.type,
      position: pos,
      data: {
        label: entry.label,
        kind: entry.kind,
        config: { ...entry.defaultConfig },
        type: entry.type,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(id);
    setDirty(true);
    toast.success(`Added "${entry.label}" node`);
  };

  const updateNodeData = React.useCallback(
    (id: string, patch: Partial<PulseNodeData>) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== id) return n;
          const merged = {
            ...n.data,
            ...patch,
            config: patch.config ?? {
              ...(n.data as PulseNodeData).config,
              ...(patch.config ?? {}),
            },
          };
          return { ...n, data: merged };
        })
      );
      setDirty(true);
    },
    [setNodes]
  );

  const deleteNode = React.useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
      setSelectedNodeId(null);
      setDirty(true);
    },
    [setNodes, setEdges]
  );

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        nodes: nodes.map(toAutomationNode),
        edges: edges.map(toAutomationEdge),
      };
      const r = await fetch(`/api/automations/${automation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error('Failed to save');
      toast.success('Automation saved', { description: `Version ${automation.version + 1}` });
      setDirty(false);
      qc.invalidateQueries({ queryKey: qk.automations });
      qc.invalidateQueries({ queryKey: qk.automation(automation.id) });
      onSaved();
    } catch (err) {
      toast.error('Could not save automation', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedNode = React.useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_280px] gap-0 h-full min-h-[600px] border-t border-border">
      {/* Palette */}
      <div className="hidden lg:block border-r border-border bg-background/40">
        <PaletteSidebar onAdd={addNode} />
      </div>

      {/* Canvas */}
      <div className="relative">
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
          <Badge variant="outline" className="bg-background/80 backdrop-blur">
            <Workflow className="size-3" />
            {automation.name}
          </Badge>
          {dirty && (
            <Badge className="bg-warning/10 text-warning border-warning/30 border">
              <span className="size-1.5 rounded-full bg-warning" /> Unsaved
            </Badge>
          )}
        </div>
        <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
          {/* Mobile palette trigger */}
          <div className="lg:hidden">
            <NodeQuickAddMobile onAdd={addNode} />
          </div>
          <Button size="sm" onClick={save} disabled={saving || !dirty}>
            <Save className="size-3.5" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onNodeClick={(_, n) => setSelectedNodeId(n.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          className="bg-muted/30"
        >
          <Background gap={16} size={1} className="opacity-40" />
          <Controls className="!bg-background !border-border !shadow-md" />
          <MiniMap
            className="!bg-background !border !border-border rounded-md"
            nodeColor={(n) => {
              const d = n.data as PulseNodeData;
              const entry = paletteEntryFor(d.type, d.kind);
              const accent = NODE_ACCENT_CLASS[entry.accent];
              return accent.dot.replace('bg-', '');
            }}
            pannable
            zoomable
          />
        </ReactFlow>
      </div>

      {/* Inspector */}
      <div className="hidden lg:block border-l border-border bg-background/40">
        <InspectorPanel node={selectedNode} onChange={updateNodeData} onDelete={deleteNode} />
      </div>

      {/* Mobile inspector */}
      {selectedNode && (
        <div className="lg:hidden border-t border-border bg-background max-h-[40vh]">
          <InspectorPanel node={selectedNode} onChange={updateNodeData} onDelete={deleteNode} />
        </div>
      )}
    </div>
  );
}

// Quick add for mobile — uses a popover-style select
function NodeQuickAddMobile({ onAdd }: { onAdd: (e: NodePaletteEntry) => void }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" /> Add
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Add a node</DialogTitle>
            <DialogDescription>Choose a node type to drop onto the canvas.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[55vh] -mx-2 px-2">
            <div className="flex flex-col gap-3">
              {(
                [
                  'trigger',
                  'condition',
                  'logic',
                  'delay',
                  'action',
                  'notification',
                ] as AutomationNode['type'][]
              ).map((type) => (
                <div key={type} className="flex flex-col gap-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted px-1">
                    {type}
                  </p>
                  {NODE_PALETTE.filter((p) => p.type === type).map((entry) => {
                    const Icon = entry.icon;
                    const accent = NODE_ACCENT_CLASS[entry.accent];
                    return (
                      <button
                        key={`${entry.type}-${entry.kind}`}
                        onClick={() => {
                          onAdd(entry);
                          setOpen(false);
                        }}
                        className="flex items-start gap-2.5 rounded-lg border border-border bg-card p-2 text-left hover:bg-accent/40"
                      >
                        <span
                          className={cn(
                            'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md',
                            accent.chip
                          )}
                        >
                          <Icon className="size-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium">{entry.label}</p>
                          <p className="text-[10px] text-text-muted truncate">
                            {entry.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RuleCanvas(props: RuleCanvasProps) {
  return (
    <ReactFlowProvider>
      <RuleCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Automation list card
// ─────────────────────────────────────────────────────────────────────────────

interface AutomationCardProps {
  automation: AutomationDTO;
  selected: boolean;
  onSelect: () => void;
  onToggle: (enabled: boolean) => void;
  onRun: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function AutomationCard({
  automation,
  selected,
  onSelect,
  onToggle,
  onRun,
  onEdit,
  onDelete,
}: AutomationCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'cursor-pointer p-4 gap-3 transition-all hover:border-ring/40',
        selected ? 'border-ring ring-1 ring-ring/40' : ''
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Workflow className="size-4 text-text-muted shrink-0" />
            <h3 className="text-sm font-semibold truncate">{automation.name}</h3>
          </div>
          <p className="mt-1 text-xs text-text-muted line-clamp-2">
            {automation.description || 'No description provided.'}
          </p>
        </div>
        <Switch
          checked={automation.enabled}
          onCheckedChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Toggle ${automation.name}`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
        <Badge variant="outline" className="font-mono text-[10px]">
          {automation.triggerType}
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          v{automation.version}
        </Badge>
        <span className="inline-flex items-center gap-1">
          <Activity className="size-3" />
          {formatNumber(automation.executionCount, 0)} runs
        </span>
        {automation.failureCount > 0 && (
          <span className="inline-flex items-center gap-1 text-danger">
            <AlarmClock className="size-3" />
            {automation.failureCount} failed
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3" />
          {timeAgo(automation.lastExecutedAt)}
        </span>
      </div>

      <div className="flex items-center gap-1.5 pt-1 border-t border-border/60 -mx-4 px-4 mt-1">
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="flex-1"
        >
          <Pencil className="size-3.5" /> Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onRun();
          }}
          disabled={!automation.enabled}
        >
          <Play className="size-3.5" /> Run
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-danger hover:text-danger"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </Card>
  );
}

function AutomationCardSkeleton() {
  return (
    <Card className="p-4 gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
        <Skeleton className="h-5 w-9 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-10" />
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-9" />
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// New Automation Dialog
// ─────────────────────────────────────────────────────────────────────────────

interface NewAutomationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: string) => void;
}

function NewAutomationDialog({ open, onOpenChange, onCreated }: NewAutomationDialogProps) {
  const qc = useQueryClient();
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [triggerType, setTriggerType] = React.useState<AutomationTriggerType>('MANUAL');
  const [saving, setSaving] = React.useState(false);

  const reset = () => {
    setName('');
    setDescription('');
    setTriggerType('MANUAL');
  };

  const submit = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const triggerNode: AutomationNode = {
        id: makeNodeId(),
        type: 'trigger',
        position: { x: 80, y: 120 },
        data: {
          label: 'Trigger',
          kind:
            triggerType === 'TELEMETRY'
              ? 'telemetry_received'
              : triggerType === 'DEVICE_ONLINE'
                ? 'device_online'
                : triggerType === 'DEVICE_OFFLINE'
                  ? 'device_offline'
                  : triggerType === 'SCHEDULE'
                    ? 'schedule'
                    : 'manual',
          config:
            triggerType === 'SCHEDULE'
              ? { cron: '0 * * * *' }
              : triggerType === 'TELEMETRY'
                ? { sensorKey: 'temperature' }
                : {},
        },
      };
      const r = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          triggerType,
          triggerConfig: triggerType === 'SCHEDULE' ? { cron: '0 * * * *' } : {},
          nodes: [triggerNode],
          edges: [],
          enabled: true,
        }),
      });
      if (!r.ok) throw new Error('Failed to create automation');
      const json = await r.json();
      toast.success('Automation created', { description: name.trim() });
      qc.invalidateQueries({ queryKey: qk.automations });
      onCreated(json?.automation?.id ?? json?.id);
      onOpenChange(false);
      reset();
    } catch (err) {
      toast.error('Could not create automation', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setSaving(false);
    }
  };

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Automation</DialogTitle>
          <DialogDescription>
            Create a new rule graph. You can build it out on the canvas after creation.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auto-name">Name</Label>
            <Input
              id="auto-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cool greenhouse when hot"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auto-desc">Description</Label>
            <Textarea
              id="auto-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this automation does"
              className="min-h-16"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Trigger Type</Label>
            <Select
              value={triggerType}
              onValueChange={(v) => setTriggerType(v as AutomationTriggerType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANUAL">Manual</SelectItem>
                <SelectItem value="TELEMETRY">Telemetry Received</SelectItem>
                <SelectItem value="DEVICE_ONLINE">Device Online</SelectItem>
                <SelectItem value="DEVICE_OFFLINE">Device Offline</SelectItem>
                <SelectItem value="SCHEDULE">Schedule</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || !name.trim()}>
            {saving ? 'Creating...' : 'Create Automation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main view
// ─────────────────────────────────────────────────────────────────────────────

export function AutomationsView() {
  const { data: automations, isLoading, isError, refetch } = useAutomations();
  const selectedId = useAppStore((s) => s.selectedAutomationId);
  const openAutomation = useAppStore((s) => s.openAutomation);

  const [newOpen, setNewOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<AutomationDTO | null>(null);
  const [mobileCanvasOpen, setMobileCanvasOpen] = React.useState(false);
  const qc = useQueryClient();

  const selected = React.useMemo(
    () => automations?.find((a) => a.id === selectedId) ?? automations?.[0] ?? null,
    [automations, selectedId]
  );

  // Auto-select first if nothing is selected
  React.useEffect(() => {
    if (!selectedId && automations && automations.length > 0) {
      openAutomation(automations[0].id);
    }
  }, [selectedId, automations, openAutomation]);

  const toggleEnabled = async (a: AutomationDTO, enabled: boolean) => {
    // Optimistic: invalidate after server confirms
    try {
      await fetch(`/api/automations/${a.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      toast.success(`${a.name} ${enabled ? 'enabled' : 'disabled'}`);
      qc.invalidateQueries({ queryKey: qk.automations });
    } catch {
      toast.error('Failed to toggle automation');
    }
  };

  const runAutomation = async (a: AutomationDTO) => {
    try {
      const r = await fetch(`/api/automations/${a.id}/execute`, { method: 'POST' });
      if (!r.ok) throw new Error('Failed to execute');
      toast.success('Automation executed', { description: a.name });
      qc.invalidateQueries({ queryKey: qk.automations });
      qc.invalidateQueries({ queryKey: qk.automation(a.id) });
    } catch {
      toast.error('Could not execute automation');
    }
  };

  const deleteAutomation = async () => {
    if (!deleteTarget) return;
    try {
      const r = await fetch(`/api/automations/${deleteTarget.id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Failed to delete');
      toast.success('Automation deleted', { description: deleteTarget.name });
      if (selected?.id === deleteTarget.id) openAutomation(null);
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: qk.automations });
    } catch {
      toast.error('Could not delete automation');
    }
  };

  return (
    <div className="flex min-h-screen flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Workflow className="size-5" />
            </span>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Automations</h1>
              <p className="text-xs text-text-muted">
                Design event-driven rule graphs that orchestrate your fleet.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <Activity className="size-3.5" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setNewOpen(true)}>
            <Plus className="size-3.5" /> New Automation
          </Button>
        </div>
      </header>

      <NewAutomationDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreated={(id) => openAutomation(id)}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete automation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{' '}
              <span className="font-semibold">{deleteTarget?.name}</span> and all of its execution
              history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteAutomation}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isError ? (
        <Card className="p-6 text-center">
          <p className="text-sm font-medium text-danger">Failed to load automations.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Try again
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[360px_1fr]">
          {/* LEFT: List */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-text-muted">
                {automations
                  ? `${automations.length} automation${automations.length === 1 ? '' : 's'}`
                  : 'Loading…'}
              </p>
            </div>
            <div className="flex flex-col gap-3 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1 aether-scroll">
              {isLoading || !automations ? (
                <>
                  <AutomationCardSkeleton />
                  <AutomationCardSkeleton />
                  <AutomationCardSkeleton />
                </>
              ) : automations.length === 0 ? (
                <Card className="p-8 text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-muted text-text-muted">
                    <Workflow className="size-5" />
                  </div>
                  <p className="text-sm font-medium">No automations yet</p>
                  <p className="mt-1 text-xs text-text-muted">
                    Create your first automation to get started.
                  </p>
                  <Button size="sm" className="mt-4" onClick={() => setNewOpen(true)}>
                    <Plus className="size-3.5" /> New Automation
                  </Button>
                </Card>
              ) : (
                automations.map((a) => (
                  <AutomationCard
                    key={a.id}
                    automation={a}
                    selected={selected?.id === a.id}
                    onSelect={() => openAutomation(a.id)}
                    onToggle={(enabled) => toggleEnabled(a, enabled)}
                    onRun={() => runAutomation(a)}
                    onEdit={() => openAutomation(a.id)}
                    onDelete={() => setDeleteTarget(a)}
                  />
                ))
              )}
            </div>
          </div>

          {/* RIGHT: Canvas */}
          <div className="flex flex-col min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]">
            {selected ? (
              <Card className="flex-1 overflow-hidden p-0 gap-0">
                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-text-muted">Rule Canvas</p>
                    <h2 className="text-sm font-semibold truncate">{selected.name}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Mobile: open canvas in a sheet */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="lg:hidden"
                      onClick={() => setMobileCanvasOpen(true)}
                    >
                      <Workflow className="size-3.5" /> Open Canvas
                    </Button>
                  </div>
                </div>
                {/* Desktop canvas */}
                <div className="hidden lg:block h-[calc(100vh-14rem)] min-h-[600px]">
                  <RuleCanvas
                    automation={selected}
                    onSaved={() => qc.invalidateQueries({ queryKey: qk.automations })}
                  />
                </div>
                {/* Mobile canvas preview (collapsed) */}
                <div className="lg:hidden p-4">
                  <Card className="p-4 bg-muted/30">
                    <div className="flex items-start gap-3">
                      <Workflow className="size-5 text-text-muted mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {selected.nodes.length} nodes · {selected.edges.length} edges
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          Tap "Open Canvas" to design the rule graph on a larger surface.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </Card>
            ) : (
              <Card className="flex-1 p-8 flex flex-col items-center justify-center text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted text-text-muted">
                  <Workflow className="size-7" />
                </div>
                <p className="text-sm font-medium">Select an automation</p>
                <p className="mt-1 text-xs text-text-muted max-w-sm">
                  Choose an automation from the list to view and edit its rule graph on the canvas.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Mobile canvas Sheet */}
      <MobileCanvasSheet
        open={mobileCanvasOpen}
        onOpenChange={setMobileCanvasOpen}
        automation={selected}
      />
    </div>
  );
}

// Mobile canvas via Sheet
function MobileCanvasSheet({
  open,
  onOpenChange,
  automation,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  automation: AutomationDTO | null;
}) {
  const qc = useQueryClient();
  if (!automation) return null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle className="text-sm">{automation.name}</SheetTitle>
          <SheetDescription className="text-xs">Edit rule graph</SheetDescription>
        </SheetHeader>
        <div className="flex-1 min-h-0">
          <RuleCanvas
            automation={automation}
            onSaved={() => qc.invalidateQueries({ queryKey: qk.automations })}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default AutomationsView;
