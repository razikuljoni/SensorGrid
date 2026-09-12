'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { timeAgo } from '@/lib/status';
import type { AuditLogDTO } from '@/lib/types';
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Cpu,
  Power,
  Settings,
  Zap,
} from 'lucide-react';

// ─── SignalTimeline ──────────────────────────────────────────────────────────
// Horizontal/vertical event timeline showing live system activity.
// Shows: telemetry spike, command sent, automation triggered, device disconnected, etc.

export interface SignalTimelineProps {
  events: AuditLogDTO[];
  maxItems?: number;
  className?: string;
  emptyMessage?: string;
}

function actionIcon(action: string): { icon: typeof Activity; color: string } {
  if (action.startsWith('device.command'))
    return { icon: Zap, color: 'text-accent-foreground bg-accent/30' };
  if (action.startsWith('device.create') || action.startsWith('device.update'))
    return { icon: Cpu, color: 'text-info bg-info/10' };
  if (action.startsWith('device.delete')) return { icon: Cpu, color: 'text-danger bg-danger/10' };
  if (action.startsWith('device.online') || action.startsWith('device.offline')) {
    return action.includes('online')
      ? { icon: Power, color: 'text-success bg-success/10' }
      : { icon: Power, color: 'text-text-muted bg-muted' };
  }
  if (action.startsWith('alert'))
    return { icon: AlertTriangle, color: 'text-warning bg-warning/10' };
  if (action.startsWith('automation'))
    return { icon: Activity, color: 'text-primary bg-primary/10' };
  if (action.startsWith('notification')) return { icon: Bell, color: 'text-info bg-info/10' };
  if (action.startsWith('settings')) return { icon: Settings, color: 'text-text-muted bg-muted' };
  return { icon: CheckCircle2, color: 'text-text-muted bg-muted' };
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    'device.create': 'Device Registered',
    'device.update': 'Device Updated',
    'device.delete': 'Device Removed',
    'device.command': 'Command Sent',
    'device.command.ack': 'Command Acknowledged',
    'device.online': 'Device Online',
    'device.offline': 'Device Offline',
    'automation.create': 'Automation Created',
    'automation.update': 'Automation Updated',
    'automation.delete': 'Automation Removed',
    'automation.execute': 'Automation Executed',
    'alert.triggered': 'Alert Triggered',
    'alert.acknowledge': 'Alert Acknowledged',
    'alert.resolve': 'Alert Resolved',
    'alert.rule.create': 'Alert Rule Created',
    'location.create': 'Location Added',
  };
  return map[action] ?? action;
}

export function SignalTimeline({
  events,
  maxItems = 50,
  className,
  emptyMessage = 'No activity yet',
}: SignalTimelineProps) {
  const items = events.slice(0, maxItems);

  if (items.length === 0) {
    return (
      <div
        className={cn('flex items-center justify-center py-12 text-sm text-text-muted', className)}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <ScrollArea className={cn('h-full', className)}>
      <div className="relative pl-2">
        {/* vertical line */}
        <div className="absolute left-[1.05rem] top-2 bottom-2 w-px bg-border" />
        <ul className="space-y-3">
          {items.map((evt, i) => {
            const { icon: Icon, color } = actionIcon(evt.action);
            return (
              <li
                key={evt.id}
                className={cn(
                  'relative flex items-start gap-3 aether-blip',
                  i === 0 && 'animate-in'
                )}
                style={{ animationDelay: i === 0 ? '0s' : undefined }}
              >
                <span
                  className={cn(
                    'z-10 flex size-5 shrink-0 items-center justify-center rounded-full ring-2 ring-background',
                    color
                  )}
                >
                  <Icon className="size-2.5" />
                </span>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium truncate">
                      {actionLabel(evt.action)}
                      {evt.targetName && (
                        <span className="text-text-muted font-normal"> · {evt.targetName}</span>
                      )}
                    </p>
                    <time className="text-[10px] text-text-muted whitespace-nowrap shrink-0">
                      {timeAgo(evt.createdAt)}
                    </time>
                  </div>
                  <p className="text-xs text-text-muted">by {evt.actorName}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </ScrollArea>
  );
}
