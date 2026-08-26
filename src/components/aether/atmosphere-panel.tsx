'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Droplets, Gauge, Lightbulb, Thermometer, Wind } from 'lucide-react'
import type { EnvironmentSnapshotDTO } from '@/lib/types'
import { TelemetryTile } from './telemetry-tile'

// ─── AtmospherePanel ─────────────────────────────────────────────────────────
// Large environmental dashboard panel combining temperature, humidity, pressure,
// air quality (CO2), and light. Features an ambient glow that responds to values.

export interface AtmospherePanelProps {
  snapshot: EnvironmentSnapshotDTO | null
  className?: string
}

export function AtmospherePanel({ snapshot, className }: AtmospherePanelProps) {
  const temp = snapshot?.temperature ?? null
  const humidity = snapshot?.humidity ?? null
  const pressure = snapshot?.pressure ?? null
  const light = snapshot?.light ?? null
  const co2 = snapshot?.co2 ?? null

  // Ambient glow position shifts with temperature (warmer → moves right/up)
  const glowX = temp !== null ? Math.min(95, Math.max(5, ((temp + 10) / 50) * 100)) : 30
  const glowY = humidity !== null ? Math.min(95, Math.max(5, 100 - humidity)) : 70

  // Warm color shift on high temperature
  const hotTemp = temp !== null && temp > 28
  const coldTemp = temp !== null && temp < 18

  return (
    <div className={cn('aether-glow relative overflow-hidden rounded-2xl border border-border bg-surface-elevated p-5', className)} style={{ ['--glow-x' as string]: `${glowX}%`, ['--glow-y' as string]: `${glowY}%` }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">Environment Overview</h3>
          <p className="text-xs text-text-muted mt-0.5">
            {snapshot?.sourceDeviceName ? `Live from ${snapshot.sourceDeviceName}` : 'Awaiting telemetry'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
          <span className="size-1.5 rounded-full bg-success animate-pulse" />
          <span>LIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <TelemetryTile
          sensorKey="temperature"
          label="Temperature"
          value={temp}
          unit="°C"
          timestamp={snapshot?.updatedAt ?? null}
          icon={Thermometer}
          className={cn(hotTemp && 'border-danger/40', coldTemp && 'border-info/40')}
        />
        <TelemetryTile
          sensorKey="humidity"
          label="Humidity"
          value={humidity}
          unit="%"
          timestamp={snapshot?.updatedAt ?? null}
          icon={Droplets}
        />
        <TelemetryTile
          sensorKey="pressure"
          label="Pressure"
          value={pressure}
          unit="hPa"
          timestamp={snapshot?.updatedAt ?? null}
          icon={Gauge}
        />
        <TelemetryTile
          sensorKey="co2"
          label="Air Quality (CO₂)"
          value={co2}
          unit="ppm"
          timestamp={snapshot?.updatedAt ?? null}
          icon={Wind}
        />
        <TelemetryTile
          sensorKey="light"
          label="Light"
          value={light}
          unit="lux"
          timestamp={snapshot?.updatedAt ?? null}
          icon={Lightbulb}
        />
      </div>
    </div>
  )
}
