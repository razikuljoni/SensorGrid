// SensorGrid — In-App Engine (Serverless compatible)
// Replaces external socket.io mini-service.
// Runs telemetry tick, alert checks, automation evaluation, health tick, command execution.
// Writes events to RealtimeEvent outbox for SSE streaming.

import { db } from '@/lib/db'
import type {
  ServerSocketEvent,
  TelemetryQuality,
  AuditTargetType,
  DeviceStatus,
  DeviceHealth,
  NotificationCategory,
  AutomationExecutionStatus,
  CommandStatus,
  AlertSeverity,
  AlertStatus,
} from '@/lib/types'

const ORG_ID = 'org-sensorgrid-hq'
const ORG_SLUG = 'sensorgrid-hq'
const DEMO_USER_NAME = 'SensorGrid Operator'

export async function pushEvent(event: ServerSocketEvent) {
  try {
    await db.realtimeEvent.create({
      data: {
        type: event.type,
        payload: JSON.stringify(event),
      },
    })
  } catch (e) {
    console.error('[engine] pushEvent error:', e)
  }
}

async function audit(
  action: string,
  targetType: AuditTargetType,
  targetName: string,
  metadata: Record<string, unknown> = {}
) {
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
  await pushEvent({
    type: 'activity',
    log: {
      ...log,
      targetType: log.targetType as AuditTargetType,
      metadata: safeParse(log.metadata, {}),
      createdAt: log.createdAt.toISOString(),
    },
  })
}

function safeParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

function nowISO() {
  return new Date().toISOString()
}

let lastTickMs = 0
const TICK_INTERVAL_MS = 4000

export async function runEngineTickIfNeeded() {
  const now = Date.now()
  if (now - lastTickMs < TICK_INTERVAL_MS) return
  lastTickMs = now
  await tickTelemetryAndEngine(now)
  await tickDeviceHealth(now)
}

async function tickTelemetryAndEngine(now: number) {
  const devices = await db.device.findMany({
    where: { organizationId: ORG_ID },
    include: { sensors: true },
  })

  const hourOfDay = new Date(now).getHours() + new Date(now).getMinutes() / 60

  for (const device of devices) {
    if (device.status === 'OFFLINE' || device.status === 'MAINTENANCE') continue
    if (device.status === 'SLEEPING' && Math.random() > 0.4) continue

    const numericSensors = device.sensors.filter((s) => s.dataType === 'number')

    for (const sensor of numericSensors) {
      const base =
        sensor.key === 'temperature' ? 24 :
        sensor.key === 'humidity' ? 55 :
        sensor.key === 'pressure' ? 1013 :
        sensor.key === 'light' ? 350 :
        sensor.key === 'co2' ? 600 :
        sensor.key === 'soil' ? 45 :
        sensor.key === 'voltage' ? 230 :
        sensor.key === 'current' ? 2.4 :
        sensor.key === 'power' ? 140 : 0

      const amplitude =
        sensor.key === 'temperature' ? 5 :
        sensor.key === 'humidity' ? 15 :
        sensor.key === 'pressure' ? 4 :
        sensor.key === 'light' ? 200 :
        sensor.key === 'co2' ? 150 :
        sensor.key === 'soil' ? 10 :
        sensor.key === 'voltage' ? 2 :
        sensor.key === 'current' ? 0.6 :
        sensor.key === 'power' ? 30 : 1

      const period = sensor.key === 'light' ? 24 : 12
      const phase = (hourOfDay / period) * Math.PI * 2
      const cycle = Math.sin(phase) * amplitude
      const noise = (Math.random() - 0.5) * amplitude * 0.4
      let value = base + cycle + noise

      if (sensor.min !== null) value = Math.max(sensor.min, value)
      if (sensor.max !== null) value = Math.min(sensor.max, value)
      value = Math.round(value * 100) / 100

      const quality: TelemetryQuality = Math.random() > 0.985 ? 'ESTIMATED' : 'GOOD'
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

      const twin = await db.deviceTwin.findUnique({ where: { deviceId: device.id } })
      if (twin) {
        const reported = safeParse<Record<string, unknown>>(twin.reported, {})
        reported[sensor.key] = value
        await db.deviceTwin.update({
          where: { deviceId: device.id },
          data: {
            reported: JSON.stringify(reported),
            version: { increment: 1 },
          },
        })
      }

      await pushEvent({
        type: 'device.telemetry',
        deviceId: device.id,
        sensorKey: sensor.key,
        value,
        unit: sensor.unit,
        quality,
        timestamp: new Date(now).toISOString(),
      })

      await evaluateAlerts(device.id, sensor.key, value)
      await evaluateAutomations(device.id, sensor.key, value)
    }

    await db.device.update({
      where: { id: device.id },
      data: { lastSeen: new Date(now), lastHeartbeat: new Date(now) },
    })
  }
}

