import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toCommandDTO, ok, error, DEMO_ORG_ID, DEMO_USER_NAME } from '@/lib/api';
import { executeCommand } from '@/lib/engine';

export const dynamic = 'force-dynamic';

// GET /api/devices/[deviceId]/commands — recent command history
export async function GET(_req: NextRequest, ctx: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await ctx.params;
  const commands = await db.command.findMany({
    where: { deviceId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return ok({ commands: commands.map(toCommandDTO) });
}

// POST /api/devices/[deviceId]/commands — create + dispatch a command
export async function POST(req: NextRequest, ctx: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const payload = body.payload ?? body;

  const device = await db.device.findUnique({ where: { id: deviceId } });
  if (!device) return error('Device not found', 404);
  if (device.status === 'OFFLINE') return error('Device is offline — cannot send command', 409);

  const command = await executeCommand(deviceId, payload, DEMO_USER_NAME);
  if (!command) return error('Failed to execute command', 500);

  return ok(toCommandDTO(command));
}
