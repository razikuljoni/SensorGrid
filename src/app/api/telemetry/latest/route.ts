import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

// GET /api/telemetry/latest — most recent telemetry point per device sensor
export async function GET() {
  const devices = await db.device.findMany({
    where: { status: { not: 'OFFLINE' } },
    select: { id: true, name: true },
  });
  const latest: Array<{
    deviceId: string;
    deviceName: string;
    sensorKey: string;
    value: number;
    unit: string;
    quality: string;
    timestamp: string;
  }> = [];

  for (const d of devices) {
    const recent = await db.telemetry.findMany({
      where: { deviceId: d.id },
      orderBy: { timestamp: 'desc' },
      take: 20,
      distinct: ['sensorKey'],
      select: { sensorKey: true, value: true, unit: true, quality: true, timestamp: true },
    });
    for (const r of recent) {
      latest.push({
        deviceId: d.id,
        deviceName: d.name,
        sensorKey: r.sensorKey,
        value: r.value,
        unit: r.unit,
        quality: r.quality,
        timestamp: r.timestamp.toISOString(),
      });
    }
  }
  return Response.json({ latest });
}
