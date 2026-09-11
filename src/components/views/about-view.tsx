'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Cpu, Gauge, Layers, Radio, Terminal, Zap } from 'lucide-react'

const STACK = [
  { group: 'Frontend', items: ['Next.js 16', 'React 19', 'TypeScript 5', 'Tailwind CSS 4', 'shadcn/ui', 'TanStack Query', 'Zustand', 'Recharts', '@xyflow/react', 'Framer Motion'] },
  { group: 'Backend', items: ['Next.js API Routes', 'Prisma ORM', 'PostgreSQL', 'Zod', 'Server-Sent Events'] },
  { group: 'Realtime', items: ['SSE in-app engine', 'Telemetry simulator', 'Automation engine', 'Alert evaluator'] },
  { group: 'Design', items: ['Aether Grid design system', 'Deep indigo primary', 'Electric cyan accent', 'Soft violet secondary', 'Dark + light themes'] },
]

const FEATURES = [
  { icon: Cpu, title: 'Device Management', desc: 'Register ESP32, RPi, Arduino, and generic devices. Per-device credentials, firmware, signal & battery tracking.' },
  { icon: Activity, title: 'Realtime Telemetry', desc: 'Live sensor streams over socket.io. Temperature, humidity, pressure, CO₂, light, and more.' },
  { icon: Zap, title: 'Automation Engine', desc: 'Visual React Flow rule builder with trigger → condition → action nodes. Deterministic, versioned, audited.' },
  { icon: Gauge, title: 'Analytics', desc: 'Time-range aggregation with downsampling. Per-device volume, hourly trends, alert frequency.' },
  { icon: Layers, title: 'Digital Twin', desc: 'Desired vs reported state reconciliation. Every command flows through the twin before reaching the device.' },
  { icon: Terminal, title: 'Command Console', desc: 'Developer-focused JSON command editor with payload presets, validation, and live ack/response viewer.' },
  { icon: Radio, title: 'Alert Engine', desc: 'Threshold, offline, and battery rules with cooldowns. Full lifecycle: triggered → acknowledged → resolved.' },
  { icon: Activity, title: 'Audit Log', desc: 'Every important action is recorded with actor, target, metadata, and timestamp.' },
]

export function AboutView() {
  return (
    <div className="flex min-h-screen flex-col gap-4 p-4 sm:gap-6 sm:p-6 max-w-5xl">
      {/* Hero */}
      <Card className="relative overflow-hidden">
        <div className="aether-glow absolute inset-0 opacity-60" style={{ ['--glow-x' as string]: '20%', ['--glow-y' as string]: '0%' }} />
        <CardContent className="relative p-8 sm:p-10">
          <div className="flex items-start gap-4">
            <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Radio className="size-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">SensorGrid</h1>
              <p className="text-sm text-text-muted mt-1">Connect. Observe. Automate.</p>
              <p className="text-sm mt-3 max-w-2xl">
                A production-grade IoT device intelligence & automation platform. Connect physical devices,
                receive realtime sensor telemetry, visualize historical data, control devices remotely,
                and create automation workflows — all from one calm, data-first dashboard.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">v1.0.0 MVP</Badge>
            <Badge variant="outline" className="text-xs">Aether Grid Design System</Badge>
            <Badge variant="outline" className="text-xs">Realtime</Badge>
            <Badge variant="outline" className="text-xs">Multi-tenant ready</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <section>
        <h2 className="text-base font-semibold mb-3">Platform capabilities</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-accent/30 text-accent-foreground shrink-0">
                    <f.icon className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{f.title}</p>
                    <p className="text-xs text-text-muted mt-0.5">{f.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Stack */}
      <section>
        <h2 className="text-base font-semibold mb-3">Technology stack</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {STACK.map((s) => (
            <Card key={s.group}>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">{s.group}</p>
                <div className="flex flex-wrap gap-1.5">
                  {s.items.map((item) => (
                    <Badge key={item} variant="outline" className="text-[10px] font-mono">{item}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Architecture note */}
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-2">Architecture note</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            This sandbox deployment adapts the full SensorGrid architecture (which targets NestJS,
            PostgreSQL+TimescaleDB, Redis+BullMQ, MQTT broker, Docker) into a single Next.js application
            backed by SQLite + Prisma and an in-process socket.io mini-service that simulates the MQTT
            gateway, telemetry ingestion, automation engine, and alert evaluator. The data model, API
            surface, and design system are production-shaped so the same code can be lifted onto the
            intended infrastructure with minimal changes. See the <code className="font-mono text-text-secondary">README.md</code> for full details.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
