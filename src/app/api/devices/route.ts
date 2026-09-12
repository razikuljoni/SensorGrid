import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toDeviceDTO, DEMO_ORG_ID } from '@/lib/api';

export const dynamic = 'force-dynamic';

// GET /api/devices?status=ONLINE&locationId=loc-living&q=living
export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const locationId = url.searchParams.get('locationId');
  const q = url.searchParams.get('q')?.toLowerCase();

  const devices = await db.device.findMany({
    where: {
      organizationId: DEMO_ORG_ID,
      ...(status ? { status } : {}),
      ...(locationId ? { locationId } : {}),
      ...(q ? { OR: [{ name: { contains: q } }, { tags: { contains: q } }] } : {}),
    },
    include: {
      location: true,
      sensors: true,
      twin: true,
    },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ devices: devices.map(toDeviceDTO) });
}
