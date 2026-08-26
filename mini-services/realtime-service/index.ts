// Nexora Pulse — Realtime Service (socket.io)
//
// This mini-service is the "pulse" of the platform. In the spec's monorepo
// architecture it would be split into `apps/mqtt-gateway` + `apps/worker`.
// Here it is collapsed into a single Bun process that:
//
//   1. Acts as the MQTT gateway equivalent — periodically publishes simulated
//      telemetry for every online device (ESP32 simulator equivalent).
//   2. Persists telemetry into PostgreSQL/SQLite (Telemetry + TelemetryAggregate).
//   3. Broadcasts realtime events to all connected browser clients via socket.io.
//   4. Evaluates AlertRules against fresh telemetry and creates AlertEvents.
//   5. Evaluates Automations (trigger: telemetry) and executes their action
//      nodes (send_command, notify), logging an AutomationExecution + AuditLog.
//   6. Updates each Device's lastSeen, lastHeartbeat, battery drift, and
//      recomputes DeviceHealth periodically.
//   7. Honors device command requests forwarded by browser clients through the
//      Next.js API; in this simulator commands complete after a short delay.
//
// The service runs on port 3030 and is reached by the browser through the
// Caddy gateway using `?XTransformPort=3030`.

import { createServer } from 'http'
import { Server } from 'socket.io'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient({ log: ['error'] })
const PORT = 3003 // local listen port; Caddy maps ?XTransformPort=3003 -> this port
const ORG_ID = 'org-nexora-hq'
const ORG_SLUG = 'nexora-hq'

const io = new Server(
  createServer(),
  {
    path: '/',
    cors: { origin: '*', methods: ['GET', 'POST'] },
    pingTimeout: 60000,
    pingInterval: 25000,
  }
)

// ─── Types (mirrors src/lib/types.ts — kept inline to avoid cross-project import) ─
type TelemetryQuality = 'GOOD' | 'ESTIMATED' | 'INVALID' | 'MISSING'

interface SimDevice {
  id: string
  name: string
  status: string
  sensors: Array<{ key: string; unit: string; base: number; amplitude: number; period: number; min?: number; max?: number; boolean?: boolean }>
  baseSignal: number
  baseBattery: number | null
  driftBattery: number // % per hour
}

// ─── Telemetry simulator state ──────────────────────────────────────────────
// For each online device, we maintain sensor base values and a per-device
// phase so traces look organic. Values drift with a slow daily sine + noise.
const simDevices = new Map<string, SimDevice>()

async function loadDevices() {
  const devices = await db.device.findMany({
    where: { organizationId: ORG_ID },
    include: { sensors: true },
  })
  simDevices.clear()
  for (const d of devices) {
    if (d.status === 'OFFLINE' || d.status === 'MAINTENANCE') continue
    const sensors = d.sensors
      .filter((s) => s.dataType === 'number')
      .map((s) => {
        const base =
          s.key === 'temperature' ? 24 :
          s.key === 'humidity' ? 55 :
          s.key === 'pressure' ? 1013 :
          s.key === 'light' ? 350 :
          s.key === 'co2' ? 600 :
          s.key === 'soil' ? 45 :
          s.key === 'voltage' ? 230 :
          s.key === 'current' ? 2.4 :
          s.key === 'power' ? 140 :
          0
        const amplitude =
          s.key === 'temperature' ? 5 :
          s.key === 'humidity' ? 15 :
          s.key === 'pressure' ? 4 :
          s.key === 'light' ? 200 :
          s.key === 'co2' ? 150 :
          s.key === 'soil' ? 10 :
          s.key === 'voltage' ? 2 :
          s.key === 'current' ? 0.6 :
          s.key === 'power' ? 30 :
          1
        return {
          key: s.key,
          unit: s.unit,
          base,
          amplitude,
          period: s.key === 'light' ? 24 : 12, // hours
          min: s.min ?? undefined,
          max: s.max ?? undefined,
        }
      })
    simDevices.set(d.id, {
      id: d.id,
      name: d.name,
      status: d.status,
      sensors,
      baseSignal: d.signal ?? -60,
      baseBattery: d.battery,
      driftBattery: d.type === 'ESP32' && d.battery !== null ? 0.4 : 0,
    })
  }
  console.log(`[realtime] loaded ${simDevices.size} simulated devices`)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function safeParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback
  try { return JSON.parse(json) as T } catch { return fallback }
}

