import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { toAuditLogDTO, toCommandDTO, ok, error } from '@/lib/api'

export const dynamic = 'force-dynamic'

// GET /api/devices/[deviceId]/history — combined audit + commands timeline
export async function GET(req: NextRequest, ctx: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await ctx.params
  const url = new URL(req.url)
  const limit = Number(url.searchParams.get('limit') ?? 50)

  const [device, commands, audits] = await Promise.all([
    db.device.findUnique({ where: { id: deviceId }, select: { name: true } }),
    db.command.findMany({ where: { deviceId }, orderBy: { createdAt: 'desc' }, take: limit }),
    db.auditLog.findMany({
      where: { OR: [{ targetId: deviceId }, { metadata: { contains: deviceId } }] },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
  ])
  if (!device) return error('Device not found', 404)

  return ok({
    commands: commands.map(toCommandDTO),
    audits: audits.map(toAuditLogDTO),
  })
}
