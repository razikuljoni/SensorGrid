import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ok, DEMO_ORG_ID, DEMO_USER_NAME } from '@/lib/api'

export const dynamic = 'force-dynamic'

// GET /api/auth/me — return the demo user + active organization
export async function GET() {
  const user = await db.user.findUnique({ where: { id: 'user-pulse' } })
  const org = await db.organization.findUnique({ where: { id: DEMO_ORG_ID } })
  return ok({
    user: user ? {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
    } : null,
    organization: org,
  })
}

// POST /api/auth/login — demo login (always succeeds, returns demo user context)
export async function POST(_req: NextRequest) {
  const user = await db.user.findUnique({ where: { id: 'user-pulse' } })
  if (!user) return NextResponse.json({ error: 'Demo user missing' }, { status: 500 })
  return ok({
    user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, role: user.role },
    actorName: DEMO_USER_NAME,
  })
}