function nowISO() { return new Date().toISOString() }

function broadcast(event: { type: string } & Record<string, unknown>) {
  io.emit('event', event)
}

async function audit(action: string, targetType: string, targetName: string, metadata: Record<string, unknown> = {}) {
  const log = await db.auditLog.create({
    data: {
      organizationId: ORG_ID,
      actorName: 'Realtime Engine',
      action,
      targetType,
      targetName,
      metadata: JSON.stringify(metadata),
    },
  })
  broadcast({ type: 'activity', log: { ...log, createdAt: log.createdAt.toISOString() } })
}

// ─── Telemetry tick ──────────────────────────────────────────────────────────
async function tickTelemetry() {
  const now = Date.now()
  const hourOfDay = new Date().getHours() + new Date().getMinutes() / 60

  for (const device of simDevices.values()) {
    // sleeping devices only emit occasionally
    if (device.status === 'SLEEPING' && Math.random() > 0.4) continue

    for (const sensor of device.sensors) {
      // daily cycle + slow drift + noise
      const phase = (hourOfDay / sensor.period) * Math.PI * 2
      const cycle = Math.sin(phase) * sensor.amplitude
      const noise = (Math.random() - 0.5) * sensor.amplitude * 0.4
      let value = sensor.base + cycle + noise
      if (sensor.min !== undefined) value = Math.max(sensor.min, value)
      if (sensor.max !== undefined) value = Math.min(sensor.max, value)
      value = Math.round(value * 100) / 100
      const quality: TelemetryQuality = Math.random() > 0.985 ? 'ESTIMATED' : 'GOOD'

      // persist
      const sensorId = `${device.id}__${sensor.key}`
      await db.telemetry.create({
        data: {
          deviceId: device.id,
          sensorId,
          sensorKey: sensor.key,
          value,
          unit: sensor.unit,
          quality,
          timestamp: new Date(now),
        },
      })

      // update twin reported value for the matching sensor key
      // (kept minimal — only the canonical telemetry keys mirror into twin)
      const twin = await db.deviceTwin.findUnique({ where: { deviceId: device.id } })
      if (twin) {
        const reported = safeParse<Record<string, unknown>>(twin.reported, {})
        reported[sensor.key] = value
        await db.deviceTwin.update({
          where: { deviceId: device.id },
          data: { reported: JSON.stringify(reported), version: { increment: 1 } },
        })
      }

      // broadcast
      broadcast({
        type: 'device.telemetry',
        deviceId: device.id,
        sensorKey: sensor.key,
        value,
        unit: sensor.unit,
        quality,
        timestamp: new Date(now).toISOString(),
      })

      // evaluate alert rules + automations against this point
      await evaluateAlerts(device.id, sensor.key, value)
      await evaluateAutomations(device.id, sensor.key, value)
    }

    // update device lastSeen + heartbeat
    await db.device.update({
      where: { id: device.id },
      data: { lastSeen: new Date(now), lastHeartbeat: new Date(now) },
    })
  }
}

// ─── Device health + offline detection ───────────────────────────────────────
async function tickDeviceHealth() {
  const devices = await db.device.findMany({ where: { organizationId: ORG_ID } })
  const now = Date.now()
  const STALE_MS = 60_000 // 60s without telemetry => OFFLINE
  const GRACE_MS = 90_000

  for (const d of devices) {
    const lastSeen = d.lastSeen ? new Date(d.lastSeen).getTime() : 0
    const sinceSeen = now - lastSeen

    let newStatus = d.status
    let newHealth = d.health

    if (d.status === 'MAINTENANCE') {
      // do not auto-flip from maintenance
    } else if (sinceSeen > GRACE_MS && d.status !== 'OFFLINE') {
      newStatus = 'OFFLINE'
      newHealth = 'OFFLINE'
      broadcast({
        type: 'device.offline',
        deviceId: d.id,
        deviceName: d.name,
        timestamp: nowISO(),
      })
      await audit('device.offline', 'DEVICE', d.name, { deviceId: d.id })
      // trigger device-offline automations
      await evaluateOfflineAutomations(d.id, d.name)
    } else if (sinceSeen <= STALE_MS && d.status === 'OFFLINE') {
      newStatus = 'ONLINE'
      newHealth = 'HEALTHY'
      broadcast({
        type: 'device.online',
        deviceId: d.id,
        deviceName: d.name,
        timestamp: nowISO(),
      })
      await audit('device.online', 'DEVICE', d.name, { deviceId: d.id })
    }

    // battery drift
    let newBattery = d.battery
    if (d.battery !== null) {
      const sim = simDevices.get(d.id)
      if (sim) {
        newBattery = Math.max(0, Math.round((d.battery - sim.driftBattery / 60) * 10) / 10)
      }
    }

    if (newStatus !== d.status || newHealth !== d.health || newBattery !== d.battery) {
      await db.device.update({
        where: { id: d.id },
        data: { status: newStatus, health: newHealth, battery: newBattery },
      })
      broadcast({
        type: 'device.state',
        deviceId: d.id,
        status: newStatus,
        health: newHealth,
        battery: newBattery,
        signal: d.signal,
        lastSeen: (d.lastSeen ?? new Date()).toISOString(),
      })
    }
  }
}

