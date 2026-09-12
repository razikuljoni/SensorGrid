import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toDeviceDTO, DEMO_ORG_ID } from '@/lib/api';

export const dynamic = 'force-dynamic';

// GET /api/dashboard — aggregated stats + environment snapshot + recent activity
export async function GET() {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since1h = new Date(Date.now() - 60 * 60 * 1000);

  const [
    devices,
    activeAlerts,
    automationsToday,
    telemetryToday,
    commandsToday,
    recentAudits,
    recentAlerts,
  ] = await Promise.all([
    db.device.findMany({
      where: { organizationId: DEMO_ORG_ID },
      include: { location: true, sensors: true, twin: true },
    }),
    db.alertEvent.count({ where: { organizationId: DEMO_ORG_ID, status: 'TRIGGERED' } }),
    db.automationExecution.count({ where: { startedAt: { gte: since24h } } }),
    db.telemetry.count({ where: { timestamp: { gte: since1h } } }),
    db.command.count({ where: { createdAt: { gte: since24h } } }),
    db.auditLog.findMany({
      where: { organizationId: DEMO_ORG_ID },
      orderBy: { createdAt: 'desc' },
      take: 12,
    }),
    db.alertEvent.findMany({
      where: { organizationId: DEMO_ORG_ID },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: { device: { select: { id: true, name: true } } },
    }),
  ]);

  const onlineDevices = devices.filter((d) => d.status === 'ONLINE').length;
  const offlineDevices = devices.filter((d) => d.status === 'OFFLINE').length;
  const warningDevices = devices.filter(
    (d) => d.status === 'WARNING' || d.status === 'CRITICAL'
  ).length;
  const criticalDevices = devices.filter((d) => d.status === 'CRITICAL').length;

  // Environment snapshot — average temperature/humidity/pressure/light/co2 across online devices
  const env: Record<string, { sum: number; count: number }> = {
    temperature: { sum: 0, count: 0 },
    humidity: { sum: 0, count: 0 },
    pressure: { sum: 0, count: 0 },
    light: { sum: 0, count: 0 },
    co2: { sum: 0, count: 0 },
  };
  let envSourceDevice: { id: string; name: string } | null = null;
  for (const d of devices) {
    if (d.status !== 'ONLINE' && d.status !== 'WARNING') continue;
    const twin = d.twin;
    if (!twin) continue;
    const reported = JSON.parse(twin.reported || '{}');
    for (const key of Object.keys(env)) {
      if (typeof reported[key] === 'number' && !Number.isNaN(reported[key])) {
        env[key].sum += reported[key];
        env[key].count += 1;
        if (!envSourceDevice) envSourceDevice = { id: d.id, name: d.name };
      }
    }
  }

  return NextResponse.json({
    stats: {
      totalDevices: devices.length,
      onlineDevices,
      offlineDevices,
      warningDevices,
      criticalDevices,
      activeAlerts,
      automationsToday,
      telemetryPointsToday: telemetryToday,
      commandsToday,
    },
    environment: {
      temperature: env.temperature.count ? env.temperature.sum / env.temperature.count : null,
      humidity: env.humidity.count ? env.humidity.sum / env.humidity.count : null,
      pressure: env.pressure.count ? env.pressure.sum / env.pressure.count : null,
      light: env.light.count ? env.light.sum / env.light.count : null,
      co2: env.co2.count ? env.co2.sum / env.co2.count : null,
      sourceDeviceId: envSourceDevice?.id ?? null,
      sourceDeviceName: envSourceDevice?.name ?? null,
      updatedAt: new Date().toISOString(),
    },
    devices: devices.map(toDeviceDTO),
    recentActivity: recentAudits.map((l) => ({
      id: l.id,
      action: l.action,
      actorName: l.actorName,
      targetType: l.targetType,
      targetName: l.targetName,
      createdAt: l.createdAt.toISOString(),
    })),
    recentAlerts: recentAlerts.map((a) => ({
      id: a.id,
      ruleName: a.ruleName,
      severity: a.severity,
      status: a.status,
      message: a.message,
      triggeredAt: a.triggeredAt.toISOString(),
      device: a.device ? { id: a.device.id, name: a.device.name } : null,
    })),
  });
}
