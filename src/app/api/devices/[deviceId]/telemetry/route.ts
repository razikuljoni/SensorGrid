import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ok, error } from '@/lib/api'

export const dynamic = 'force-dynamic'

// GET /api/devices/[deviceId]/telemetry?sensorKey=temperature&range=24h
export async function GET(req: NextRequest, ctx: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await ctx.params
  const url = new URL(req.url)
  const sensorKey = url.searchParams.get('sensorKey')
  const range = url.searchParams.get('range') ?? '24h'

  const ranges: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  }
  const ms = ranges[range] ?? ranges['24h']
  const since = new Date(Date.now() - ms)

  const where = {
    deviceId,
    timestamp: { gte: since },
    ...(sensorKey ? { sensorKey } : {}),
  }

  // Downsample: target ~120 points max
  const points = await db.telemetry.findMany({
    where,
    orderBy: { timestamp: 'asc' },
    select: { sensorKey: true, value: true, unit: true, quality: true, timestamp: true },
  })

  // Group by sensorKey, then downsample each series to ~120 points
  const bySensor = new Map<string, { value: number; unit: string; quality: string; timestamp: Date }[]>()
  for (const p of points) {
    const arr = bySensor.get(p.sensorKey) ?? []
    arr.push({ value: p.value, unit: p.unit, quality: p.quality, timestamp: p.timestamp })
    bySensor.set(p.sensorKey, arr)
  }

  const series = Array.from(bySensor.entries()).map(([key, arr]) => {
    const target = 120
    const step = Math.max(1, Math.floor(arr.length / target))
    const downsampled = arr.filter((_, i) => i % step === 0)
    return {
      sensorKey: key,
      unit: arr[0]?.unit ?? '',
      points: downsampled.map((p) => ({
        timestamp: p.timestamp.toISOString(),
        value: p.value,
        quality: p.quality as 'GOOD' | 'ESTIMATED' | 'INVALID' | 'MISSING',
      })),
    }
  })

  return ok({ series })
}