// ─── Alert evaluation ────────────────────────────────────────────────────────
const alertCooldowns = new Map<string, number>() // ruleId -> last triggered ms

async function evaluateAlerts(deviceId: string, sensorKey: string, value: number) {
  const rules = await db.alertRule.findMany({
    where: { organizationId: ORG_ID, enabled: true, deviceId, sensorKey },
  })
  for (const rule of rules) {
    if (!rule.threshold) continue
    const fired =
      (rule.condition === 'GT' && value > rule.threshold) ||
      (rule.condition === 'GTE' && value >= rule.threshold) ||
      (rule.condition === 'LT' && value < rule.threshold) ||
      (rule.condition === 'LTE' && value <= rule.threshold) ||
      (rule.condition === 'EQ' && value === rule.threshold) ||
      (rule.condition === 'NEQ' && value !== rule.threshold)
    if (!fired) continue

    const last = alertCooldowns.get(rule.id) ?? 0
    if (Date.now() - last < rule.cooldownSeconds * 1000) continue
    alertCooldowns.set(rule.id, Date.now())

    const evt = await db.alertEvent.create({
      data: {
        organizationId: ORG_ID,
        ruleId: rule.id,
        deviceId,
        ruleName: rule.name,
        severity: rule.severity,
        status: 'TRIGGERED',
        message: `${rule.name}: ${sensorKey}=${value} (${rule.condition} ${rule.threshold})`,
        context: JSON.stringify({ value, threshold: rule.threshold, condition: rule.condition }),
      },
    })
    broadcast({ type: 'alert.triggered', alert: { ...evt, createdAt: evt.createdAt.toISOString(), triggeredAt: evt.triggeredAt.toISOString() } })

    // notification
    const notif = await db.notification.create({
      data: {
        userId: 'user-pulse',
        organizationId: ORG_ID,
        category: 'ALERT',
        title: `Alert: ${rule.name}`,
        message: `${sensorKey} on ${deviceId} reached ${value} (${rule.condition} ${rule.threshold}).`,
        metadata: JSON.stringify({ alertEventId: evt.id, severity: rule.severity }),
      },
    })
    broadcast({ type: 'notification.created', notification: { ...notif, createdAt: notif.createdAt.toISOString() } })

    await audit('alert.triggered', 'ALERT', rule.name, { deviceId, sensorKey, value, threshold: rule.threshold })
  }
}

// ─── Battery + offline alert checks ──────────────────────────────────────────
async function tickBatteryAlerts() {
  const rules = await db.alertRule.findMany({
    where: { organizationId: ORG_ID, enabled: true, condition: 'BATTERY_BELOW' },
    include: { device: true },
  })
  for (const rule of rules) {
    if (!rule.device || rule.device.battery === null) continue
    if (rule.threshold === null) continue
    if (rule.device.battery >= rule.threshold) continue
    const last = alertCooldowns.get(rule.id) ?? 0
    if (Date.now() - last < rule.cooldownSeconds * 1000) continue
    alertCooldowns.set(rule.id, Date.now())
    const evt = await db.alertEvent.create({
      data: {
        organizationId: ORG_ID, ruleId: rule.id, deviceId: rule.deviceId,
        ruleName: rule.name, severity: rule.severity, status: 'TRIGGERED',
        message: `${rule.device.name} battery at ${rule.device.battery}% (below ${rule.threshold}%).`,
        context: JSON.stringify({ battery: rule.device.battery, threshold: rule.threshold }),
      },
    })
    broadcast({ type: 'alert.triggered', alert: { ...evt, createdAt: evt.createdAt.toISOString(), triggeredAt: evt.triggeredAt.toISOString() } })
    await audit('alert.triggered', 'ALERT', rule.name, { deviceId: rule.deviceId, battery: rule.device.battery })
  }
}

