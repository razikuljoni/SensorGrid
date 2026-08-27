// SensorGrid — Database seed
// Seeds a demo organization, user, locations, devices with sensors, twin state,
// automations, alert rules, and an initial activity log.
// Run with: bun run scripts/seed.ts

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const ORG_SLUG = 'sensorgrid-hq'
const DEMO_USER_EMAIL = 'operator@sensorgrid.dev'

const LOCATIONS = [
  { id: 'loc-site', name: 'SensorGrid HQ', type: 'SITE', parentId: null },
  { id: 'loc-ground', name: 'Ground Floor', type: 'FLOOR', parentId: 'loc-site' },
  { id: 'loc-living', name: 'Living Room', type: 'ROOM', parentId: 'loc-ground' },
  { id: 'loc-kitchen', name: 'Kitchen', type: 'ROOM', parentId: 'loc-ground' },
  { id: 'loc-garage', name: 'Garage', type: 'ROOM', parentId: 'loc-ground' },
  { id: 'loc-first', name: 'First Floor', type: 'FLOOR', parentId: 'loc-site' },
  { id: 'loc-bedroom', name: 'Bedroom', type: 'ROOM', parentId: 'loc-first' },
  { id: 'loc-office', name: 'Office', type: 'ROOM', parentId: 'loc-first' },
  { id: 'loc-greenhouse', name: 'Greenhouse', type: 'ZONE', parentId: 'loc-site' },
  { id: 'loc-server', name: 'Server Room', type: 'ROOM', parentId: 'loc-ground' },
]

interface DeviceSeed {
  id: string
  name: string
  type: 'ESP32' | 'RPI' | 'ARDUINO' | 'GENERIC' | 'GATEWAY'
  locationId: string
  status: 'ONLINE' | 'OFFLINE' | 'SLEEPING' | 'WARNING' | 'CRITICAL' | 'MAINTENANCE' | 'UNKNOWN'
  health: 'HEALTHY' | 'DEGRADED' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'UNKNOWN'
  firmware: string
  mac: string
  battery: number | null
  signal: number | null
  tags: string[]
  notes?: string
  sensors: Array<{ key: string; label: string; unit: string; dataType: 'number' | 'boolean'; min?: number; max?: number }>
  twinDesired: Record<string, unknown>
  twinReported: Record<string, unknown>
  credential: { username: string; password: string; clientId: string }
}

