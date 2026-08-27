'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle, Bell, CheckCheck, Cpu, Info, ShieldAlert, Zap, type LucideIcon } from 'lucide-react'
import { useNotifications, useRealtimeNotifications } from '@/lib/hooks'
import { timeAgo, formatTime } from '@/lib/status'
import type { NotificationCategory } from '@/lib/types'

const CATEGORY_META: Record<NotificationCategory, { icon: LucideIcon; color: string; label: string }> = {
  DEVICE: { icon: Cpu, color: 'text-info bg-info/10', label: 'Device' },
  ALERT: { icon: AlertTriangle, color: 'text-warning bg-warning/10', label: 'Alert' },
  AUTOMATION: { icon: Zap, color: 'text-primary bg-primary/10', label: 'Automation' },
  SYSTEM: { icon: Info, color: 'text-text-muted bg-muted', label: 'System' },
  SECURITY: { icon: ShieldAlert, color: 'text-danger bg-danger/10', label: 'Security' },
}

export function NotificationsView() {
  useRealtimeNotifications()
  const { notifications, markAllRead, markRead, isLoading } = useNotifications()
  const [filter, setFilter] = React.useState<'all' | NotificationCategory>('all')

  const filtered = filter === 'all' ? notifications : notifications.filter((n) => n.category === filter)
  const unreadCount = notifications.filter((n) => !n.read).length

  const categories: Array<'all' | NotificationCategory> = ['all', 'DEVICE', 'ALERT', 'AUTOMATION', 'SYSTEM', 'SECURITY']

  return (
    <div className="flex min-h-screen flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <Card className="flex-1 flex flex-col min-h-0 mx-auto w-full max-w-4xl">
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="size-4" />
              Notifications
              {unreadCount > 0 && <Badge className="bg-danger text-danger-foreground h-5 px-1.5 text-[10px]">{unreadCount} unread</Badge>}
            </CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCheck className="size-3" /> Mark all read
          </Button>
        </CardHeader>

        <div className="flex flex-wrap gap-1.5 p-3 border-b border-border">
          {categories.map((c) => (
            <Button
              key={c}
              variant={filter === c ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs capitalize"
              onClick={() => setFilter(c)}
            >
              {c === 'all' ? 'All' : c.charAt(0) + c.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>

        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-280px)] min-h-96">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex h-48 items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-text-muted">
                  <Bell className="size-6 text-text-muted/40" />
                  <span className="text-sm">No notifications</span>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map((n) => {
                  const meta = CATEGORY_META[n.category as NotificationCategory] ?? CATEGORY_META.SYSTEM
                  const Icon = meta.icon
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => !n.read && markRead(n.id)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 ${!n.read ? 'bg-accent/20' : ''}`}
                      >
                        <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${meta.color}`}>
                          <Icon className="size-4" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium leading-tight">{n.title}</p>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="outline" className="text-[9px] h-4 px-1">{meta.label}</Badge>
                              {!n.read && <span className="size-1.5 rounded-full bg-danger" />}
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-text-muted">{n.message}</p>
                          <p className="mt-1 text-[10px] text-text-muted" title={formatTime(n.createdAt)}>{timeAgo(n.createdAt)}</p>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