// ─── Automation engine ───────────────────────────────────────────────────────
async function evaluateAutomations(deviceId: string, sensorKey: string, value: number) {
  const automations = await db.automation.findMany({
    where: { organizationId: ORG_ID, enabled: true, triggerType: 'TELEMETRY' },
  })
  for (const auto of automations) {
    const trigger = safeParse<{ deviceId?: string; sensorKey?: string }>(auto.triggerConfig, {})
    if (trigger.deviceId !== deviceId || trigger.sensorKey !== sensorKey) continue

    // simple: any matching trigger fires; evaluate condition nodes; execute action nodes
    const nodes = safeParse<Array<{ id: string; type: string; data: { kind: string; config: Record<string, unknown> } }>>(auto.nodes, [])
    const edges = safeParse<Array<{ source: string; target: string }>>(auto.edges, [])

    const triggerNode = nodes.find((n) => n.type === 'trigger')
    if (!triggerNode) continue

    // walk graph: trigger -> conditions -> actions/notifications
    const executionLogs: Array<{ ts: string; level: string; message: string }> = []
    executionLogs.push({ ts: nowISO(), level: 'info', message: `Trigger fired: telemetry ${sensorKey}=${value} on ${deviceId}` })

    let passed = true
    let current = triggerNode
    while (current) {
      const nextEdges = edges.filter((e) => e.source === current.id)
      const next = nextEdges.map((e) => nodes.find((n) => n.id === e.target)).filter(Boolean) as typeof nodes
      if (next.length === 0) break

      // evaluate conditions in sequence; branch to actions/notifications if any pass
      let advanced = false
      for (const node of next) {
        if (node.type === 'condition') {
          const cfg = node.data.config
          const threshold = Number(cfg.threshold ?? 0)
          const key = String(cfg.sensorKey ?? sensorKey)
          const conditionMet =
            (node.data.kind === 'gt' && key === sensorKey && value > threshold) ||
            (node.data.kind === 'lt' && key === sensorKey && value < threshold) ||
            (node.data.kind === 'gte' && key === sensorKey && value >= threshold) ||
            (node.data.kind === 'lte' && key === sensorKey && value <= threshold) ||
            (node.data.kind === 'eq' && key === sensorKey && value === threshold)
          executionLogs.push({ ts: nowISO(), level: conditionMet ? 'info' : 'warn', message: `Condition "${node.data.kind} ${threshold}" on ${key}: ${conditionMet ? 'MET' : 'not met'}` })
          if (!conditionMet) { passed = false; break }
          current = node
          advanced = true
        } else if (node.type === 'action' || node.type === 'notification') {
          // execute directly
          if (node.type === 'action' && node.data.kind === 'send_command') {
            const cfg = node.data.config
            const targetDeviceId = String(cfg.deviceId ?? deviceId)
            const payload = cfg.payload ?? {}
            await executeCommand(targetDeviceId, payload, `automation:${auto.name}`)
            executionLogs.push({ ts: nowISO(), level: 'info', message: `Action: sent command to ${targetDeviceId}: ${JSON.stringify(payload)}` })
          } else if (node.type === 'notification' && node.data.kind === 'notify') {
            const cfg = node.data.config
            const notif = await db.notification.create({
              data: {
                userId: 'user-pulse',
                organizationId: ORG_ID,
                category: String(cfg.category ?? 'AUTOMATION'),
                title: String(cfg.title ?? 'Notification'),
                message: String(cfg.message ?? ''),
                metadata: JSON.stringify({ automationId: auto.id, automationName: auto.name }),
              },
            })
            broadcast({ type: 'notification.created', notification: { ...notif, createdAt: notif.createdAt.toISOString() } })
            executionLogs.push({ ts: nowISO(), level: 'info', message: `Notification sent: ${cfg.title}` })
          }
          current = node
          advanced = true
        } else if (node.type === 'logic' || node.type === 'delay') {
          current = node
          advanced = true
        }
      }
      if (!advanced || !passed) break
    }

    if (!passed) continue

    // record execution
    const exec = await db.automationExecution.create({
      data: {
        automationId: auto.id,
        status: 'COMPLETED',
        trigger: JSON.stringify({ deviceId, sensorKey, value }),
        logs: JSON.stringify(executionLogs),
        completedAt: new Date(),
      },
    })
    await db.automation.update({
      where: { id: auto.id },
      data: { lastExecutedAt: new Date(), executionCount: { increment: 1 } },
    })
    broadcast({
      type: 'automation.completed',
      execution: {
        ...exec,
        automationName: auto.name,
        startedAt: exec.startedAt.toISOString(),
        completedAt: exec.completedAt?.toISOString() ?? null,
      },
    })
    await audit('automation.execute', 'AUTOMATION', auto.name, { deviceId, sensorKey, value })
  }
}

