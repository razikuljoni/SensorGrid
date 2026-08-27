import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { toCommandDTO, ok, error, DEMO_ORG_ID, DEMO_USER_NAME } from '@/lib/api'
import { getRealtimeSocketSafe } from '@/lib/realtime-server'

export const dynamic = 'force-dynamic'

// GET /api/devices/[deviceId]/commands — recent command history
export async function GET(_req: NextRequest, ctx: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await ctx.params
  const commands = await db.command.findMany({
    where: { deviceId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return ok({ commands: commands.map(toCommandDTO) })
}

// POST /api/devices/[deviceId]/commands — create + dispatch a command
export async function POST(req: NextRequest, ctx: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await ctx.params
  const body = await req.json().catch(() => ({}))
  const payload = body.payload ?? body

  const device = await db.device.findUnique({ where: { id: deviceId } })
  if (!device) return error('Device not found', 404)
  if (device.status === 'OFFLINE') return error('Device is offline — cannot send command', 409)

  // Persist the command record (status PENDING)
  const command = await db.command.create({
    data: {
      deviceId,
      senderName: DEMO_USER_NAME,
      payload: JSON.stringify(payload),
      topic: `sensorgrid/sensorgrid-hq/${deviceId}/command`,
      status: 'PENDING',
    },
  })

  await db.auditLog.create({
    data: {
      organizationId: DEMO_ORG_ID,
      actorName: DEMO_USER_NAME,
      action: 'device.command',
      targetType: 'COMMAND',
      targetId: deviceId,
      targetName: device.name,
      metadata: JSON.stringify({ commandId: command.id, payload }),
    },
  })

  // Forward to the realtime service which simulates the device ack
  getRealtimeSocketSafe()?.emit('command.send', { deviceId, payload })

  return ok(toCommandDTO(command))
}
