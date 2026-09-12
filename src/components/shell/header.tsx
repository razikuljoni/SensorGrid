'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  User,
  Info,
  Command as CommandIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { CommandPalette } from '@/components/shell/command-palette';
import { NotificationsPanel } from '@/components/shell/notifications-panel';
import { useUnreadNotifications } from '@/lib/hooks';

const VIEW_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Realtime overview of your connected environment' },
  devices: { title: 'Devices', subtitle: 'Register, manage, and inspect your connected devices' },
  'device-detail': {
    title: 'Device Detail',
    subtitle: 'Live telemetry, controls, twin, and history',
  },
  telemetry: {
    title: 'Telemetry Explorer',
    subtitle: 'Live and historical sensor data across devices',
  },
  analytics: { title: 'Analytics', subtitle: 'Aggregated metrics and trends across your fleet' },
  automations: {
    title: 'Automations',
    subtitle: 'Visual workflows that connect telemetry to actions',
  },
  alerts: { title: 'Alerts', subtitle: 'Alert rules and active alert events' },
  'command-console': { title: 'Command Console', subtitle: 'Send and inspect device commands' },
  notifications: { title: 'Notifications', subtitle: 'In-app notifications across categories' },
  activity: { title: 'Activity Log', subtitle: 'Audit trail of every important action' },
  settings: { title: 'Settings', subtitle: 'Workspace, members, and integrations' },
  about: { title: 'About SensorGrid', subtitle: 'Connect. Observe. Automate.' },
};

export function Header() {
  const { theme, setTheme } = useTheme();
  const view = useAppStore((s) => s.view);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen);
  const setView = useAppStore((s) => s.setView);
  const setNotificationsOpen = useAppStore((s) => s.setNotificationsOpen);
  const unread = useUnreadNotifications();
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  const meta = VIEW_TITLES[view] ?? VIEW_TITLES.dashboard;

  // Cmd+K shortcut
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setCommandPaletteOpen]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    toast.success('Signed out', {
      description: 'You have been logged out of SensorGrid.',
    });
    // Reset to dashboard view
    setView('dashboard');
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center gap-2 sm:gap-3 border-b border-border bg-background/80 px-3 sm:px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Mobile menu */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden shrink-0"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="size-4" />
      </Button>

      {/* Title */}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm sm:text-base font-semibold tracking-tight">{meta.title}</h1>
        <p className="hidden sm:block truncate text-xs text-text-muted">{meta.subtitle}</p>
      </div>

      {/* Search */}
      <Button
        variant="outline"
        className="hidden lg:flex w-56 xl:w-64 justify-start gap-2 text-text-muted shrink-0"
        onClick={() => setCommandPaletteOpen(true)}
      >
        <Search className="size-3.5" />
        <span className="text-xs">Search or jump to…</span>
        <kbd className="ml-auto inline-flex h-5 items-center gap-0.5 rounded border border-border bg-muted px-1 text-[9px] font-mono">
          <CommandIcon className="size-2.5" />K
        </kbd>
      </Button>

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label="Toggle theme"
      >
        <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>

      {/* Notifications */}
      <Button
        variant="ghost"
        size="icon"
        className="relative shrink-0"
        onClick={() => setNotificationsOpen(true)}
        aria-label="Open notifications"
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 size-2 rounded-full bg-danger ring-2 ring-background" />
        )}
      </Button>

      {/* User menu */}
      <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
        <PopoverTrigger asChild>
          <button
            className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-muted shrink-0"
            aria-label="User menu"
          >
            <Avatar className="size-7">
              <AvatarImage src="" alt="SensorGrid Operator" />
              <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-medium">
                PO
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left leading-tight">
              <div className="text-xs font-medium">SensorGrid Operator</div>
              <div className="text-[10px] text-text-muted">OWNER</div>
            </div>
            <ChevronDown className="hidden md:block size-3 text-text-muted" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-60 p-2">
          {/* User identity */}
          <div className="flex items-center gap-3 px-1 py-2">
            <Avatar className="size-10">
              <AvatarImage src="" alt="SensorGrid Operator" />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                PO
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">SensorGrid Operator</p>
              <p className="text-xs text-text-muted truncate">operator@sensorgrid.dev</p>
            </div>
          </div>

          <Separator className="my-1" />

          {/* Organization switcher (display only) */}
          <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted cursor-default">
            <div className="flex size-6 items-center justify-center rounded-md bg-sidebar-primary text-[10px] font-bold text-sidebar-primary-foreground">
              NH
            </div>
            <span className="text-sm flex-1 truncate">SensorGrid HQ</span>
            <Badge variant="outline" className="text-[9px]">
              PRO
            </Badge>
          </div>

          <Separator className="my-1" />

          {/* Menu items */}
          <button
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
            onClick={() => {
              setView('settings');
              setUserMenuOpen(false);
            }}
          >
            <User className="size-3.5 text-text-muted" />
            Profile & Settings
          </button>
          <button
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
            onClick={() => {
              setView('about');
              setUserMenuOpen(false);
            }}
          >
            <Info className="size-3.5 text-text-muted" />
            About SensorGrid
          </button>

          <Separator className="my-1" />

          {/* Logout */}
          <button
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-danger hover:bg-danger/10 transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="size-3.5" />
            Log out
          </button>
        </PopoverContent>
      </Popover>

      <CommandPalette />
      <NotificationsPanel />
    </header>
  );
}
