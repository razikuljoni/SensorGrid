import {
  Activity,
  AlertTriangle,
  Battery,
  BatteryLow,
  CheckCircle2,
  Cpu,
  HelpCircle,
  Moon,
  Plug,
  ShieldAlert,
  Wrench,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type {
  AlertSeverity,
  AlertStatus,
  CommandStatus,
  DeviceHealth,
  DeviceStatus,
  DeviceType,
  TelemetryQuality,
} from './types';

// ─── Time / Number formatters ───────────────────────────────────────────────

export function timeAgo(iso: string | Date | null): string {
  if (!iso) return 'never';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function formatTime(iso: string | Date | null, withSeconds = true): string {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: withSeconds ? '2-digit' : undefined,
  });
}

export function formatTimeShort(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNumber(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

// ─── Device status metadata ─────────────────────────────────────────────────

export interface StatusMeta {
  label: string;
  color: string; // tailwind text color class
  bg: string; // tailwind bg color class
  border: string;
  dot: string; // hex / oklch for inline style
  icon: typeof Activity;
}

export const DEVICE_STATUS_META: Record<DeviceStatus, StatusMeta> = {
  ONLINE: {
    label: 'Online',
    color: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/30',
    dot: 'var(--success)',
    icon: CheckCircle2,
  },
  OFFLINE: {
    label: 'Offline',
    color: 'text-muted-foreground',
    bg: 'bg-muted',
    border: 'border-border',
    dot: 'var(--text-muted)',
    icon: WifiOff,
  },
  SLEEPING: {
    label: 'Sleeping',
    color: 'text-info',
    bg: 'bg-info/10',
    border: 'border-info/30',
    dot: 'var(--info)',
    icon: Moon,
  },
  WARNING: {
    label: 'Warning',
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    dot: 'var(--warning)',
    icon: AlertTriangle,
  },
  CRITICAL: {
    label: 'Critical',
    color: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/30',
    dot: 'var(--danger)',
    icon: ShieldAlert,
  },
  MAINTENANCE: {
    label: 'Maintenance',
    color: 'text-info',
    bg: 'bg-info/10',
    border: 'border-info/30',
    dot: 'var(--info)',
    icon: Wrench,
  },
  UNKNOWN: {
    label: 'Unknown',
    color: 'text-muted-foreground',
    bg: 'bg-muted',
    border: 'border-border',
    dot: 'var(--text-muted)',
    icon: HelpCircle,
  },
};

export const DEVICE_HEALTH_META: Record<DeviceHealth, StatusMeta> = {
  HEALTHY: {
    label: 'Healthy',
    color: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/30',
    dot: 'var(--success)',
    icon: CheckCircle2,
  },
  DEGRADED: {
    label: 'Degraded',
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    dot: 'var(--warning)',
    icon: Activity,
  },
  WARNING: {
    label: 'Warning',
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    dot: 'var(--warning)',
    icon: AlertTriangle,
  },
  CRITICAL: {
    label: 'Critical',
    color: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/30',
    dot: 'var(--danger)',
    icon: ShieldAlert,
  },
  OFFLINE: {
    label: 'Offline',
    color: 'text-muted-foreground',
    bg: 'bg-muted',
    border: 'border-border',
    dot: 'var(--text-muted)',
    icon: WifiOff,
  },
  UNKNOWN: {
    label: 'Unknown',
    color: 'text-muted-foreground',
    bg: 'bg-muted',
    border: 'border-border',
    dot: 'var(--text-muted)',
    icon: HelpCircle,
  },
};

export const ALERT_SEVERITY_META: Record<AlertSeverity, StatusMeta> = {
  INFO: {
    label: 'Info',
    color: 'text-info',
    bg: 'bg-info/10',
    border: 'border-info/30',
    dot: 'var(--info)',
    icon: Activity,
  },
  WARNING: {
    label: 'Warning',
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    dot: 'var(--warning)',
    icon: AlertTriangle,
  },
  CRITICAL: {
    label: 'Critical',
    color: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/30',
    dot: 'var(--danger)',
    icon: ShieldAlert,
  },
};

export const ALERT_STATUS_META: Record<AlertStatus, StatusMeta> = {
  NORMAL: {
    label: 'Normal',
    color: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/30',
    dot: 'var(--success)',
    icon: CheckCircle2,
  },
  TRIGGERED: {
    label: 'Triggered',
    color: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/30',
    dot: 'var(--danger)',
    icon: AlertTriangle,
  },
  ACKNOWLEDGED: {
    label: 'Acknowledged',
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    dot: 'var(--warning)',
    icon: Activity,
  },
  RESOLVED: {
    label: 'Resolved',
    color: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/30',
    dot: 'var(--success)',
    icon: CheckCircle2,
  },
};

export const COMMAND_STATUS_META: Record<CommandStatus, StatusMeta> = {
  PENDING: {
    label: 'Pending',
    color: 'text-text-secondary',
    bg: 'bg-muted',
    border: 'border-border',
    dot: 'var(--text-secondary)',
    icon: Activity,
  },
  SENT: {
    label: 'Sent',
    color: 'text-info',
    bg: 'bg-info/10',
    border: 'border-info/30',
    dot: 'var(--info)',
    icon: Plug,
  },
  ACKNOWLEDGED: {
    label: 'Acknowledged',
    color: 'text-info',
    bg: 'bg-info/10',
    border: 'border-info/30',
    dot: 'var(--info)',
    icon: CheckCircle2,
  },
  COMPLETED: {
    label: 'Completed',
    color: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/30',
    dot: 'var(--success)',
    icon: CheckCircle2,
  },
  FAILED: {
    label: 'Failed',
    color: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/30',
    dot: 'var(--danger)',
    icon: AlertTriangle,
  },
  TIMEOUT: {
    label: 'Timeout',
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    dot: 'var(--warning)',
    icon: AlertTriangle,
  },
};

export const TELEMETRY_QUALITY_META: Record<TelemetryQuality, { label: string; color: string }> = {
  GOOD: { label: 'Good', color: 'text-success' },
  ESTIMATED: { label: 'Estimated', color: 'text-warning' },
  INVALID: { label: 'Invalid', color: 'text-danger' },
  MISSING: { label: 'Missing', color: 'text-muted-foreground' },
};

// ─── Device type icons ──────────────────────────────────────────────────────

export function deviceTypeIcon(type: DeviceType): typeof Cpu {
  switch (type) {
    case 'ESP32':
      return Cpu;
    case 'RPI':
      return Cpu;
    case 'ARDUINO':
      return Cpu;
    case 'GATEWAY':
      return Plug;
    default:
      return Cpu;
  }
}

export function batteryMeta(battery: number | null | undefined) {
  if (battery === null || battery === undefined)
    return { icon: Battery, label: '—', color: 'text-muted-foreground' };
  if (battery < 15) return { icon: BatteryLow, label: `${battery}%`, color: 'text-danger' };
  if (battery < 40) return { icon: BatteryLow, label: `${battery}%`, color: 'text-warning' };
  return { icon: Battery, label: `${battery}%`, color: 'text-success' };
}

export function signalMeta(signal: number | null | undefined) {
  if (signal === null || signal === undefined)
    return { icon: WifiOff, label: '—', color: 'text-muted-foreground' };
  if (signal > -55) return { icon: Wifi, label: `${signal} dBm`, color: 'text-success' };
  if (signal > -75) return { icon: Wifi, label: `${signal} dBm`, color: 'text-warning' };
  return { icon: Wifi, label: `${signal} dBm`, color: 'text-danger' };
}

// ─── Sensor unit helpers ─────────────────────────────────────────────────────

export const SENSOR_UNITS: Record<string, { unit: string; label: string; icon: typeof Activity }> =
  {
    temperature: { unit: '°C', label: 'Temperature', icon: Activity },
    humidity: { unit: '%', label: 'Humidity', icon: Activity },
    pressure: { unit: 'hPa', label: 'Pressure', icon: Activity },
    light: { unit: 'lux', label: 'Light', icon: Activity },
    co2: { unit: 'ppm', label: 'CO₂', icon: Activity },
    voltage: { unit: 'V', label: 'Voltage', icon: Activity },
    current: { unit: 'A', label: 'Current', icon: Activity },
    power: { unit: 'W', label: 'Power', icon: Activity },
    motion: { unit: '', label: 'Motion', icon: Activity },
  };

export function sensorMeta(key: string) {
  return SENSOR_UNITS[key] ?? { unit: '', label: key, icon: Activity };
}
