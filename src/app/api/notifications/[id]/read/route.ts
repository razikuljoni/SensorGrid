import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toNotificationDTO, ok, error } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function PATCH(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const notif = await db.notification.findUnique({ where: { id } });
  if (!notif) return error('Notification not found', 404);
  const updated = await db.notification.update({ where: { id }, data: { read: true } });
  return ok(toNotificationDTO(updated));
}
