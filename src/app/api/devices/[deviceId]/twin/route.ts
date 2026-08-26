import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ok, error } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await ctx.params
  const twin = await db.deviceTwin.findUnique({ where: { deviceId } })
  if (!twin) return error('Twin not found', 404)
  return ok({
    id: twin.id,
    deviceId: twin.deviceId,
    desired: JSON.parse(twin.desired || '{}'),
    reported: JSON.parse(twin.reported || '{}'),
    version: twin.version,
    updatedAt: twin.updatedAt.toISOString(),
  })
}

// PATCH desired state — used by the Twin editor to set desired values.
// The realtime service will reconcile the reported state after a command ack.
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await ctx.params
  const body = await req.json().catch(() => ({}))
  const twin = await db.deviceTwin.findUnique({ where: { deviceId } })
  if (!twin) return error('Twin not found', 404)

  const desired = JSON.parse(twin.desired || '{}')
  const merged = { ...desired, ...body }
  const updated = await db.deviceTwin.update({
    where: { deviceId },
    data: { desired: JSON.stringify(merged), version: { increment: 1 } },
  })
  return ok({
    id: updated.id,
    deviceId: updated.deviceId,
    desired: JSON.parse(updated.desired || '{}'),
    reported: JSON.parse(updated.reported || '{}'),
    version: updated.version,
    updatedAt: updated.updatedAt.toISOString(),
  })
}
