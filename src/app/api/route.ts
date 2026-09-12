import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: 'SensorGrid API',
    version: 'v1',
    description: 'IoT Device Intelligence & Automation Platform — REST API',
    endpoints: [
      '/api/dashboard',
      '/api/devices',
      '/api/devices/[deviceId]',
      '/api/devices/[deviceId]/telemetry',
      '/api/devices/[deviceId]/commands',
      '/api/devices/[deviceId]/twin',
      '/api/devices/[deviceId]/history',
      '/api/automations',
      '/api/automations/[id]',
      '/api/automations/[id]/execute',
      '/api/alerts',
      '/api/alerts/[id]/acknowledge',
      '/api/alerts/[id]/resolve',
      '/api/notifications',
      '/api/notifications/[id]/read',
      '/api/audit',
      '/api/analytics',
      '/api/org',
      '/api/locations',
      '/api/auth',
    ],
  });
}
