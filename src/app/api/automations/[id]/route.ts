import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { toAutomationDTO, ok, error, DEMO_ORG_ID } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const automation = await db.automation.findUnique({
    where: { id },
    include: { executions: { orderBy: { startedAt: 'desc' }, take: 20 } },
  })
  if (!automation) return error('Automation not found', 404)
  return ok(toAutomationDTO(automation))
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await req.json().catch(() => ({}))
  const existing = await db.automation.findUnique({ where: { id } })
  if (!existing) return error('Automation not found', 404)

  const updated = await db.automation.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: String(body.name) } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.enabled !== undefined ? { enabled: Boolean(body.enabled) } : {}),
      ...(body.triggerType !== undefined ? { triggerType: String(body.triggerType) } : {}),
      ...(body.triggerConfig !== undefined ? { triggerConfig: JSON.stringify(body.triggerConfig) } : {}),
      ...(body.nodes !== undefined ? { nodes: JSON.stringify(body.nodes) } : {}),
      ...(body.edges !== undefined ? { edges: JSON.stringify(body.edges) } : {}),
      version: { increment: 1 },
    },
    include: { executions: { orderBy: { startedAt: 'desc' }, take: 20 } },
  })

  await db.auditLog.create({
    data: {
      organizationId: DEMO_ORG_ID,
      actorName: 'SensorGrid Operator',
      action: 'automation.update',
      targetType: 'AUTOMATION',
      targetId: id,
      targetName: updated.name,
      metadata: JSON.stringify({ fields: Object.keys(body) }),
    },
  })
  return ok(toAutomationDTO(updated))
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const existing = await db.automation.findUnique({ where: { id } })
  if (!existing) return error('Automation not found', 404)
  await db.automation.delete({ where: { id } })
  await db.auditLog.create({
    data: {
      organizationId: DEMO_ORG_ID,
      actorName: 'SensorGrid Operator',
      action: 'automation.delete',
      targetType: 'AUTOMATION',
      targetId: id,
      targetName: existing.name,
    },
  })
  return ok({ deleted: true })
}
