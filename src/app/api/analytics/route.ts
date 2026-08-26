import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ok, DEMO_ORG_ID } from '@/lib/api'

export const dynamic = 'force-dynamic'

// GET /api/analytics?range=24h — aggregated metrics across all org devices
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
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

  const [devices, telemetryCount, alertCount, automationExecCount, commandCount] = await Promise.all([
    db.device.findMany({
      where: { organizationId: DEMO_ORG_ID },
      include: { sensors: true, location: true },
    }),
    db.telemetry.count({ where: { timestamp: { gte: since } } }),
    db.alertEvent.count({ where: { organizationId: DEMO_ORG_ID, triggeredAt: { gte: since } } }),
    db.automationExecution.count({ where: { startedAt: { gte: since } } }),
    db.command.count({ where: { createdAt: { gte: since } } }),
  ])

  // Per-sensor time series (downsampled to 60 points)
  const seriesBySensor = new Map<string, { ts: Date; value: number; unit: string }[]>()
  const allTelemetry = await db.telemetry.findMany({
    where: { timestamp: { gte: since } },
    orderBy: { timestamp: 'asc' },
    select: { sensorKey: true, value: true, unit: true, timestamp: true },
  })
  for (const t of allTelemetry) {
    const arr = seriesBySensor.get(t.sensorKey) ?? []
    arr.push({ ts: t.timestamp, value: t.value, unit: t.unit })
    seriesBySensor.set(t.sensorKey, arr)
  }
  const series = Array.from(seriesBySensor.entries()).map(([key, arr]) => {
    const step = Math.max(1, Math.floor(arr.length / 60))
    return {
      sensorKey: key,
      unit: arr[0]?.unit ?? '',
      points: arr.filter((_, i) => i % step === 0).map((p) => ({
        timestamp: p.ts.toISOString(),
        value: p.value,
      })),
    }
  })

  // Per-device telemetry volume (for bar chart)
  const deviceVolume = await db.telemetry.groupBy({
    by: ['deviceId'],
    where: { timestamp: { gte: since } },
    _count: { _all: true },
  })
  const deviceVolumeNamed = deviceVolume.map((v) => {
    const d = devices.find((d) => d.id === v.deviceId)
    return { deviceId: v.deviceId, deviceName: d?.name ?? v.deviceId, count: v._count._all }
  }).sort((a, b) => b.count - a.count).slice(0, 8)

  // Per-hour telemetry volume (for activity chart)
  const hourlyBuckets: Record<string, number> = {}
  for (const t of allTelemetry) {
    const bucket = t.timestamp.toISOString().slice(0, 13) // YYYY-MM-DDTHH
    hourlyBuckets[bucket] = (hourlyBuckets[bucket] ?? 0) + 1
  }
  const hourlyVolume = Object.entries(hourlyBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-24)
    .map(([bucket, count]) => ({ hour: bucket.slice(11), count }))

  // Alert frequency by severity
  const alertsBySeverity = await db.alertEvent.groupBy({
    by: ['severity'],
    where: { organizationId: DEMO_ORG_ID, triggeredAt: { gte: since } },
    _count: { _all: true },
  })

  return NextResponse.json({
    range,
    summary: {
      totalDevices: devices.length,
      onlineDevices: devices.filter((d) => d.status === 'ONLINE').length,
      telemetryPoints: telemetryCount,
      alerts: alertCount,
      automationExecutions: automationExecCount,
      commands: commandCount,
    },
    series,
    deviceVolume: deviceVolumeNamed,
    hourlyVolume,
    alertsBySeverity: alertsBySeverity.map((a) => ({ severity: a.severity, count: a._count._all })),
  })
}
