'use client';

import { create } from 'zustand';

export type ViewKey =
  | 'dashboard'
  | 'devices'
  | 'device-detail'
  | 'telemetry'
  | 'analytics'
  | 'automations'
  | 'alerts'
  | 'command-console'
  | 'notifications'
  | 'activity'
  | 'settings'
  | 'about';

interface AppState {
  // Navigation — single-page view switcher (user can only see /)
  view: ViewKey;
  selectedDeviceId: string | null;
  selectedAutomationId: string | null;
  commandPaletteOpen: boolean;
  notificationsOpen: boolean;
  // Sidebar collapse (mobile)
  sidebarOpen: boolean;

  setView: (view: ViewKey) => void;
  openDevice: (deviceId: string) => void;
  openAutomation: (id: string | null) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setNotificationsOpen: (open: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: 'dashboard',
  selectedDeviceId: null,
  selectedAutomationId: null,
  commandPaletteOpen: false,
  notificationsOpen: false,
  sidebarOpen: false,

  setView: (view) =>
    set({
      view,
      selectedDeviceId: view === 'device-detail' ? undefined : null,
      sidebarOpen: false,
    }),
  openDevice: (deviceId) =>
    set({ view: 'device-detail', selectedDeviceId: deviceId, sidebarOpen: false }),
  openAutomation: (id) => set({ selectedAutomationId: id }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setNotificationsOpen: (open) => set({ notificationsOpen: open }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
