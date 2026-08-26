import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { toAlertEventDTO, ok, error, DEMO_ORG_ID } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function PATCH(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const evt = await db.alertEvent.findUnique({ where: { id }, include: { device: true } })
  if (!evt) return error('Alert event not found', 404)
  const updated = await db.alertEvent.update({
    where: { id },
    data: { status: 'RESOLVED', resolvedAt: new Date() },
    include: { device: { select: { id: true, name: true } } },
  })
  await db.auditLog.create({
    data: {
      organizationId: DEMO_ORG_ID,
      actorName: 'Pulse Operator',
      action: 'alert.resolve',
      targetType: 'ALERT',
      targetId: id,
      targetName: evt.ruleName,
    },
  })
  return ok(toAlertEventDTO(updated))
}
