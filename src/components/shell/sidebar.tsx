'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'
import {
  Activity,
  AlertTriangle,
  Bell,
  ChevronRight,
  Command,
  Cpu,
  Gauge,
  LayoutDashboard,
  type LucideIcon,
  Moon,
  Radio,
  Settings,
  Sun,
  Terminal,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAppStore, type ViewKey } from '@/lib/store'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useUnreadNotifications } from '@/lib/hooks'

// ─── Nexora logo mark ────────────────────────────────────────────────────────
function NexoraMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="2" y="2" width="28" height="28" rx="8" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <path d="M8 20L13 11L16 16L19 9L24 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="22" r="2" fill="currentColor" />
    </svg>
  )
}

// ─── Nav items ───────────────────────────────────────────────────────────────
interface NavItem {
  key: ViewKey
  label: string
  icon: LucideIcon
  group: 'overview' | 'operations' | 'system'
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'overview' },
  { key: 'devices', label: 'Devices', icon: Cpu, group: 'overview' },
  { key: 'telemetry', label: 'Telemetry', icon: Activity, group: 'overview' },
  { key: 'analytics', label: 'Analytics', icon: Gauge, group: 'overview' },
  { key: 'automations', label: 'Automations', icon: Zap, group: 'operations' },
  { key: 'alerts', label: 'Alerts', icon: AlertTriangle, group: 'operations' },
  { key: 'command-console', label: 'Command Console', icon: Terminal, group: 'operations' },
  { key: 'notifications', label: 'Notifications', icon: Bell, group: 'system' },
  { key: 'activity', label: 'Activity Log', icon: Activity, group: 'system' },
  { key: 'settings', label: 'Settings', icon: Settings, group: 'system' },
]

const NAV_GROUPS: { id: NavItem['group']; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'operations', label: 'Operations' },
  { id: 'system', label: 'System' },
]

// ─── Sidebar ─────────────────────────────────────────────────────────────────
export function Sidebar() {
  const view = useAppStore((s) => s.view)
  const setView = useAppStore((s) => s.setView)
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen)

  const content = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2 px-4 border-b border-sidebar-border">
        <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <NexoraMark className="size-5" />
        </span>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">Nexora Pulse</div>
          <div className="text-[10px] text-sidebar-foreground/60">IoT Intelligence</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.id}>
            <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">{group.label}</p>
            <ul className="space-y-0.5">
              {NAV_ITEMS.filter((i) => i.group === group.id).map((item) => {
                const active = view === item.key || (view === 'device-detail' && item.key === 'devices')
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => setView(item.key)}
                      className={cn(
                        'group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                        active ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                      )}
                    >
                      <item.icon className={cn('size-4 shrink-0', active && 'text-sidebar-primary')} />
                      <span className="truncate">{item.label}</span>
                      {item.key === 'alerts' && <SidebarAlertBadge />}
                      {item.key === 'notifications' && <SidebarNotifBadge />}
                      {active && <ChevronRight className="ml-auto size-3.5 text-sidebar-foreground/40" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer: org + theme */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 bg-sidebar-accent/40">
          <div className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-[10px] font-bold text-sidebar-primary-foreground">NH</div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium truncate">Nexora HQ</div>
            <div className="text-[10px] text-sidebar-foreground/50 truncate">PRO plan</div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-60 shrink-0 border-r border-border h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    </>
  )
}

function SidebarAlertBadge() {
  // Hook must be called unconditionally; this component is rendered only inside the alerts nav row.
  const { activeCount } = useAlertCount()
  if (activeCount === 0) return null
  return (
    <Badge variant="destructive" className="ml-auto h-4 px-1 text-[9px] tabular-nums">
      {activeCount}
    </Badge>
  )
}

function SidebarNotifBadge() {
  const unread = useUnreadNotifications()
  if (unread === 0) return null
  return (
    <Badge className="ml-auto h-4 px-1 text-[9px] tabular-nums bg-accent text-accent-foreground">
      {unread}
    </Badge>
  )
}

// Tiny inline hook to fetch active alert count without polluting global state.
function useAlertCount() {
  const [activeCount, setActiveCount] = React.useState(0)
  React.useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const r = await fetch('/api/alerts?status=TRIGGERED')
        const j = await r.json()
        if (!cancelled) setActiveCount(j.events?.length ?? 0)
      } catch {}
    }
    load()
    const t = setInterval(load, 15000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])
  return { activeCount }
}
