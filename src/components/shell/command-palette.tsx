'use client'

import * as React from 'react'
import { useAppStore, type ViewKey } from '@/lib/store'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Activity,
  AlertTriangle,
  Bell,
  Cpu,
  Gauge,
  LayoutDashboard,
  Search,
  Settings,
  Terminal,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

interface JumpItem {
  id: string
  label: string
  hint: string
  view: ViewKey
  icon: LucideIcon
}

const JUMPS: JumpItem[] = [
  { id: 'dashboard', label: 'Dashboard', hint: 'Overview', view: 'dashboard', icon: LayoutDashboard },
  { id: 'devices', label: 'Devices', hint: 'Device management', view: 'devices', icon: Cpu },
  { id: 'telemetry', label: 'Telemetry', hint: 'Charts & history', view: 'telemetry', icon: Activity },
  { id: 'analytics', label: 'Analytics', hint: 'Metrics & trends', view: 'analytics', icon: Gauge },
  { id: 'automations', label: 'Automations', hint: 'Visual rule builder', view: 'automations', icon: Zap },
  { id: 'alerts', label: 'Alerts', hint: 'Alert rules & events', view: 'alerts', icon: AlertTriangle },
  { id: 'command-console', label: 'Command Console', hint: 'Send device commands', view: 'command-console', icon: Terminal },
  { id: 'notifications', label: 'Notifications', hint: 'In-app notifications', view: 'notifications', icon: Bell },
  { id: 'activity', label: 'Activity Log', hint: 'Audit trail', view: 'activity', icon: Activity },
  { id: 'settings', label: 'Settings', hint: 'Workspace settings', view: 'settings', icon: Settings },
]

export function CommandPalette() {
  const open = useAppStore((s) => s.commandPaletteOpen)
  const setOpen = useAppStore((s) => s.setCommandPaletteOpen)
  const setView = useAppStore((s) => s.setView)
  const openDevice = useAppStore((s) => s.openDevice)

  const { data } = useQuery({
    queryKey: ['devices', 'palette'],
    queryFn: async () => {
      const r = await fetch('/api/devices')
      const j = await r.json()
      return j.devices as Array<{ id: string; name: string; status: string; location: { name: string } | null }>
    },
    enabled: open,
  })

  function run(item: JumpItem) {
    setView(item.view)
    setOpen(false)
  }

  function openDev(id: string) {
    openDevice(id)
    setOpen(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search devices, jump to a view…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Jump to">
          {JUMPS.map((item) => (
            <CommandItem key={item.id} value={`${item.label} ${item.hint}`} onSelect={() => run(item)}>
              <item.icon className="mr-2 size-4 text-text-muted" />
              <span>{item.label}</span>
              <span className="ml-auto text-[10px] text-text-muted">{item.hint}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        {data && data.length > 0 && (
          <CommandGroup heading="Devices">
            {data.map((d) => (
              <CommandItem key={d.id} value={`device ${d.name} ${d.location?.name ?? ''}`} onSelect={() => openDev(d.id)}>
                <Cpu className="mr-2 size-4 text-text-muted" />
                <span>{d.name}</span>
                <span className="ml-auto text-[10px] text-text-muted">{d.location?.name ?? ''}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