const DEVICES: DeviceSeed[] = [
  {
    id: 'dev-living-esp32',
    name: 'Living Room ESP32',
    type: 'ESP32',
    locationId: 'loc-living',
    status: 'ONLINE',
    health: 'HEALTHY',
    firmware: '1.4.2',
    mac: '24:6F:28:AA:BB:01',
    battery: 87,
    signal: -52,
    tags: ['environment', 'primary'],
    notes: 'Primary indoor environmental sensor.',
    sensors: [
      { key: 'temperature', label: 'Temperature', unit: '°C', dataType: 'number', min: 10, max: 40 },
      { key: 'humidity', label: 'Humidity', unit: '%', dataType: 'number', min: 0, max: 100 },
      { key: 'pressure', label: 'Pressure', unit: 'hPa', dataType: 'number', min: 900, max: 1100 },
      { key: 'light', label: 'Light', unit: 'lux', dataType: 'number', min: 0, max: 2000 },
    ],
    twinDesired: { fan: false, led: false, brightness: 60 },
    twinReported: { fan: false, led: false, brightness: 60, temperature: 24.2 },
    credential: { username: 'dev-living-esp32', password: 'nx_live_9f3a', clientId: 'dev-living-esp32' },
  },
  {
    id: 'dev-kitchen-rpi',
    name: 'Kitchen Raspberry Pi',
    type: 'RPI',
    locationId: 'loc-kitchen',
    status: 'ONLINE',
    health: 'HEALTHY',
    firmware: '2.1.0',
    mac: 'B8:27:EB:11:22:33',
    battery: null,
    signal: -41,
    tags: ['environment', 'gateway', 'air-quality'],
    sensors: [
      { key: 'temperature', label: 'Temperature', unit: '°C', dataType: 'number', min: 10, max: 45 },
      { key: 'humidity', label: 'Humidity', unit: '%', dataType: 'number', min: 0, max: 100 },
      { key: 'co2', label: 'CO2', unit: 'ppm', dataType: 'number', min: 300, max: 3000 },
    ],
    twinDesired: { vent: true, threshold: 800 },
    twinReported: { vent: true, threshold: 800, temperature: 25.6 },
    credential: { username: 'dev-kitchen-rpi', password: 'nx_kitchen_7c2e', clientId: 'dev-kitchen-rpi' },
  },
  {
    id: 'dev-greenhouse-esp',
    name: 'Greenhouse Monitor',
    type: 'ESP32',
    locationId: 'loc-greenhouse',
    status: 'WARNING',
    health: 'DEGRADED',
    firmware: '1.3.7',
    mac: '24:6F:28:CC:DD:02',
    battery: 34,
    signal: -78,
    tags: ['environment', 'outdoor', 'agriculture'],
    notes: 'Battery degrading. Schedule replacement.',
    sensors: [
      { key: 'temperature', label: 'Temperature', unit: '°C', dataType: 'number', min: 0, max: 50 },
      { key: 'humidity', label: 'Humidity', unit: '%', dataType: 'number', min: 0, max: 100 },
      { key: 'light', label: 'Light', unit: 'lux', dataType: 'number', min: 0, max: 60000 },
      { key: 'soil', label: 'Soil Moisture', unit: '%', dataType: 'number', min: 0, max: 100 },
    ],
    twinDesired: { pump: false, fan: false },
    twinReported: { pump: false, fan: false, temperature: 28.9 },
    credential: { username: 'dev-greenhouse-esp', password: 'nx_green_b8d1', clientId: 'dev-greenhouse-esp' },
  },
  {
    id: 'dev-bedroom-esp',
    name: 'Bedroom Sensor Hub',
    type: 'ESP32',
    locationId: 'loc-bedroom',
    status: 'SLEEPING',
    health: 'HEALTHY',
    firmware: '1.4.2',
    mac: '24:6F:28:EE:FF:03',
    battery: 92,
    signal: -61,
    tags: ['environment', 'low-power'],
    sensors: [
      { key: 'temperature', label: 'Temperature', unit: '°C', dataType: 'number', min: 5, max: 40 },
      { key: 'humidity', label: 'Humidity', unit: '%', dataType: 'number', min: 0, max: 100 },
    ],
    twinDesired: { led: false },
    twinReported: { led: false, temperature: 21.8 },
    credential: { username: 'dev-bedroom-esp', password: 'nx_bed_2a5f', clientId: 'dev-bedroom-esp' },
  },
  {
    id: 'dev-office-arduino',
    name: 'Office Power Strip',
    type: 'ARDUINO',
    locationId: 'loc-office',
    status: 'ONLINE',
    health: 'HEALTHY',
    firmware: '0.9.4',
    mac: '90:A2:DA:01:02:04',
    battery: null,
    signal: -48,
    tags: ['power', 'actuator'],
    sensors: [
      { key: 'voltage', label: 'Voltage', unit: 'V', dataType: 'number', min: 200, max: 250 },
      { key: 'current', label: 'Current', unit: 'A', dataType: 'number', min: 0, max: 30 },
      { key: 'power', label: 'Power', unit: 'W', dataType: 'number', min: 0, max: 5000 },
    ],
    twinDesired: { outlet1: true, outlet2: false, outlet3: true },
    twinReported: { outlet1: true, outlet2: false, outlet3: true, power: 142.3 },
    credential: { username: 'dev-office-arduino', password: 'nx_office_4d9c', clientId: 'dev-office-arduino' },
  },
  {
    id: 'dev-garage-generic',
    name: 'Garage Door Controller',
    type: 'GENERIC',
    locationId: 'loc-garage',
    status: 'OFFLINE',
    health: 'OFFLINE',
    firmware: '1.0.0',
    mac: '00:1B:44:11:22:05',
    battery: 12,
    signal: null,
    tags: ['actuator', 'critical-battery'],
    notes: 'Lost connectivity 2 hours ago.',
    sensors: [
      { key: 'motion', label: 'Motion', unit: '', dataType: 'boolean', min: 0, max: 1 },
    ],
    twinDesired: { door: 'closed' },
    twinReported: { door: 'open', lastPosition: 'open' },
    credential: { username: 'dev-garage-generic', password: 'nx_garage_e7f3', clientId: 'dev-garage-generic' },
  },
  {
    id: 'dev-server-gateway',
    name: 'Server Room Gateway',
    type: 'GATEWAY',
    locationId: 'loc-server',
    status: 'CRITICAL',
    health: 'CRITICAL',
    firmware: '3.0.1',
    mac: 'F4:CF:E2:33:44:06',
    battery: null,
    signal: -35,
    tags: ['gateway', 'critical', 'monitoring'],
    notes: 'CPU temperature critical. Investigate cooling.',
    sensors: [
      { key: 'temperature', label: 'Temperature', unit: '°C', dataType: 'number', min: 10, max: 90 },
      { key: 'humidity', label: 'Humidity', unit: '%', dataType: 'number', min: 0, max: 100 },
      { key: 'voltage', label: 'Voltage', unit: 'V', dataType: 'number', min: 200, max: 250 },
    ],
    twinDesired: { alarm: true, cooldown: 'max' },
    twinReported: { alarm: true, cooldown: 'max', temperature: 67.4 },
    credential: { username: 'dev-server-gateway', password: 'nx_server_a1b2', clientId: 'dev-server-gateway' },
  },
  {
    id: 'dev-living-presence',
    name: 'Living Room Presence',
    type: 'ESP32',
    locationId: 'loc-living',
    status: 'ONLINE',
    health: 'HEALTHY',
    firmware: '1.2.0',
    mac: '24:6F:28:99:AA:07',
    battery: 76,
    signal: -58,
    tags: ['motion', 'presence'],
    sensors: [
      { key: 'motion', label: 'Motion', unit: '', dataType: 'boolean', min: 0, max: 1 },
      { key: 'light', label: 'Light', unit: 'lux', dataType: 'number', min: 0, max: 2000 },
    ],
    twinDesired: { sensitivity: 'medium' },
    twinReported: { sensitivity: 'medium', motion: false },
    credential: { username: 'dev-living-presence', password: 'nx_presence_8e4d', clientId: 'dev-living-presence' },
  },
]