async function evaluateOfflineAutomations(deviceId: string, deviceName: string) {
  const automations = await db.automation.findMany({
    where: { organizationId: ORG_ID, enabled: true, triggerType: 'DEVICE_OFFLINE' },
  })
  for (const auto of automations) {
    const trigger = safeParse<{ deviceId?: string }>(auto.triggerConfig, {})
    if (trigger.deviceId && trigger.deviceId !== deviceId) continue
    const nodes = safeParse<Array<{ id: string; type: string; data: { kind: string; config: Record<string, unknown> } }>>(auto.nodes, [])
    const edges = safeParse<Array<{ source: string; target: string }>(auto.edges, [])
    const triggerNode = nodes.find((n) => n.type === 'trigger')
    if (!triggerNode) continue
    const logs = [{ ts: nowISO(), level: 'info', message: `Trigger fired: device ${deviceName} went offline` }]
    // execute downstream notification nodes
    const downstream = edges.filter((e) => e.source === triggerNode.id).map((e) => nodes.find((n) => n.id === e.target)).filter(Boolean) as typeof nodes
    for (const node of downstream) {
      if (node.type === 'notification' && node.data.kind === 'notify') {
        const cfg = node.data.config
        const notif = await db.notification.create({
          data: {
            userId: 'user-pulse', organizationId: ORG_ID,
            category: String(cfg.category ?? 'DEVICE'),
            title: String(cfg.title ?? 'Device Offline'),
            message: String(cfg.message ?? `${deviceName} is offline.`),
            metadata: JSON.stringify({ automationId: auto.id, deviceId }),
          },
        })
        broadcast({ type: 'notification.created', notification: { ...notif, createdAt: notif.createdAt.toISOString() } })
        logs.push({ ts: nowISO(), level: 'info', message: `Notification sent: ${cfg.title}` })
      }
    }
    const exec = await db.automationExecution.create({
      data: {
        automationId: auto.id, status: 'COMPLETED',
        trigger: JSON.stringify({ deviceId, deviceName }),
        logs: JSON.stringify(logs), completedAt: new Date(),
      },
    })
    await db.automation.update({ where: { id: auto.id }, data: { lastExecutedAt: new Date(), executionCount: { increment: 1 } } })
    broadcast({ type: 'automation.completed', execution: { ...exec, automationName: auto.name, startedAt: exec.startedAt.toISOString(), completedAt: exec.completedAt?.toISOString() ?? null } })
    await audit('automation.execute', 'AUTOMATION', auto.name, { deviceId, deviceName })
  }
}

