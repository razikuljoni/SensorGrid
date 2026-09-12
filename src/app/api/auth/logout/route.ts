import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEMO_ORG_ID, DEMO_USER_NAME } from '@/lib/api';

export const dynamic = 'force-dynamic';

// POST /api/auth/logout
// In a real app this would destroy the server-side session + clear cookies.
// In this demo deployment it records an audit entry and returns success.
export async function POST() {
  try {
    await db.auditLog.create({
      data: {
        organizationId: DEMO_ORG_ID,
        actorName: DEMO_USER_NAME,
        action: 'auth.logout',
        targetType: 'USER',
        targetName: DEMO_USER_NAME,
        metadata: JSON.stringify({ source: 'web' }),
      },
    });
  } catch {
    // non-critical
  }

  const res = NextResponse.json({ success: true });
  // Clear any session cookies (no-op in demo, but correct for production)
  res.cookies.set('session', '', { httpOnly: true, maxAge: 0, path: '/' });
  return res;
}
