import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ok, DEMO_ORG_ID } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function GET() {
  const org = await db.organization.findUnique({ where: { id: DEMO_ORG_ID } })
  const members = await db.organizationMember.findMany({
    where: { organizationId: DEMO_ORG_ID },
    include: { user: true },
  })
  const deviceCount = await db.device.count({ where: { organizationId: DEMO_ORG_ID } })
  const automationCount = await db.automation.count({ where: { organizationId: DEMO_ORG_ID } })
  return NextResponse.json({
    organization: org,
    members: members.map((m) => ({ id: m.id, role: m.role, user: { id: m.user.id, name: m.user.name, email: m.user.email, avatarUrl: m.user.avatarUrl }, joinedAt: m.createdAt.toISOString() })),
    stats: { deviceCount, automationCount },
  })
}