// ─── Command execution (simulated device ack) ────────────────────────────────
async function executeCommand(deviceId: string, payload: Record<string, unknown>, sender: string) {
  const device = await db.device.findUnique({ where: { id: deviceId } })
  if (!device) return
  const command = await db.command.create({
    data: {
      deviceId,
      userId: null,
      senderName: sender,
      payload: JSON.stringify(payload),
      topic: `nexora/${ORG_SLUG}/${deviceId}/command`,
      status: 'SENT',
      attempts: 1,
      sentAt: new Date(),
    },
  })
  broadcast({
    type: 'command.created',
    command: {
      ...command,
      payload,
      result: null,
      createdAt: command.createdAt.toISOString(),
      sentAt: command.sentAt?.toISOString() ?? null,
      acknowledgedAt: null,
      completedAt: null,
    },
  })

  // simulate device ack + completion after ~800ms-1500ms
  const delay = 800 + Math.random() * 700
  setTimeout(async () => {
    const acknowledged = await db.command.update({
      where: { id: command.id },
      data: { status: 'ACKNOWLEDGED', acknowledgedAt: new Date() },
    })
    broadcast({
      type: 'command.updated',
      command: {
        ...acknowledged,
        payload: safeParse(acknowledged.payload, {}),
        result: null,
        createdAt: acknowledged.createdAt.toISOString(),
        sentAt: acknowledged.sentAt?.toISOString() ?? null,
        acknowledgedAt: acknowledged.acknowledgedAt?.toISOString() ?? null,
        completedAt: null,
      },
    })

    // apply payload to twin desired + reported
    const twin = await db.deviceTwin.findUnique({ where: { deviceId } })
    if (twin) {
      const desired = safeParse<Record<string, unknown>>(twin.desired, {})
      const reported = safeParse<Record<string, unknown>>(twin.reported, {})
      for (const [k, v] of Object.entries(payload)) {
        desired[k] = v
        reported[k] = v
      }
      await db.deviceTwin.update({
        where: { deviceId },
        data: { desired: JSON.stringify(desired), reported: JSON.stringify(reported), version: { increment: 1 } },
      })
      broadcast({
        type: 'device.state',
        deviceId,
        status: device.status,
        health: device.health,
        battery: device.battery,
        signal: device.signal,
        lastSeen: (device.lastSeen ?? new Date()).toISOString(),
      })
    }

    const completed = await db.command.update({
      where: { id: command.id },
      data: { status: 'COMPLETED', completedAt: new Date(), result: JSON.stringify({ ok: true, applied: true }) },
    })
    broadcast({
      type: 'command.updated',
      command: {
        ...completed,
        payload: safeParse(completed.payload, {}),
        result: { ok: true, applied: true },
        createdAt: completed.createdAt.toISOString(),
        sentAt: completed.sentAt?.toISOString() ?? null,
        acknowledgedAt: completed.acknowledgedAt?.toISOString() ?? null,
        completedAt: completed.completedAt?.toISOString() ?? null,
      },
    })
    await audit('device.command.ack', 'COMMAND', device.name, { deviceId, payload })
  }, delay)
}

// ─── Socket handlers (browser → service) ─────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[realtime] client connected: ${socket.id}`)
  socket.emit('event', { type: 'notification.created', notification: { id: 'welcome', organizationId: ORG_ID, category: 'SYSTEM', title: 'Realtime connected', message: 'Live telemetry stream is active.', read: false, metadata: {}, createdAt: nowISO() } })

  socket.on('subscribe', (data: { organizationId: string }) => {
    // In a real multi-tenant system we'd join a room per org and authorize.
    // Here we accept anything but ignore the org id (single demo org).
    socket.join(`org:${data.organizationId}`)
  })

  socket.on('command.send', async (data: { deviceId: string; payload: Record<string, unknown> }) => {
    await executeCommand(data.deviceId, data.payload, 'Pulse Operator')
  })

  socket.on('disconnect', () => {
    console.log(`[realtime] client disconnected: ${socket.id}`)
  })
})

// ─── Bootstrap + interval loops ─────────────────────────────────────────────
async function start() {
  await loadDevices()
  // telemetry tick every 5s
  setInterval(tickTelemetry, 5_000)
  // device health + offline detection every 15s
  setInterval(tickDeviceHealth, 15_000)
  // battery alerts every 60s
  setInterval(tickBatteryAlerts, 60_000)
  // reload device list every 60s (in case devices were added/updated via API)
  setInterval(loadDevices, 60_000)
  console.log(`[realtime] Nexora Pulse realtime service listening on :${PORT}`)
}

io.httpServer.listen(PORT, () => {
  start().catch((e) => {
    console.error('[realtime] failed to start', e)
    process.exit(1)
  })
})

process.on('SIGTERM', () => {
  console.log('[realtime] SIGTERM received, shutting down...')
  io.close(() => process.exit(0))
})
process.on('SIGINT', () => {
  console.log('[realtime] SIGINT received, shutting down...')
  io.close(() => process.exit(0))
})
