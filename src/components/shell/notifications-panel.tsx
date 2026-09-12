'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bell, CheckCheck, Cpu, AlertTriangle, Zap, ShieldAlert, Info } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useUnreadNotifications, useNotifications, useRealtimeNotifications } from '@/lib/hooks';
import { timeAgo } from '@/lib/status';
import type { NotificationCategory } from '@/lib/types';

const CATEGORY_META: Record<
  NotificationCategory,
  { icon: typeof Bell; color: string; label: string }
> = {
  DEVICE: { icon: Cpu, color: 'text-info bg-info/10', label: 'Device' },
  ALERT: { icon: AlertTriangle, color: 'text-warning bg-warning/10', label: 'Alert' },
  AUTOMATION: { icon: Zap, color: 'text-primary bg-primary/10', label: 'Automation' },
  SYSTEM: { icon: Info, color: 'text-text-muted bg-muted', label: 'System' },
  SECURITY: { icon: ShieldAlert, color: 'text-danger bg-danger/10', label: 'Security' },
};

export function NotificationsPanel() {
  const open = useAppStore((s) => s.notificationsOpen);
  const setOpen = useAppStore((s) => s.setNotificationsOpen);
  const { notifications, markAllRead, markRead } = useNotifications();
  const unread = useUnreadNotifications();
  useRealtimeNotifications();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full sm:w-96 p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b border-border flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <SheetTitle className="text-sm">Notifications</SheetTitle>
            {unread > 0 && (
              <Badge className="bg-danger text-danger-foreground h-5 px-1.5 text-[10px]">
                {unread} unread
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 gap-1"
            onClick={markAllRead}
            disabled={unread === 0}
          >
            <CheckCheck className="size-3" /> Mark all read
          </Button>
        </SheetHeader>
        <SheetDescription className="sr-only">
          In-app notifications across categories
        </SheetDescription>
        <ScrollArea className="flex-1">
          {notifications.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-text-muted">
              <div className="flex flex-col items-center gap-2">
                <Bell className="size-6 text-text-muted/40" />
                <span>You&apos;re all caught up</span>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => {
                const meta =
                  CATEGORY_META[n.category as NotificationCategory] ?? CATEGORY_META.SYSTEM;
                const Icon = meta.icon;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => !n.read && markRead(n.id)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 ${!n.read ? 'bg-accent/20' : ''}`}
                    >
                      <span
                        className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${meta.color}`}
                      >
                        <Icon className="size-3.5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-tight">{n.title}</p>
                          {!n.read && (
                            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-danger" />
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-text-muted line-clamp-2">{n.message}</p>
                        <p className="mt-1 text-[10px] text-text-muted">{timeAgo(n.createdAt)}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
