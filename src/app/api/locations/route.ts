import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { toLocationDTO, ok, DEMO_ORG_ID } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function GET() {
  const locations = await db.location.findMany({
    where: { organizationId: DEMO_ORG_ID },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ locations: locations.map(toLocationDTO) })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const loc = await db.location.create({
    data: {
      organizationId: DEMO_ORG_ID,
      name: body.name ?? 'New Location',
      type: body.type ?? 'ROOM',
      parentId: body.parentId ?? null,
      metadata: JSON.stringify(body.metadata ?? {}),
    },
  })
  await db.auditLog.create({
    data: {
      organizationId: DEMO_ORG_ID,
      actorName: 'Pulse Operator',
      action: 'location.create',
      targetType: 'ORGANIZATION',
      targetId: loc.id,
      targetName: loc.name,
    },
  })
  return ok(toLocationDTO(loc))
}
