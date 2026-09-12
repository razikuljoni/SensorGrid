import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── DTO mappers (Prisma row → wire DTO) ─────────────────────────────────────
// Shared across API routes so the frontend gets a consistent shape.

export function toLocationDTO(loc: {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
  metadata: string;
}) {
  return {
    id: loc.id,
    name: loc.name,
    type: loc.type,
    parentId: loc.parentId,
    metadata: safeParse(loc.metadata, {}),
  };
}

export function toSensorDTO(s: {
  id: string;
  deviceId: string;
  key: string;
  label: string;
  unit: string;
  dataType: string;
  min: number | null;
  max: number | null;
}) {
  return {
    id: s.id,
    deviceId: s.deviceId,
    key: s.key,
    label: s.label,
    unit: s.unit,
    dataType: s.dataType as 'number' | 'boolean' | 'string' | 'json',
    min: s.min,
    max: s.max,
  };
}

export function toDeviceDTO(d: any) {
  return {
    id: d.id,
    organizationId: d.organizationId,
    locationId: d.locationId,
    name: d.name,
    type: d.type,
    status: d.status,
    health: d.health,
    firmwareVersion: d.firmwareVersion,
    ipAddress: ((safeParse(d.metadata, {}) as Record<string, unknown>).ip as string | null) ?? null,
    macAddress: d.macAddress,
    battery: d.battery,
    signal: d.signal,
    lastSeen: d.lastSeen?.toISOString() ?? null,
    lastHeartbeat: d.lastHeartbeat?.toISOString() ?? null,
    tags: safeParse<string[]>(d.tags, []),
    notes: d.notes,
    metadata: safeParse(d.metadata, {}),
    location: d.location ? toLocationDTO(d.location) : null,
    sensors: (d.sensors ?? []).map(toSensorDTO),
    twin: d.twin
      ? {
          id: d.twin.id,
          deviceId: d.twin.deviceId,
          desired: safeParse(d.twin.desired, {}),
          reported: safeParse(d.twin.reported, {}),
          version: d.twin.version,
          updatedAt: d.twin.updatedAt.toISOString(),
        }
      : null,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

export function toCommandDTO(c: any) {
  return {
    id: c.id,
    deviceId: c.deviceId,
    senderName: c.senderName,
    payload: safeParse(c.payload, {}),
    topic: c.topic,
    status: c.status,
    result: c.result ? safeParse(c.result, {}) : null,
    error: c.error,
    attempts: c.attempts,
    createdAt: c.createdAt.toISOString(),
    sentAt: c.sentAt?.toISOString() ?? null,
    acknowledgedAt: c.acknowledgedAt?.toISOString() ?? null,
    completedAt: c.completedAt?.toISOString() ?? null,
  };
}

export function toAutomationDTO(a: any) {
  return {
    id: a.id,
    organizationId: a.organizationId,
    name: a.name,
    description: a.description,
    enabled: a.enabled,
    version: a.version,
    triggerType: a.triggerType,
    triggerConfig: safeParse(a.triggerConfig, {}),
    nodes: safeParse(a.nodes, []),
    edges: safeParse(a.edges, []),
    lastExecutedAt: a.lastExecutedAt?.toISOString() ?? null,
    executionCount: a.executionCount,
    failureCount: a.failureCount,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

export function toAlertEventDTO(e: any) {
  return {
    id: e.id,
    organizationId: e.organizationId,
    ruleId: e.ruleId,
    deviceId: e.deviceId,
    ruleName: e.ruleName,
    severity: e.severity,
    status: e.status,
    message: e.message,
    context: safeParse(e.context, {}),
    triggeredAt: e.triggeredAt.toISOString(),
    acknowledgedAt: e.acknowledgedAt?.toISOString() ?? null,
    acknowledgedBy: e.acknowledgedBy,
    resolvedAt: e.resolvedAt?.toISOString() ?? null,
    device: e.device ? { id: e.device.id, name: e.device.name } : null,
  };
}

export function toNotificationDTO(n: any) {
  return {
    id: n.id,
    userId: n.userId,
    organizationId: n.organizationId,
    category: n.category,
    title: n.title,
    message: n.message,
    read: n.read,
    metadata: safeParse(n.metadata, {}),
    createdAt: n.createdAt.toISOString(),
  };
}

export function toAuditLogDTO(l: any) {
  return {
    id: l.id,
    organizationId: l.organizationId,
    actorId: l.actorId,
    actorName: l.actorName,
    action: l.action,
    targetType: l.targetType,
    targetId: l.targetId,
    targetName: l.targetName,
    metadata: safeParse(l.metadata, {}),
    ipAddress: l.ipAddress,
    createdAt: l.createdAt.toISOString(),
  };
}

function safeParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// ─── Org context (single demo org for this MVP) ───────────────────────────────
export const DEMO_ORG_ID = 'org-sensorgrid-hq';
export const DEMO_USER_ID = 'user-sensorgrid';
export const DEMO_USER_NAME = 'SensorGrid Operator';

export async function getOrgContext(_req: NextRequest) {
  // In a real app this would decode the session cookie and resolve the user's
  // active organization. For the MVP we use the single seeded demo org.
  const org = await db.organization.findUnique({ where: { id: DEMO_ORG_ID } });
  return org;
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
