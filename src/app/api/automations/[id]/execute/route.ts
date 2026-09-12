import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ok, error, DEMO_ORG_ID } from '@/lib/api';

export const dynamic = 'force-dynamic';

// POST /api/automations/[id]/execute — manual trigger
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const automation = await db.automation.findUnique({ where: { id } });
  if (!automation) return error('Automation not found', 404);
  const exec = await db.automationExecution.create({
    data: {
      automationId: id,
      status: 'COMPLETED',
      trigger: JSON.stringify({ source: 'manual', actor: 'SensorGrid Operator' }),
      logs: JSON.stringify([
        { ts: new Date().toISOString(), level: 'info', message: 'Manual execution triggered.' },
      ]),
      completedAt: new Date(),
    },
  });
  await db.automation.update({
    where: { id },
    data: { lastExecutedAt: new Date(), executionCount: { increment: 1 } },
  });
  await db.auditLog.create({
    data: {
      organizationId: DEMO_ORG_ID,
      actorName: 'SensorGrid Operator',
      action: 'automation.execute',
      targetType: 'AUTOMATION',
      targetId: id,
      targetName: automation.name,
      metadata: JSON.stringify({ source: 'manual' }),
    },
  });
  return ok({
    execution: {
      ...exec,
      startedAt: exec.startedAt.toISOString(),
      completedAt: exec.completedAt?.toISOString() ?? null,
    },
  });
}
