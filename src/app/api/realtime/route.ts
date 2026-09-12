import { db } from '@/lib/db';
import { runEngineTickIfNeeded } from '@/lib/engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let active = true;
      let lastEventId: string | null = null;

      req.signal.addEventListener('abort', () => {
        active = false;
        try {
          controller.close();
        } catch {}
      });

      // Welcome event
      const welcome = JSON.stringify({
        type: 'notification.created',
        notification: {
          id: 'welcome-' + Date.now(),
          organizationId: 'org-sensorgrid-hq',
          category: 'SYSTEM',
          title: 'Realtime connected',
          message: 'Live SSE telemetry stream active.',
          read: false,
          metadata: {},
          createdAt: new Date().toISOString(),
        },
      });
      controller.enqueue(encoder.encode(`event: message\ndata: ${welcome}\n\n`));

      // Main polling loop (drains outbox + triggers tick)
      while (active) {
        try {
          // Trigger engine tick
          await runEngineTickIfNeeded();

          // Fetch new outbox events
          const events = await db.realtimeEvent.findMany({
            where: lastEventId ? { id: { gt: lastEventId } } : undefined,
            orderBy: { createdAt: 'asc' },
            take: 20,
          });

          for (const ev of events) {
            if (!active) break;
            controller.enqueue(encoder.encode(`event: message\ndata: ${ev.payload}\n\n`));
            lastEventId = ev.id;
          }

          // Housekeeping: delete outbox events older than 60s
          if (Math.random() < 0.1) {
            const cutoff = new Date(Date.now() - 60_000);
            await db.realtimeEvent
              .deleteMany({
                where: { createdAt: { lt: cutoff } },
              })
              .catch(() => {});
          }

          // Heartbeat comment to keep connection alive
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch (e) {
          console.error('[sse] loop error:', e);
        }

        // Wait 2s before next check
        await new Promise((r) => setTimeout(r, 2000));
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
