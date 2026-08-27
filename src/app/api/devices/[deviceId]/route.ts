import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { toDeviceDTO, DEMO_ORG_ID, ok, error } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await ctx.params
  const device = await db.device.findUnique({
    where: { id: deviceId },
    include: { location: true, sensors: true, twin: true, credential: true },
  })
  if (!device) return error('Device not found', 404)
  return ok(toDeviceDTO(device))
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await ctx.params
  const body = await req.json().catch(() => ({}))
  const device = await db.device.findUnique({ where: { id: deviceId } })
  if (!device) return error('Device not found', 404)

  const updated = await db.device.update({
    where: { id: deviceId },
    data: {
      ...(body.name !== undefined ? { name: String(body.name) } : {}),
      ...(body.notes !== undefined ? { notes: String(body.notes) } : {}),
      ...(body.tags !== undefined ? { tags: JSON.stringify(body.tags) } : {}),
      ...(body.status !== undefined ? { status: String(body.status) } : {}),
      ...(body.locationId !== undefined ? { locationId: body.locationId } : {}),
    },
    include: { location: true, sensors: true, twin: true },
  })

  await db.auditLog.create({
    data: {
      organizationId: DEMO_ORG_ID,
      actorName: 'SensorGrid Operator',
      action: 'device.update',
      targetType: 'DEVICE',
      targetId: deviceId,
      targetName: updated.name,
      metadata: JSON.stringify({ fields: Object.keys(body) }),
    },
  })

  return ok(toDeviceDTO(updated))
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await ctx.params
  const device = await db.device.findUnique({ where: { id: deviceId } })
  if (!device) return error('Device not found', 404)
  await db.device.delete({ where: { id: deviceId } })
  await db.auditLog.create({
    data: {
      organizationId: DEMO_ORG_ID,
      actorName: 'SensorGrid Operator',
      action: 'device.delete',
      targetType: 'DEVICE',
      targetId: deviceId,
      targetName: device.name,
    },
  })
  return ok({ deleted: true })
}
