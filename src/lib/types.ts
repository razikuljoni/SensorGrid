// ─────────────────────────────────────────────────────────────────────────────
// SensorGrid — Shared Domain Types
// Single source of truth used by frontend, API routes, and the realtime service.
// (In the spec's monorepo architecture, these live in packages/types.)
// ─────────────────────────────────────────────────────────────────────────────

export type DeviceStatus =
  'ONLINE' | 'OFFLINE' | 'SLEEPING' | 'WARNING' | 'CRITICAL' | 'MAINTENANCE' | 'UNKNOWN';

export type DeviceHealth = 'HEALTHY' | 'DEGRADED' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'UNKNOWN';

export type DeviceType = 'ESP32' | 'RPI' | 'ARDUINO' | 'GENERIC' | 'GATEWAY';

export type TelemetryQuality = 'GOOD' | 'ESTIMATED' | 'INVALID' | 'MISSING';

export type CommandStatus =
  'PENDING' | 'SENT' | 'ACKNOWLEDGED' | 'COMPLETED' | 'FAILED' | 'TIMEOUT';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertStatus = 'NORMAL' | 'TRIGGERED' | 'ACKNOWLEDGED' | 'RESOLVED';
export type AlertCondition =
  'GT' | 'LT' | 'GTE' | 'LTE' | 'EQ' | 'NEQ' | 'OFFLINE_FOR' | 'BATTERY_BELOW';

export type AutomationTriggerType =
  'TELEMETRY' | 'DEVICE_ONLINE' | 'DEVICE_OFFLINE' | 'SCHEDULE' | 'MANUAL';

export type AutomationExecutionStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT';

export type OrgRole = 'OWNER' | 'ADMIN' | 'ENGINEER' | 'OPERATOR' | 'VIEWER';

export type NotificationCategory = 'DEVICE' | 'ALERT' | 'AUTOMATION' | 'SYSTEM' | 'SECURITY';

export type AuditTargetType =
  'DEVICE' | 'AUTOMATION' | 'ALERT' | 'ORGANIZATION' | 'USER' | 'COMMAND';

// ─── Wire types (returned by API) ────────────────────────────────────────────

export interface OrganizationDTO {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceDTO {
  id: string;
  organizationId: string;
  locationId: string | null;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  health: DeviceHealth;
  firmwareVersion: string | null;
  ipAddress: string | null;
  macAddress: string | null;
  battery: number | null;
  signal: number | null;
  lastSeen: string | null;
  lastHeartbeat: string | null;
  tags: string[];
  notes: string | null;
  metadata: Record<string, unknown>;
  location: LocationDTO | null;
  sensors: SensorDTO[];
  twin: DeviceTwinDTO | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocationDTO {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
  metadata: Record<string, unknown>;
}

export interface SensorDTO {
  id: string;
  deviceId: string;
  key: string;
  label: string;
  unit: string;
  dataType: 'number' | 'boolean' | 'string' | 'json';
  min: number | null;
  max: number | null;
}

export interface DeviceTwinDTO {
  id: string;
  deviceId: string;
  desired: Record<string, unknown>;
  reported: Record<string, unknown>;
  version: number;
  updatedAt: string;
}

export interface TelemetryPointDTO {
  id: string;
  deviceId: string;
  sensorKey: string;
  value: number;
  unit: string;
  quality: TelemetryQuality;
  timestamp: string;
}

export interface TelemetrySeriesDTO {
  sensorKey: string;
  unit: string;
  points: { timestamp: string; value: number; quality: TelemetryQuality }[];
}

export interface CommandDTO {
  id: string;
  deviceId: string;
  senderName: string;
  payload: Record<string, unknown>;
  topic: string;
  status: CommandStatus;
  result: Record<string, unknown> | null;
  error: string | null;
  attempts: number;
  createdAt: string;
  sentAt: string | null;
  acknowledgedAt: string | null;
  completedAt: string | null;
}

export interface AutomationDTO {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  enabled: boolean;
  version: number;
  triggerType: AutomationTriggerType;
  triggerConfig: Record<string, unknown>;
  nodes: AutomationNode[];
  edges: AutomationEdge[];
  lastExecutedAt: string | null;
  executionCount: number;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationNode {
  id: string;
  type: 'trigger' | 'condition' | 'logic' | 'delay' | 'action' | 'notification';
  position: { x: number; y: number };
  data: {
    label: string;
    kind: string; // sub-type e.g. telemetry_received, and, gt, delay_seconds, send_command, notify
    config: Record<string, unknown>;
  };
}

export interface AutomationEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface AutomationExecutionDTO {
  id: string;
  automationId: string;
  automationName?: string;
  status: AutomationExecutionStatus;
  trigger: Record<string, unknown>;
  logs: Array<{ ts: string; level: string; message: string }>;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
}

export interface AlertRuleDTO {
  id: string;
  organizationId: string;
  deviceId: string | null;
  sensorKey: string | null;
  name: string;
  description: string | null;
  condition: AlertCondition;
  threshold: number | null;
  severity: AlertSeverity;
  enabled: boolean;
  cooldownSeconds: number;
}

export interface AlertEventDTO {
  id: string;
  organizationId: string;
  ruleId: string | null;
  deviceId: string | null;
  ruleName: string;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  context: Record<string, unknown>;
  triggeredAt: string;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  resolvedAt: string | null;
  device?: { id: string; name: string } | null;
}

export interface NotificationDTO {
  id: string;
  userId: string | null;
  organizationId: string;
  category: NotificationCategory;
  title: string;
  message: string;
  read: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLogDTO {
  id: string;
  organizationId: string;
  actorId: string | null;
  actorName: string;
  action: string;
  targetType: AuditTargetType;
  targetId: string | null;
  targetName: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}

export interface DashboardStatsDTO {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  warningDevices: number;
  criticalDevices: number;
  activeAlerts: number;
  automationsToday: number;
  telemetryPointsToday: number;
  commandsToday: number;
}

export interface EnvironmentSnapshotDTO {
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  light: number | null;
  co2: number | null;
  sourceDeviceId: string | null;
  sourceDeviceName: string | null;
  updatedAt: string | null;
}

// ─── Realtime socket events (server → client) ───────────────────────────────

export type ServerSocketEvent =
  | {
      type: 'device.telemetry';
      deviceId: string;
      sensorKey: string;
      value: number;
      unit: string;
      quality: TelemetryQuality;
      timestamp: string;
    }
  | { type: 'device.online'; deviceId: string; deviceName: string; timestamp: string }
  | { type: 'device.offline'; deviceId: string; deviceName: string; timestamp: string }
  | {
      type: 'device.state';
      deviceId: string;
      status: DeviceStatus;
      health: DeviceHealth;
      battery: number | null;
      signal: number | null;
      lastSeen: string;
    }
  | { type: 'command.created'; command: CommandDTO }
  | { type: 'command.updated'; command: CommandDTO }
  | { type: 'automation.started'; execution: AutomationExecutionDTO }
  | { type: 'automation.completed'; execution: AutomationExecutionDTO }
  | { type: 'alert.triggered'; alert: AlertEventDTO }
  | { type: 'alert.acknowledged'; alert: AlertEventDTO }
  | { type: 'alert.resolved'; alert: AlertEventDTO }
  | { type: 'notification.created'; notification: NotificationDTO }
  | { type: 'activity'; log: AuditLogDTO };

export type ClientSocketEvent =
  | { type: 'subscribe'; organizationId: string }
  | { type: 'command.send'; deviceId: string; payload: Record<string, unknown> };
