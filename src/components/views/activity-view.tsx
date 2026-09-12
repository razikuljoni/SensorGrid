'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Filter } from 'lucide-react';
import { SignalTimeline } from '@/components/aether/signal-timeline';
import { useAuditLog, useRealtimeNotifications } from '@/lib/hooks';

const ACTION_FILTERS = [
  { value: '', label: 'All' },
  { value: 'device.', label: 'Device' },
  { value: 'automation.', label: 'Automation' },
  { value: 'alert.', label: 'Alert' },
  { value: 'notification.', label: 'Notification' },
  { value: 'location.', label: 'Location' },
];

export function ActivityView() {
  useRealtimeNotifications();
  const [action, setAction] = React.useState('');
  const [q, setQ] = React.useState('');
  const { data, isLoading } = useAuditLog(200, action || undefined);

  const filtered = React.useMemo(() => {
    if (!data) return [];
    if (!q) return data;
    const lower = q.toLowerCase();
    return data.filter(
      (l: any) =>
        l.action.toLowerCase().includes(lower) ||
        l.actorName.toLowerCase().includes(lower) ||
        (l.targetName ?? '').toLowerCase().includes(lower)
    );
  }, [data, q]);

  return (
    <div className="flex min-h-screen flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <Card className="flex-1 flex flex-col min-h-0 mx-auto w-full max-w-6xl">
        <CardHeader className="border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="size-4" />
              Activity Log
              {data && (
                <Badge variant="outline" className="text-[10px] h-5">
                  {data.length} entries
                </Badge>
              )}
            </CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Filter className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-text-muted" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Filter by action, actor, or target…"
                className="h-8 w-64 pl-7 text-xs"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {ACTION_FILTERS.map((f) => (
                <Button
                  key={f.value}
                  variant={action === f.value ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setAction(f.value)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-4 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-280px)] min-h-96">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-text-muted">
                No audit entries match your filters.
              </div>
            ) : (
              <SignalTimeline events={filtered} maxItems={200} emptyMessage="No activity yet" />
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
