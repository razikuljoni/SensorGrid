'use client'

import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRealtimeSocket } from '@/lib/realtime'
import type { ServerSocketEvent, NotificationDTO, DeviceDTO } from '@/lib/types'

// ─── Query keys ──────────────────────────────────────────────────────────────
export const qk = {
  dashboard: ['dashboard'] as const,
  devices: ['devices'] as const,
  device: (id: string) => ['devices', id] as const,
  deviceTelemetry: (id: string, sensorKey: string | null, range: string) => ['devices', id, 'telemetry', sensorKey ?? 'all', range] as const,
  deviceTwin: (id: string) => ['devices', id, 'twin'] as const,
  deviceCommands: (id: string) => ['devices', id, 'commands'] as const,
  deviceHistory: (id: string) => ['devices', id, 'history'] as const,
  automations: ['automations'] as const,
  automation: (id: string) => ['automations', id] as const,
  alerts: (status?: string) => ['alerts', status ?? 'all'] as const,
  notifications: (unread?: boolean) => ['notifications', unread ? 'unread' : 'all'] as const,
  audit: (limit: number) => ['audit', limit] as const,
  analytics: (range: string) => ['analytics', range] as const,
  org: ['org'] as const,
  locations: ['locations'] as const,
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export function useDashboard() {
  return useQuery({
    queryKey: qk.dashboard,
    queryFn: async () => {
      const r = await fetch('/api/dashboard')
      if (!r.ok) throw new Error('Failed to load dashboard')
      return r.json()
    },
    refetchInterval: 10000,
  })
}

// ─── Devices ─────────────────────────────────────────────────────────────────
export function useDevices(status?: string, q?: string) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (q) params.set('q', q)
  return useQuery({
    queryKey: ['devices', status ?? 'all', q ?? ''],
    queryFn: async () => {
      const r = await fetch(`/api/devices${params.size ? `?${params}` : ''}`)
      const j = await r.json()
      return j.devices as DeviceDTO[]
    },
  })
}

export function useDevice(deviceId: string | null) {
  return useQuery({
    queryKey: deviceId ? qk.device(deviceId) : ['devices', null],
    queryFn: async () => {
      if (!deviceId) return null
      const r = await fetch(`/api/devices/${deviceId}`)
      if (!r.ok) return null
      const j = await r.json()
      return j as DeviceDTO
    },
    enabled: !!deviceId,
    refetchInterval: 5000,
  })
}

export function useDeviceTelemetry(deviceId: string | null, sensorKey: string | null, range: string) {
  return useQuery({
    queryKey: deviceId ? qk.deviceTelemetry(deviceId, sensorKey, range) : ['telemetry', null],
    queryFn: async () => {
      if (!deviceId) return { series: [] }
      const params = new URLSearchParams({ range })
      if (sensorKey) params.set('sensorKey', sensorKey)
      const r = await fetch(`/api/devices/${deviceId}/telemetry?${params}`)
      const j = await r.json()
      return j
    },
    enabled: !!deviceId,
    refetchInterval: 5000,
  })
}

export function useDeviceCommands(deviceId: string | null) {
  return useQuery({
    queryKey: deviceId ? qk.deviceCommands(deviceId) : ['commands', null],
    queryFn: async () => {
      if (!deviceId) return { commands: [] }
      const r = await fetch(`/api/devices/${deviceId}/commands`)
      const j = await r.json()
      return j.commands
    },
    enabled: !!deviceId,
    refetchInterval: 5000,
  })
}

export function useDeviceHistory(deviceId: string | null) {
  return useQuery({
    queryKey: deviceId ? qk.deviceHistory(deviceId) : ['history', null],
    queryFn: async () => {
      if (!deviceId) return { commands: [], audits: [] }
      const r = await fetch(`/api/devices/${deviceId}/history`)
      const j = await r.json()
      return j
    },
    enabled: !!deviceId,
  })
}

// ─── Automations ─────────────────────────────────────────────────────────────
export function useAutomations() {
  return useQuery({
    queryKey: qk.automations,
    queryFn: async () => {
      const r = await fetch('/api/automations')
      const j = await r.json()
      return j.automations
    },
  })
}

