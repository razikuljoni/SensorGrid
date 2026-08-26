'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Bell,
  ChevronDown,
  Menu,
  Moon,
  Search,
  Sun,
  Command as CommandIcon,
  type LucideIcon,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAppStore } from '@/lib/store'
import { timeAgo } from '@/lib/status'
import type { NotificationDTO } from '@/lib/types'
import { useUnreadNotifications } from '@/lib/hooks'
import { CommandPalette } from '@/components/shell/command-palette'
import { NotificationsPanel } from '@/components/shell/notifications-panel'

const VIEW_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Realtime overview of your connected environment' },
  devices: { title: 'Devices', subtitle: 'Register, manage, and inspect your connected devices' },
  'device-detail': { title: 'Device Detail', subtitle: 'Live telemetry, controls, twin, and history' },
  telemetry: { title: 'Telemetry Explorer', subtitle: 'Live and historical sensor data across devices' },
  analytics: { title: 'Analytics', subtitle: 'Aggregated metrics and trends across your fleet' },
  automations: { title: 'Automations', subtitle: 'Visual workflows that connect telemetry to actions' },
  alerts: { title: 'Alerts', subtitle: 'Alert rules and active alert events' },
  'command-console': { title: 'Command Console', subtitle: 'Send and inspect device commands' },
  notifications: { title: 'Notifications', subtitle: 'In-app notifications across categories' },
  activity: { title: 'Activity Log', subtitle: 'Audit trail of every important action' },
  settings: { title: 'Settings', subtitle: 'Workspace, members, and integrations' },
  about: { title: 'About Nexora Pulse', subtitle: 'Connect. Observe. Automate.' },
}

export function Header() {
  const { theme, setTheme } = useTheme()
  const view = useAppStore((s) => s.view)
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen)
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen)
  const setView = useAppStore((s) => s.setView)
  const setNotificationsOpen = useAppStore((s) => s.setNotificationsOpen)
  const unread = useUnreadNotifications()

  const meta = VIEW_TITLES[view] ?? VIEW_TITLES.dashboard

  // Cmd+K shortcut
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setCommandPaletteOpen])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Mobile menu */}
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
        <Menu className="size-4" />
      </Button>

      {/* Title */}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold tracking-tight">{meta.title}</h1>
        <p className="truncate text-xs text-text-muted">{meta.subtitle}</p>
      </div>

      {/* Search */}
      <Button variant="outline" className="hidden md:flex w-64 justify-start gap-2 text-text-muted" onClick={() => setCommandPaletteOpen(true)}>
        <Search className="size-3.5" />
        <span className="text-xs">Search or jump to…</span>
        <kbd className="ml-auto inline-flex h-5 items-center gap-0.5 rounded border border-border bg-muted px-1 text-[9px] font-mono">
          <CommandIcon className="size-2.5" />K
        </kbd>
      </Button>

      {/* Theme toggle */}
      <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
        <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="relative" onClick={() => setNotificationsOpen(true)} aria-label="Open notifications">
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 size-2 rounded-full bg-danger ring-2 ring-background" />
        )}
      </Button>

      {/* User */}
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-muted" aria-label="User menu">
            <Avatar className="size-7">
              <AvatarImage src="" alt="Pulse Operator" />
              <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-medium">PO</AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left leading-tight">
              <div className="text-xs font-medium">Pulse Operator</div>
              <div className="text-[10px] text-text-muted">OWNER</div>
            </div>
            <ChevronDown className="hidden md:block size-3 text-text-muted" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56 p-2">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">Pulse Operator</p>
            <p className="text-xs text-text-muted truncate">pulse@nexora.dev</p>
          </div>
          <Separator className="my-1" />
          <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted" onClick={() => setView('settings')}>
            <Avatar className="size-6">
              <AvatarFallback className="bg-primary/10 text-primary text-[9px]">NH</AvatarFallback>
            </Avatar>
            Nexora HQ
            <Badge variant="outline" className="ml-auto text-[9px]">PRO</Badge>
          </button>
          <Separator className="my-1" />
          <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted" onClick={() => setView('settings')}>
            <Avatar className="size-6"><AvatarFallback className="text-[9px]">P</AvatarFallback></Avatar>
            Profile & Settings
          </button>
          <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted" onClick={() => setView('about')}>
            <Avatar className="size-6"><AvatarFallback className="text-[9px]">i</AvatarFallback></Avatar>
            About Nexora Pulse
          </button>
        </PopoverContent>
      </Popover>

      <CommandPalette />
      <NotificationsPanel />
    </header>
  )
}