async function tickDeviceHealth(now: number) {
  const devices = await db.device.findMany({ where: { organizationId: ORG_ID } })
  const STALE_MS = 60_000
  const GRACE_MS = 90_000

  for (const d of devices) {
    const lastSeen = d.lastSeen ? new Date(d.lastSeen).getTime() : 0
    const sinceSeen = now - lastSeen

    let newStatus = d.status
    let newHealth = d.health

    if (d.status === 'MAINTENANCE') {
      // no auto flip
    } else if (sinceSeen > GRACE_MS && d.status !== 'OFFLINE') {
      newStatus = 'OFFLINE'
      newHealth = 'OFFLINE'
      await pushEvent({
        type: 'device.offline',
        deviceId: d.id,
        deviceName: d.name,
        timestamp: nowISO(),
      })
      await audit('device.offline', 'DEVICE', d.name, { deviceId: d.id })
      await evaluateOfflineAutomations(d.id, d.name)
    } else if (sinceSeen <= STALE_MS && d.status === 'OFFLINE') {
      newStatus = 'ONLINE'
      newHealth = 'HEALTHY'
      await pushEvent({
        type: 'device.online',
        deviceId: d.id,
        deviceName: d.name,
        timestamp: nowISO(),
      })
      await audit('device.online', 'DEVICE', d.name, { deviceId: d.id })
    }

    let newBattery = d.battery
    if (d.battery !== null && d.type === 'ESP32') {
      newBattery = Math.max(0, Math.round((d.battery - 0.4 / 60) * 10) / 10)
    }

    if (newStatus !== d.status || newHealth !== d.health || newBattery !== d.battery) {
      await db.device.update({
        where: { id: d.id },
        data: { status: newStatus, health: newHealth, battery: newBattery },
      })
      await pushEvent({
        type: 'device.state',
        deviceId: d.id,
        status: newStatus as DeviceStatus,
        health: newHealth as DeviceHealth,
        battery: newBattery,
        signal: d.signal,
        lastSeen: (d.lastSeen ?? new Date()).toISOString(),
      })
    }
  }
}

const alertCooldowns = new Map<string, number>()

async function evaluateAlerts(deviceId: string, sensorKey: string, value: number) {
  const rules = await db.alertRule.findMany({
    where: { organizationId: ORG_ID, enabled: true, deviceId, sensorKey },
  })
  for (const rule of rules) {
    if (rule.threshold === null) continue
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
    await pushEvent({
      type: 'alert.triggered',
      alert: {
        ...evt,
        severity: evt.severity as AlertSeverity,
        status: evt.status as AlertStatus,
        context: safeParse(evt.context, {}),
        triggeredAt: evt.triggeredAt.toISOString(),
        acknowledgedAt: evt.acknowledgedAt?.toISOString() ?? null,
        acknowledgedBy: evt.acknowledgedBy,
        resolvedAt: evt.resolvedAt?.toISOString() ?? null,
      },
    })

    const notif = await db.notification.create({
      data: {
        userId: 'user-sensorgrid',
        organizationId: ORG_ID,
        category: 'ALERT',
        title: `Alert: ${rule.name}`,
        message: `${sensorKey} on ${deviceId} reached ${value} (${rule.condition} ${rule.threshold}).`,
        metadata: JSON.stringify({ alertEventId: evt.id, severity: rule.severity }),
      },
    })
    await pushEvent({
      type: 'notification.created',
      notification: {
        ...notif,
        category: notif.category as NotificationCategory,
        metadata: safeParse(notif.metadata, {}),
        createdAt: notif.createdAt.toISOString(),
      },
    })
    await audit('alert.triggered', 'ALERT', rule.name, { deviceId, sensorKey, value, threshold: rule.threshold })
  }
}