// ─── Alerts ──────────────────────────────────────────────────────────────────
export function useAlerts(status?: string) {
  return useQuery({
    queryKey: qk.alerts(status),
    queryFn: async () => {
      const params = status ? `?status=${status}` : ''
      const r = await fetch(`/api/alerts${params}`)
      const j = await r.json()
      return j
    },
    refetchInterval: 8000,
  })
}

// ─── Notifications ───────────────────────────────────────────────────────────
export function useNotifications() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: qk.notifications(),
    queryFn: async () => {
      const r = await fetch('/api/notifications')
      const j = await r.json()
      return j.notifications as NotificationDTO[]
    },
    refetchInterval: 20000,
  })

  const markAllRead = React.useCallback(async () => {
    await fetch('/api/notifications', { method: 'PATCH' })
    qc.invalidateQueries({ queryKey: qk.notifications() })
  }, [qc])

  const markRead = React.useCallback(async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    qc.invalidateQueries({ queryKey: qk.notifications() })
  }, [qc])

  return { notifications: query.data ?? [], ...query, markAllRead, markRead }
}

export function useUnreadNotifications() {
  const { data } = useQuery({
    queryKey: qk.notifications(true),
    queryFn: async () => {
      const r = await fetch('/api/notifications?unread=true')
      const j = await r.json()
      return j.notifications as NotificationDTO[]
    },
    refetchInterval: 15000,
  })
  return data?.length ?? 0
}

// ─── Audit log ───────────────────────────────────────────────────────────────
export function useAuditLog(limit = 100, action?: string) {
  const params = new URLSearchParams({ limit: String(limit) })
  if (action) params.set('action', action)
  return useQuery({
    queryKey: qk.audit(limit),
    queryFn: async () => {
      const r = await fetch(`/api/audit?${params}`)
      const j = await r.json()
      return j.logs
    },
    refetchInterval: 8000,
  })
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export function useAnalytics(range: string) {
  return useQuery({
    queryKey: qk.analytics(range),
    queryFn: async () => {
      const r = await fetch(`/api/analytics?range=${range}`)
      return r.json()
    },
    refetchInterval: 30000,
  })
}

// ─── Org + Locations ─────────────────────────────────────────────────────────
export function useOrg() {
  return useQuery({
    queryKey: qk.org,
    queryFn: async () => {
      const r = await fetch('/api/org')
      return r.json()
    },
  })
}

export function useLocations() {
  return useQuery({
    queryKey: qk.locations,
    queryFn: async () => {
      const r = await fetch('/api/locations')
      const j = await r.json()
      return j.locations
    },
  })
}

// ─── Realtime subscription that invalidates queries on events ────────────────
export function useRealtimeNotifications() {
  const qc = useQueryClient()
  useRealtimeSocket((event) => {
    switch (event.type) {
      case 'device.telemetry':
        qc.invalidateQueries({ queryKey: qk.dashboard })
        if (event.deviceId) {
          qc.invalidateQueries({ queryKey: qk.device(event.deviceId) })
          qc.invalidateQueries({ queryKey: ['devices', event.deviceId, 'telemetry'] })
        }
        break
      case 'device.online':
      case 'device.offline':
      case 'device.state':
        qc.invalidateQueries({ queryKey: ['devices'] })
        if (event.deviceId) qc.invalidateQueries({ queryKey: qk.device(event.deviceId) })
        qc.invalidateQueries({ queryKey: qk.dashboard })
        break
      case 'command.created':
      case 'command.updated':
        if ('command' in event && event.command?.deviceId) {
          qc.invalidateQueries({ queryKey: qk.deviceCommands(event.command.deviceId) })
          qc.invalidateQueries({ queryKey: qk.deviceHistory(event.command.deviceId) })
        }
        break
      case 'automation.started':
      case 'automation.completed':
        qc.invalidateQueries({ queryKey: qk.automations })
        qc.invalidateQueries({ queryKey: qk.dashboard })
        break
      case 'alert.triggered':
      case 'alert.acknowledged':
      case 'alert.resolved':
        qc.invalidateQueries({ queryKey: ['alerts'] })
        qc.invalidateQueries({ queryKey: qk.dashboard })
        break
      case 'notification.created':
        qc.invalidateQueries({ queryKey: qk.notifications() })
        qc.invalidateQueries({ queryKey: qk.notifications(true) })
        break
      case 'activity':
        qc.invalidateQueries({ queryKey: qk.audit(100) })
        qc.invalidateQueries({ queryKey: qk.dashboard })
        break
    }
  })
}
