import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { toAuditLogDTO, ok, DEMO_ORG_ID } from '@/lib/api'

export const dynamic = 'force-dynamic'

// GET /api/audit?action=device.command&limit=100
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const action = url.searchParams.get('action')
  const targetType = url.searchParams.get('targetType')
  const limit = Number(url.searchParams.get('limit') ?? 100)

  const logs = await db.auditLog.findMany({
    where: {
      organizationId: DEMO_ORG_ID,
      ...(action ? { action } : {}),
      ...(targetType ? { targetType } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: Math.min(limit, 500),
  })
  return NextResponse.json({ logs: logs.map(toAuditLogDTO) })
}