async function main() {
  console.log('Seeding SensorGrid database...')

  // Clear existing telemetry (idempotent re-runs)
  await db.telemetry.deleteMany({})
  await db.command.deleteMany({})
  await db.alertEvent.deleteMany({})
  await db.notification.deleteMany({})
  await db.auditLog.deleteMany({})
  await db.automationExecution.deleteMany({})

  const org = await db.organization.upsert({
    where: { slug: ORG_SLUG },
    update: { name: 'SensorGrid HQ', plan: 'PRO' },
    create: { id: 'org-sensorgrid-hq', name: 'SensorGrid HQ', slug: ORG_SLUG, plan: 'PRO' },
  })

  const user = await db.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: { name: 'SensorGrid Operator', role: 'OWNER' },
    create: {
      id: 'user-sensorgrid',
      email: DEMO_USER_EMAIL,
      name: 'SensorGrid Operator',
      passwordHash: '$argon2id$demo$placeholder',
      role: 'OWNER',
    },
  })

  await db.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
    update: { role: 'OWNER' },
    create: { organizationId: org.id, userId: user.id, role: 'OWNER' },
  })

  for (const loc of LOCATIONS) {
    await db.location.upsert({
      where: { id: loc.id },
      update: { organizationId: org.id, name: loc.name, type: loc.type, parentId: loc.parentId },
      create: { id: loc.id, organizationId: org.id, name: loc.name, type: loc.type, parentId: loc.parentId },
    })
  }

  for (const seed of DEVICES) {
    await db.device.upsert({
      where: { id: seed.id },
      update: {
        organizationId: org.id, locationId: seed.locationId, name: seed.name, type: seed.type,
        status: seed.status, health: seed.health, firmwareVersion: seed.firmware, macAddress: seed.mac,
        battery: seed.battery, signal: seed.signal,
        lastSeen: new Date(Date.now() - Math.random() * 60_000),
        lastHeartbeat: new Date(Date.now() - Math.random() * 30_000),
        tags: JSON.stringify(seed.tags), notes: seed.notes ?? null,
        metadata: JSON.stringify({ ip: `10.0.1.${10 + seed.id.length}` }),
      },
      create: {
        id: seed.id, organizationId: org.id, locationId: seed.locationId, name: seed.name, type: seed.type,
        status: seed.status, health: seed.health, firmwareVersion: seed.firmware, macAddress: seed.mac,
        battery: seed.battery, signal: seed.signal,
        lastSeen: new Date(Date.now() - Math.random() * 60_000),
        lastHeartbeat: new Date(Date.now() - Math.random() * 30_000),
        tags: JSON.stringify(seed.tags), notes: seed.notes ?? null,
        metadata: JSON.stringify({ ip: `10.0.1.${10 + seed.id.length}` }),
      },
    })

    await db.deviceCredential.upsert({
      where: { deviceId: seed.id },
      update: { username: seed.credential.username, password: seed.credential.password, clientId: seed.credential.clientId },
      create: { deviceId: seed.id, username: seed.credential.username, password: seed.credential.password, clientId: seed.credential.clientId },
    })

    await db.deviceTwin.upsert({
      where: { deviceId: seed.id },
      update: { desired: JSON.stringify(seed.twinDesired), reported: JSON.stringify(seed.twinReported) },
      create: { deviceId: seed.id, desired: JSON.stringify(seed.twinDesired), reported: JSON.stringify(seed.twinReported) },
    })

    for (const s of seed.sensors) {
      const sensorId = `${seed.id}__${s.key}`
      await db.sensor.upsert({
        where: { id: sensorId },
        update: { deviceId: seed.id, key: s.key, label: s.label, unit: s.unit, dataType: s.dataType, min: s.min ?? null, max: s.max ?? null },
        create: { id: sensorId, deviceId: seed.id, key: s.key, label: s.label, unit: s.unit, dataType: s.dataType, min: s.min ?? null, max: s.max ?? null },
      })
    }
  }

  // Seed 24h telemetry history
  console.log('  Generating 24h telemetry history...')
  const now = Date.now()
  const tenMin = 10 * 60 * 1000
  for (const device of DEVICES) {
    if (device.status === 'OFFLINE') continue
    for (const sensor of device.sensors) {
      if (sensor.dataType !== 'number') continue
      const baseValue = sensor.key === 'temperature' ? 24 : sensor.key === 'humidity' ? 55 : sensor.key === 'pressure' ? 1013 : sensor.key === 'light' ? 350 : sensor.key === 'co2' ? 600 : sensor.key === 'soil' ? 45 : sensor.key === 'voltage' ? 230 : sensor.key === 'current' ? 2.4 : sensor.key === 'power' ? 140 : 0
      for (let i = 144; i >= 0; i--) {
        const ts = new Date(now - i * tenMin)
        const hourOfDay = ts.getHours()
        const dailySwing = sensor.key === 'temperature' ? Math.sin((hourOfDay / 24) * Math.PI * 2 - Math.PI / 2) * 4 : 0
        const noise = (Math.random() - 0.5) * (sensor.key === 'light' ? 100 : 2)
        const value = Math.round((baseValue + dailySwing + noise) * 100) / 100
        const quality = Math.random() > 0.97 ? 'ESTIMATED' : 'GOOD'
        await db.telemetry.create({
          data: { deviceId: device.id, sensorId: `${device.id}__${sensor.key}`, sensorKey: sensor.key, value, unit: sensor.unit, quality, timestamp: ts },
        })
      }
    }
  }
  console.log('  Telemetry history seeded')

  const alertRules = [
    { id: 'rule-temp-high', name: 'High Temperature', deviceId: 'dev-living-esp32', sensorKey: 'temperature', condition: 'GT', threshold: 30, severity: 'WARNING' },
    { id: 'rule-temp-critical', name: 'Critical Server Temp', deviceId: 'dev-server-gateway', sensorKey: 'temperature', condition: 'GT', threshold: 60, severity: 'CRITICAL' },
    { id: 'rule-humidity-low', name: 'Low Humidity', deviceId: 'dev-living-esp32', sensorKey: 'humidity', condition: 'LT', threshold: 30, severity: 'INFO' },
    { id: 'rule-co2-high', name: 'Elevated CO2', deviceId: 'dev-kitchen-rpi', sensorKey: 'co2', condition: 'GT', threshold: 1000, severity: 'WARNING' },
    { id: 'rule-battery-low', name: 'Battery Below 20%', deviceId: 'dev-greenhouse-esp', sensorKey: null, condition: 'BATTERY_BELOW', threshold: 20, severity: 'WARNING' },
    { id: 'rule-device-offline', name: 'Garage Device Offline', deviceId: 'dev-garage-generic', sensorKey: null, condition: 'OFFLINE_FOR', threshold: 5, severity: 'CRITICAL' },
    { id: 'rule-soil-dry', name: 'Dry Soil', deviceId: 'dev-greenhouse-esp', sensorKey: 'soil', condition: 'LT', threshold: 30, severity: 'INFO' },
  ]
  for (const rule of alertRules) {
    await db.alertRule.upsert({
      where: { id: rule.id },
      update: { organizationId: org.id, deviceId: rule.deviceId, sensorKey: rule.sensorKey, name: rule.name, condition: rule.condition, threshold: rule.threshold, severity: rule.severity },
      create: { id: rule.id, organizationId: org.id, deviceId: rule.deviceId, sensorKey: rule.sensorKey, name: rule.name, condition: rule.condition, threshold: rule.threshold, severity: rule.severity, enabled: true, cooldownSeconds: 300 },
    })
  }

  await db.alertEvent.create({
    data: {
      organizationId: org.id, ruleId: 'rule-temp-critical', deviceId: 'dev-server-gateway',
      ruleName: 'Critical Server Temp', severity: 'CRITICAL', status: 'TRIGGERED',
      message: 'Server room temperature exceeded 60C threshold.', context: JSON.stringify({ value: 67.4, threshold: 60 }),
    },
  })
  await db.alertEvent.create({
    data: {
      organizationId: org.id, ruleId: 'rule-device-offline', deviceId: 'dev-garage-generic',
      ruleName: 'Garage Device Offline', severity: 'CRITICAL', status: 'ACKNOWLEDGED',
      message: 'Garage Door Controller has been offline for over 5 minutes.',
      context: JSON.stringify({ lastSeen: new Date(Date.now() - 7200_000).toISOString() }),
      acknowledgedAt: new Date(), acknowledgedBy: user.name,
    },
  })

  const automationNodes = [
    { id: 'n1', type: 'trigger', position: { x: 0, y: 0 }, data: { label: 'Telemetry: Temperature', kind: 'telemetry_received', config: { deviceId: 'dev-living-esp32', sensorKey: 'temperature' } } },
    { id: 'n2', type: 'condition', position: { x: 280, y: 0 }, data: { label: 'Temperature > 30C', kind: 'gt', config: { sensorKey: 'temperature', threshold: 30 } } },
    { id: 'n3', type: 'action', position: { x: 560, y: -80 }, data: { label: 'Turn Fan ON', kind: 'send_command', config: { deviceId: 'dev-living-esp32', payload: { fan: true } } } },
    { id: 'n4', type: 'notification', position: { x: 560, y: 80 }, data: { label: 'Notify: High Temp', kind: 'notify', config: { category: 'ALERT', title: 'High Temperature Alert', message: 'Living room fan activated.' } } },
  ]
  const automationEdges = [
    { id: 'e1', source: 'n1', target: 'n2' },
    { id: 'e2', source: 'n2', target: 'n3' },
    { id: 'e3', source: 'n2', target: 'n4' },
  ]

  await db.automation.upsert({
    where: { id: 'auto-cooling' },
    update: {
      organizationId: org.id, name: 'Smart Cooling',
      description: 'Activates fan and notifies when living room temperature exceeds 30C.',
      triggerType: 'TELEMETRY', triggerConfig: JSON.stringify({ deviceId: 'dev-living-esp32', sensorKey: 'temperature' }),
      nodes: JSON.stringify(automationNodes), edges: JSON.stringify(automationEdges),
    },
    create: {
      id: 'auto-cooling', organizationId: org.id, name: 'Smart Cooling', enabled: true,
      description: 'Activates fan and notifies when living room temperature exceeds 30C.',
      triggerType: 'TELEMETRY', triggerConfig: JSON.stringify({ deviceId: 'dev-living-esp32', sensorKey: 'temperature' }),
      nodes: JSON.stringify(automationNodes), edges: JSON.stringify(automationEdges),
    },
  })

  const co2Nodes = [
    { id: 'n1', type: 'trigger', position: { x: 0, y: 0 }, data: { label: 'Telemetry: CO2', kind: 'telemetry_received', config: { deviceId: 'dev-kitchen-rpi', sensorKey: 'co2' } } },
    { id: 'n2', type: 'condition', position: { x: 280, y: 0 }, data: { label: 'CO2 > 1000 ppm', kind: 'gt', config: { sensorKey: 'co2', threshold: 1000 } } },
    { id: 'n3', type: 'action', position: { x: 560, y: 0 }, data: { label: 'Vent ON', kind: 'send_command', config: { deviceId: 'dev-kitchen-rpi', payload: { vent: true } } } },
  ]
  await db.automation.upsert({
    where: { id: 'auto-ventilation' },
    update: {
      organizationId: org.id, name: 'Auto Ventilation',
      description: 'Opens ventilation when kitchen CO2 exceeds 1000 ppm.',
      triggerType: 'TELEMETRY', triggerConfig: JSON.stringify({ deviceId: 'dev-kitchen-rpi', sensorKey: 'co2' }),
      nodes: JSON.stringify(co2Nodes), edges: JSON.stringify([{ id: 'e1', source: 'n1', target: 'n2' }, { id: 'e2', source: 'n2', target: 'n3' }]),
    },
    create: {
      id: 'auto-ventilation', organizationId: org.id, name: 'Auto Ventilation', enabled: true,
      description: 'Opens ventilation when kitchen CO2 exceeds 1000 ppm.',
      triggerType: 'TELEMETRY', triggerConfig: JSON.stringify({ deviceId: 'dev-kitchen-rpi', sensorKey: 'co2' }),
      nodes: JSON.stringify(co2Nodes), edges: JSON.stringify([{ id: 'e1', source: 'n1', target: 'n2' }, { id: 'e2', source: 'n2', target: 'n3' }]),
    },
  })

  const offlineNodes = [
    { id: 'n1', type: 'trigger', position: { x: 0, y: 0 }, data: { label: 'Device Offline', kind: 'device_offline', config: { deviceId: 'dev-garage-generic' } } },
    { id: 'n2', type: 'notification', position: { x: 320, y: 0 }, data: { label: 'Notify: Device Offline', kind: 'notify', config: { category: 'DEVICE', title: 'Device Offline', message: 'Garage Door Controller is offline.' } } },
  ]
  await db.automation.upsert({
    where: { id: 'auto-offline-alert' },
    update: {
      organizationId: org.id, name: 'Device Offline Alert', enabled: false,
      description: 'Sends a notification when the garage controller goes offline.',
      triggerType: 'DEVICE_OFFLINE', triggerConfig: JSON.stringify({ deviceId: 'dev-garage-generic' }),
      nodes: JSON.stringify(offlineNodes), edges: JSON.stringify([{ id: 'e1', source: 'n1', target: 'n2' }]),
    },
    create: {
      id: 'auto-offline-alert', organizationId: org.id, name: 'Device Offline Alert', enabled: false,
      description: 'Sends a notification when the garage controller goes offline.',
      triggerType: 'DEVICE_OFFLINE', triggerConfig: JSON.stringify({ deviceId: 'dev-garage-generic' }),
      nodes: JSON.stringify(offlineNodes), edges: JSON.stringify([{ id: 'e1', source: 'n1', target: 'n2' }]),
    },
  })

  const notifs = [
    { category: 'ALERT', title: 'Critical Server Temperature', message: 'Server room gateway reached 67.4C (threshold 60C).' },
    { category: 'DEVICE', title: 'Garage Device Offline', message: 'Garage Door Controller has been offline for 2 hours.' },
    { category: 'AUTOMATION', title: 'Smart Cooling Executed', message: 'Living room fan activated due to temperature threshold.' },
    { category: 'SYSTEM', title: 'Welcome to SensorGrid', message: 'Your demo workspace is ready. Connect a device to begin.' },
  ]
  for (const n of notifs) {
    await db.notification.create({
      data: { userId: user.id, organizationId: org.id, category: n.category, title: n.title, message: n.message, read: false },
    })
  }

  const audits = [
    { action: 'device.create', targetType: 'DEVICE', targetId: 'dev-server-gateway', targetName: 'Server Room Gateway', actorName: 'SensorGrid Operator', metadata: { type: 'GATEWAY' } },
    { action: 'automation.create', targetType: 'AUTOMATION', targetId: 'auto-cooling', targetName: 'Smart Cooling', actorName: 'SensorGrid Operator', metadata: {} },
    { action: 'alert.acknowledge', targetType: 'ALERT', targetId: null, targetName: 'Garage Device Offline', actorName: 'SensorGrid Operator', metadata: {} },
    { action: 'device.command', targetType: 'COMMAND', targetId: null, targetName: 'Living Room ESP32', actorName: 'SensorGrid Operator', metadata: { payload: { fan: true } } },
  ]
  for (let i = 0; i < audits.length; i++) {
    const a = audits[i]
    await db.auditLog.create({
      data: {
        organizationId: org.id, actorId: user.id, actorName: a.actorName, action: a.action,
        targetType: a.targetType, targetId: a.targetId, targetName: a.targetName,
        metadata: JSON.stringify(a.metadata), ipAddress: '10.0.1.12',
        createdAt: new Date(Date.now() - (i + 1) * 7 * 60_000),
      },
    })
  }

  await db.command.create({
    data: {
      deviceId: 'dev-living-esp32', userId: user.id, senderName: 'SensorGrid Operator',
      payload: JSON.stringify({ fan: true, speed: 2 }),
      topic: 'sensorgrid/sensorgrid-hq/dev-living-esp32/command',
      status: 'COMPLETED', result: JSON.stringify({ ok: true, applied: true }), attempts: 1,
      createdAt: new Date(Date.now() - 30 * 60_000), sentAt: new Date(Date.now() - 30 * 60_000),
      acknowledgedAt: new Date(Date.now() - 29 * 60_000), completedAt: new Date(Date.now() - 29 * 60_000),
    },
  })
  await db.command.create({
    data: {
      deviceId: 'dev-office-arduino', userId: user.id, senderName: 'SensorGrid Operator',
      payload: JSON.stringify({ outlet2: true }),
      topic: 'sensorgrid/sensorgrid-hq/dev-office-arduino/command',
      status: 'FAILED', error: 'Device rejected payload: outlet2 not configurable while outlet3 is active.', attempts: 1,
      createdAt: new Date(Date.now() - 50 * 60_000), sentAt: new Date(Date.now() - 50 * 60_000),
    },
  })

  console.log('Seed complete.')
  console.log(`  Organization: ${org.name} (${org.slug})`)
  console.log(`  User: ${user.email}`)
  console.log(`  Locations: ${LOCATIONS.length}`)
  console.log(`  Devices: ${DEVICES.length}`)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
