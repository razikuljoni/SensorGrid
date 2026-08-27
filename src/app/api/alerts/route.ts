import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { toAlertEventDTO, ok, DEMO_ORG_ID } from '@/lib/api'

export const dynamic = 'force-dynamic'

// GET /api/alerts?status=TRIGGERED&severity=CRITICAL
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const severity = url.searchParams.get('severity')

  const events = await db.alertEvent.findMany({
    where: {
      organizationId: DEMO_ORG_ID,
      ...(status ? { status } : {}),
      ...(severity ? { severity } : {}),
    },
    include: { device: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  const rules = await db.alertRule.findMany({
    where: { organizationId: DEMO_ORG_ID },
    include: { device: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    events: events.map(toAlertEventDTO),
    rules: rules.map((r) => ({
      id: r.id,
      organizationId: r.organizationId,
      deviceId: r.deviceId,
      sensorKey: r.sensorKey,
      name: r.name,
      description: r.description,
      condition: r.condition,
      threshold: r.threshold,
      severity: r.severity,
      enabled: r.enabled,
      cooldownSeconds: r.cooldownSeconds,
      device: r.device ? { id: r.device.id, name: r.device.name } : null,
    })),
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const rule = await db.alertRule.create({
    data: {
      organizationId: DEMO_ORG_ID,
      deviceId: body.deviceId ?? null,
      sensorKey: body.sensorKey ?? null,
      name: body.name ?? 'New Alert Rule',
      description: body.description ?? null,
      condition: body.condition ?? 'GT',
      threshold: body.threshold ?? null,
      severity: body.severity ?? 'WARNING',
      enabled: body.enabled ?? true,
      cooldownSeconds: body.cooldownSeconds ?? 300,
    },
    include: { device: { select: { id: true, name: true } } },
  })
  await db.auditLog.create({
    data: {
      organizationId: DEMO_ORG_ID,
      actorName: 'SensorGrid Operator',
      action: 'alert.rule.create',
      targetType: 'ALERT',
      targetId: rule.id,
      targetName: rule.name,
    },
  })
  return ok({
    id: rule.id,
    organizationId: rule.organizationId,
    deviceId: rule.deviceId,
    sensorKey: rule.sensorKey,
    name: rule.name,
    description: rule.description,
    condition: rule.condition,
    threshold: rule.threshold,
    severity: rule.severity,
    enabled: rule.enabled,
    cooldownSeconds: rule.cooldownSeconds,
    device: rule.device ? { id: rule.device.id, name: rule.device.name } : null,
  })
}
