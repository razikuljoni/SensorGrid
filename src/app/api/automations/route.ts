import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { toAutomationDTO, ok, DEMO_ORG_ID } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function GET() {
  const automations = await db.automation.findMany({
    where: { organizationId: DEMO_ORG_ID },
    orderBy: { createdAt: 'desc' },
    include: { executions: { orderBy: { startedAt: 'desc' }, take: 5 } },
  })
  return NextResponse.json({ automations: automations.map(toAutomationDTO) })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const automation = await db.automation.create({
    data: {
      organizationId: DEMO_ORG_ID,
      name: body.name ?? 'New Automation',
      description: body.description ?? null,
      enabled: body.enabled ?? true,
      triggerType: body.triggerType ?? 'MANUAL',
      triggerConfig: JSON.stringify(body.triggerConfig ?? {}),
      nodes: JSON.stringify(body.nodes ?? []),
      edges: JSON.stringify(body.edges ?? []),
    },
  })
  await db.auditLog.create({
    data: {
      organizationId: DEMO_ORG_ID,
      actorName: 'Pulse Operator',
      action: 'automation.create',
      targetType: 'AUTOMATION',
      targetId: automation.id,
      targetName: automation.name,
    },
  })
  return ok(toAutomationDTO(automation))
}
