import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { toNotificationDTO, ok, DEMO_ORG_ID } from '@/lib/api'

export const dynamic = 'force-dynamic'

// GET /api/notifications?unread=true
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const unread = url.searchParams.get('unread') === 'true'
  const notifications = await db.notification.findMany({
    where: {
      organizationId: DEMO_ORG_ID,
      ...(unread ? { read: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json({ notifications: notifications.map(toNotificationDTO) })
}

// Mark all as read
export async function PATCH() {
  await db.notification.updateMany({
    where: { organizationId: DEMO_ORG_ID, read: false },
    data: { read: true },
  })
  return ok({ marked: true })
}