async function evaluateAutomations(deviceId: string, sensorKey: string, value: number) {
  const automations = await db.automation.findMany({
    where: { organizationId: ORG_ID, enabled: true, triggerType: 'TELEMETRY' },
  })
  for (const auto of automations) {
    const trigger = safeParse<{ deviceId?: string; sensorKey?: string }>(auto.triggerConfig, {})
    if (trigger.deviceId && trigger.deviceId !== deviceId) continue
    if (trigger.sensorKey && trigger.sensorKey !== sensorKey) continue

    const nodes = safeParse<Array<{ id: string; type: string; data: { kind: string; config: Record<string, unknown> } }>>(auto.nodes, [])
    const edges = safeParse<Array<{ source: string; target: string }>>(auto.edges, [])
    const triggerNode = nodes.find((n) => n.type === 'trigger')
    if (!triggerNode) continue

    const logs: Array<{ ts: string; level: string; message: string }> = [
      { ts: nowISO(), level: 'info', message: `Trigger fired: telemetry ${sensorKey}=${value} on ${deviceId}` },
    ]

    let passed = true
    let current: typeof triggerNode | undefined = triggerNode
    while (current) {
      const nextEdges = edges.filter((e) => e.source === current!.id)
      const next = nextEdges.map((e) => nodes.find((n) => n.id === e.target)).filter(Boolean) as typeof nodes
      if (next.length === 0) break

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
          logs.push({ ts: nowISO(), level: conditionMet ? 'info' : 'warn', message: `Condition "${node.data.kind} ${threshold}" on ${key}: ${conditionMet ? 'MET' : 'not met'}` })
          if (!conditionMet) { passed = false; break }
          current = node
          advanced = true
        } else if (node.type === 'action' || node.type === 'notification') {
          if (node.type === 'action' && node.data.kind === 'send_command') {
            const cfg = node.data.config
            const targetDeviceId = String(cfg.deviceId ?? deviceId)
            const payload = (cfg.payload ?? {}) as Record<string, unknown>
            await executeCommand(targetDeviceId, payload, `automation:${auto.name}`)
            logs.push({ ts: nowISO(), level: 'info', message: `Action: sent command to ${targetDeviceId}: ${JSON.stringify(payload)}` })
          } else if (node.type === 'notification' && node.data.kind === 'notify') {
            const cfg = node.data.config
            const notif = await db.notification.create({
              data: {
                userId: 'user-sensorgrid',
                organizationId: ORG_ID,
                category: String(cfg.category ?? 'AUTOMATION'),
                title: String(cfg.title ?? 'Notification'),
                message: String(cfg.message ?? ''),
                metadata: JSON.stringify({ automationId: auto.id, automationName: auto.name }),
              },
            })
            await pushEvent({
              type: 'notification.created',
              notification: {
                ...notif,
                category: notif.category as NotificationCategory,
                metadata: safeParse(notif.metadata, {}),
                createdAt: notif.createdAt.toISOString(),
              },
            })
            logs.push({ ts: nowISO(), level: 'info', message: `Notification sent: ${cfg.title}` })
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

    const exec = await db.automationExecution.create({
      data: {
        automationId: auto.id,
        status: 'COMPLETED',
        trigger: JSON.stringify({ deviceId, sensorKey, value }),
        logs: JSON.stringify(logs),
        completedAt: new Date(),
      },
    })
    await db.automation.update({
      where: { id: auto.id },
      data: { lastExecutedAt: new Date(), executionCount: { increment: 1 } },
    })
    await pushEvent({
      type: 'automation.completed',
      execution: {
        ...exec,
        automationName: auto.name,
        status: exec.status as AutomationExecutionStatus,
        trigger: safeParse(exec.trigger, {}),
        logs: safeParse(exec.logs, []),
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
    const edges = safeParse<Array<{ source: string; target: string }>>(auto.edges, [])
    const triggerNode = nodes.find((n) => n.type === 'trigger')
    if (!triggerNode) continue
    const logs = [{ ts: nowISO(), level: 'info', message: `Trigger fired: device ${deviceName} went offline` }]

    const downstream = edges.filter((e) => e.source === triggerNode.id).map((e) => nodes.find((n) => n.id === e.target)).filter(Boolean) as typeof nodes
    for (const node of downstream) {
      if (node.type === 'notification' && node.data.kind === 'notify') {
        const cfg = node.data.config
        const notif = await db.notification.create({
          data: {
            userId: 'user-sensorgrid', organizationId: ORG_ID,
            category: String(cfg.category ?? 'DEVICE'),
            title: String(cfg.title ?? 'Device Offline'),
            message: String(cfg.message ?? `${deviceName} is offline.`),
            metadata: JSON.stringify({ automationId: auto.id, deviceId }),
          },
        })
        await pushEvent({
          type: 'notification.created',
          notification: {
            ...notif,
            category: notif.category as NotificationCategory,
            metadata: safeParse(notif.metadata, {}),
            createdAt: notif.createdAt.toISOString(),
          },
        })
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
    await pushEvent({
      type: 'automation.completed',
      execution: {
        ...exec,
        automationName: auto.name,
        status: exec.status as AutomationExecutionStatus,
        trigger: safeParse(exec.trigger, {}),
        logs: safeParse(exec.logs, []),
        startedAt: exec.startedAt.toISOString(),
        completedAt: exec.completedAt?.toISOString() ?? null,
      },
    })
    await audit('automation.execute', 'AUTOMATION', auto.name, { deviceId, deviceName })
  }
}

export async function executeCommand(deviceId: string, payload: Record<string, unknown>, sender: string = DEMO_USER_NAME) {
  const device = await db.device.findUnique({ where: { id: deviceId } })
  if (!device) return null

  const command = await db.command.create({
    data: {
      deviceId,
      userId: null,
      senderName: sender,
      payload: JSON.stringify(payload),
      topic: `sensorgrid/${ORG_SLUG}/${deviceId}/command`,
      status: 'SENT',
      attempts: 1,
      sentAt: new Date(),
    },
  })

  await pushEvent({
    type: 'command.created',
    command: {
      ...command,
      status: command.status as CommandStatus,
      payload,
      result: null,
      createdAt: command.createdAt.toISOString(),
      sentAt: command.sentAt?.toISOString() ?? null,
      acknowledgedAt: null,
      completedAt: null,
    },
  })

  setTimeout(async () => {
    try {
      const acknowledged = await db.command.update({
        where: { id: command.id },
        data: { status: 'ACKNOWLEDGED', acknowledgedAt: new Date() },
      })
      await pushEvent({
        type: 'command.updated',
        command: {
          ...acknowledged,
          status: acknowledged.status as CommandStatus,
          payload: safeParse(acknowledged.payload, {}),
          result: null,
          createdAt: acknowledged.createdAt.toISOString(),
          sentAt: acknowledged.sentAt?.toISOString() ?? null,
          acknowledgedAt: acknowledged.acknowledgedAt?.toISOString() ?? null,
          completedAt: null,
        },
      })

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
        await pushEvent({
          type: 'device.state',
          deviceId,
          status: device.status as DeviceStatus,
          health: device.health as DeviceHealth,
          battery: device.battery,
          signal: device.signal,
          lastSeen: (device.lastSeen ?? new Date()).toISOString(),
        })
      }

      const completed = await db.command.update({
        where: { id: command.id },
        data: { status: 'COMPLETED', completedAt: new Date(), result: JSON.stringify({ ok: true, applied: true }) },
      })
      await pushEvent({
        type: 'command.updated',
        command: {
          ...completed,
          status: completed.status as CommandStatus,
          payload: safeParse(completed.payload, {}),
          result: { ok: true, applied: true },
          createdAt: completed.createdAt.toISOString(),
          sentAt: completed.sentAt?.toISOString() ?? null,
          acknowledgedAt: completed.acknowledgedAt?.toISOString() ?? null,
          completedAt: completed.completedAt?.toISOString() ?? null,
        },
      })
      await audit('device.command.ack', 'COMMAND', device.name, { deviceId, payload })
    } catch (e) {
      console.error('[engine] command async ack error:', e)
    }
  }, 1000)

  return command
}
