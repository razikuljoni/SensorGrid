'use client'

import * as React from 'react'
import { useAppStore } from '@/lib/store'
import { Sidebar } from '@/components/shell/sidebar'
import { Header } from '@/components/shell/header'
import { Footer } from '@/components/shell/footer'
import DashboardView from '@/components/views/dashboard-view'
import { DevicesView } from '@/components/views/devices-view'
import { DeviceDetailView } from '@/components/views/device-detail-view'
import TelemetryView from '@/components/views/telemetry-view'
import AnalyticsView from '@/components/views/analytics-view'
import { AutomationsView } from '@/components/views/automations-view'
import { AlertsView } from '@/components/views/alerts-view'
import CommandConsoleView from '@/components/views/command-console-view'
import { NotificationsView } from '@/components/views/notifications-view'
import { ActivityView } from '@/components/views/activity-view'
import { SettingsView } from '@/components/views/settings-view'
import { AboutView } from '@/components/views/about-view'
import { useRealtimeNotifications } from '@/lib/hooks'

function ViewRouter() {
  const view = useAppStore((s) => s.view)
  switch (view) {
    case 'dashboard': return <DashboardView />
    case 'devices': return <DevicesView />
    case 'device-detail': return <DeviceDetailView />
    case 'telemetry': return <TelemetryView />
    case 'analytics': return <AnalyticsView />
    case 'automations': return <AutomationsView />
    case 'alerts': return <AlertsView />
    case 'command-console': return <CommandConsoleView />
    case 'notifications': return <NotificationsView />
    case 'activity': return <ActivityView />
    case 'settings': return <SettingsView />
    case 'about': return <AboutView />
    default: return <DashboardView />
  }
}

export default function Home() {
  // Subscribe once at the top-level so every view benefits from realtime
  // query invalidation (telemetry, alerts, notifications, audit, etc.).
  useRealtimeNotifications()

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 min-w-0">
          <ViewRouter />
        </main>
        <Footer />
      </div>
    </div>
  )
}
