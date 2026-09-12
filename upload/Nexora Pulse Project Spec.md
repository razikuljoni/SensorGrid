# NEXORA PULSE

## Full-Stack IoT Device Intelligence & Automation Platform

> **Tagline:** Connect. Observe. Automate.

**Project Type:** Production-grade Full-Stack SaaS + IoT Platform  
**Primary Stack:** TypeScript, Next.js, React, NestJS, PostgreSQL, Redis, MQTT, WebSockets, Docker  
**Architecture Style:** Modular Monolith evolving into Event-Driven Services  
**Target Level:** Advanced Portfolio / Real Product Engineering

---

# TABLE OF CONTENTS

1. Vision
2. Product Identity
3. Core Problem
4. Target Users
5. Scope
6. Unique Design System
7. Complete Technology Stack
8. System Architecture
9. Monorepo Structure
10. Backend Architecture
11. Frontend Architecture
12. Authentication
13. Authorization & Multi-tenancy
14. Database Design
15. Device Model
16. MQTT Architecture
17. Realtime System
18. Telemetry Pipeline
19. Automation Engine
20. Alert Engine
21. Device Commands
22. Dashboard
23. Analytics
24. Device Management
25. Digital Twin
26. Rule Builder UX
27. Notifications
28. API Specification
29. WebSocket Events
30. MQTT Topics
31. Background Jobs
32. Caching
33. Security Requirements
34. Observability
35. Testing Strategy
36. Docker
37. CI/CD
38. Environment Variables
39. Agent Rules
40. Development Phases
41. Acceptance Criteria
42. Future Roadmap

---

# 1. Vision

Build a professional IoT platform where users can connect physical devices, receive realtime sensor telemetry, visualize historical data, control devices remotely, create automation workflows, configure alerts, and monitor entire environments from one dashboard.

Nexora Pulse should feel like a combination of:

- Home Assistant
- ThingsBoard
- Grafana dashboards
- Vercel-quality SaaS UX

without cloning any existing product.

The product must demonstrate serious engineering in:

- realtime systems
- event-driven architecture
- hardware integration
- background processing
- time-series data
- dashboards
- automation rules
- distributed communication
- security
- observability
- multi-tenant SaaS

This project must be suitable as a flagship portfolio application.

---

# 2. Product Identity

## Product Name

# **NEXORA PULSE**

## Brand Meaning

**NEXORA**

> Explore. Build. Evolve.

**PULSE**

Represents the heartbeat of connected devices continuously sending information.

Together:

> Nexora Pulse is the intelligent pulse of connected environments.

## Product Personality

The interface should feel:

- calm
- technical
- premium
- intelligent
- highly visual
- minimal
- futuristic without becoming cyberpunk
- data-first instead of decoration-first

Avoid excessive glassmorphism.

Avoid neon overload.

Avoid gaming aesthetics.

Think industrial precision mixed with elegant modern software.

---

# 3. Core Problem

IoT systems often suffer from fragmented tooling.

A user might need:

- one application for sensors
- another for device control
- another for automation
- another for charts
- another for alerts

Nexora Pulse combines those into one unified platform.

Users should be able to answer instantly:

- Which devices are online?
- What is happening right now?
- What happened yesterday?
- Which room has abnormal temperature?
- Which automation triggered?
- Which device failed?
- Who changed a configuration?
- Can I remotely control this device?
- Which sensors produce the most data?

---

# 4. Target Users

## Individual Maker

Examples:

- ESP32 hobby projects
- weather station
- smart room
- greenhouse
- home automation

## Electronics Enthusiast

Users building:

- Arduino projects
- Raspberry Pi systems
- sensor networks
- robotics environments

## Small Business

Examples:

- warehouses
- farms
- server rooms
- workshops
- laboratories

## Engineering Team

Teams monitoring multiple connected devices across locations.

---

# 5. Product Scope

## MVP

Must include:

- authentication
- organizations/workspaces
- user roles
- device registration
- MQTT device connection
- device credentials
- telemetry ingestion
- realtime dashboard
- historical charts
- device control
- automation rules
- alerts
- notifications
- audit logs
- device health
- command history
- digital twin
- API
- WebSockets
- Redis
- BullMQ
- PostgreSQL
- TimescaleDB extension if available
- Docker
- CI/CD
- tests
- observability

## Explicit Non-Goals for MVP

Do NOT implement initially:

- voice assistants
- AI chatbot
- billing
- marketplace
- mobile app
- firmware OTA updates
- LoRaWAN
- Zigbee
- Matter protocol

Design architecture so they can be added later.

---

# 6. UNIQUE DESIGN SYSTEM

# Design System Name

## **Aether Grid**

Aether Grid is the complete visual language of Nexora Pulse.

Its philosophy:

> Data should feel alive, but never noisy.

The design is built around invisible structure, soft surfaces, precise spacing, and meaningful motion.

---

## 6.1 Visual Principles

### Principle 1 — Atmospheric Minimalism

Interfaces should breathe.

Use generous whitespace.

Avoid dense borders everywhere.

Use layered surfaces instead of boxed widgets.

### Principle 2 — Signal Over Decoration

Every color, icon, animation, and chart must communicate information.

Nothing should exist purely as decoration.

### Principle 3 — Physical Meets Digital

Since this is an IoT platform, UI elements should subtly resemble instrumentation:

- gauges
- panels
- indicators
- telemetry
- signal strength
- pulses

without looking like old industrial software.

### Principle 4 — Motion Has Meaning

Animations indicate:

- incoming telemetry
- successful commands
- device reconnecting
- automation execution
- alerts

Never animate continuously without purpose.

---

## 6.2 Color System

Use semantic tokens only.

### Base Surfaces

```text
Canvas
Surface
Surface Elevated
Surface Muted
Overlay
```

### Primary Brand

Suggested emotional direction:

```text
Deep Indigo
Electric Cyan Accent
Soft Violet Secondary
```

Do NOT hardcode colors throughout components.

Create tokens.

Example semantic tokens:

```css
--background
--surface
--surface-elevated
--surface-muted

--primary
--primary-hover
--primary-muted

--accent
--accent-muted

--success
--warning
--danger
--info

--border
--border-subtle
--text-primary
--text-secondary
--text-muted
```

The exact palette should support excellent contrast in both dark and light themes.

---

## 6.3 Typography

Use:

```text
Geist
Inter
or equivalent modern sans-serif
```

Hierarchy:

```text
Display
Heading XL
Heading LG
Heading MD
Heading SM

Body LG
Body MD
Body SM

Mono
Telemetry Values
Device IDs
Topic Names
```

Use monospace selectively for:

- MQTT topics
- IDs
- timestamps
- command payloads
- JSON
- firmware versions

---

## 6.4 Spacing

Use an 8px spacing system.

```text
4
8
12
16
24
32
40
48
64
```

Never introduce arbitrary spacing.

---

## 6.5 Radius

Use restrained rounded corners.

```text
8px
12px
16px
24px
```

Primary cards should generally use 16px.

Small controls use 10–12px.

Avoid pill-shaped everything.

Reserve pills for statuses and compact filters.

---

## 6.6 Elevation

Use depth through layered surfaces rather than heavy shadows.

Levels:

```text
0 = Canvas
1 = Surface
2 = Elevated Card
3 = Modal
4 = Floating Command Palette
```

Dark mode should rely more on luminance than shadows.

---

## 6.7 Status Language

Every device state must have icon + label.

Never rely on color alone.

States:

```text
Online
Offline
Sleeping
Warning
Critical
Maintenance
Unknown
```

Each state has:

- semantic color
- icon
- text label
- accessible description

---

## 6.8 Data Visualization Rules

Charts must follow these rules:

- no unnecessary gradients
- minimal grid lines
- clear tooltips
- accessible legends
- responsive
- smooth hover
- timezone aware
- empty-state handling
- loading skeletons

Charts should feel like professional monitoring software.

---

## 6.9 Signature Components

Create reusable design primitives.

### PulseCard

Used for KPI and telemetry.

Contains:

- icon
- title
- main value
- unit
- trend
- sparkline
- status

### DeviceOrb

Circular device health visualization.

Displays:

- connectivity
- battery
- signal
- activity pulse

### TelemetryTile

Compact live sensor display.

Examples:

```text
Temperature
26.4 °C

Humidity
68 %

Pressure
1008 hPa
```

### SignalTimeline

Horizontal event timeline.

Shows:

- telemetry spike
- command sent
- automation triggered
- device disconnected

### AtmospherePanel

Large environmental dashboard panel.

Combines:

- temperature
- humidity
- light
- air quality
- realtime animation

### CommandConsole

Developer-oriented panel for sending commands.

Supports:

- JSON
- payload validation
- history
- response
- timestamps

### RuleCanvas

Visual automation editor built with React Flow.

Nodes:

- Trigger
- Condition
- Logic
- Delay
- Action
- Notification

---

# 7. Complete Technology Stack

## Frontend

```text
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui
TanStack Query
Zustand
React Hook Form
Zod
React Flow
Recharts
Lucide
Framer Motion
```

## Backend

```text
NestJS
TypeScript
REST
Swagger/OpenAPI
Socket.IO
```

## Database

Primary:

```text
PostgreSQL
Prisma
```

Telemetry:

```text
TimescaleDB extension
```

Fallback:

Normal PostgreSQL partitioning if TimescaleDB unavailable.

## Event Infrastructure

```text
Redis
BullMQ
MQTT Broker
```

Recommended local broker:

```text
Mosquitto
```

Production architecture should remain broker-agnostic.

## Object Storage

```text
S3 Compatible Storage
```

Used for:

- device images
- floor plans
- generated exports
- firmware metadata later

## Monitoring

```text
Sentry
OpenTelemetry
Prometheus
Grafana
```

## Testing

```text
Vitest
Jest
React Testing Library
Supertest
Playwright
```

## DevOps

```text
Docker
Docker Compose
GitHub Actions
Nginx
```

---

# 8. High-Level System Architecture

```text
                           ┌─────────────────────┐
                           │ Physical Devices    │
                           │ ESP32 / Pi / MCU    │
                           └──────────┬──────────┘
                                      │
                                   MQTT/TLS
                                      │
                                      ▼
                           ┌─────────────────────┐
                           │    MQTT Broker      │
                           └──────────┬──────────┘
                                      │
                                      ▼
┌──────────────┐      ┌────────────────────────────┐
│ Next.js Web  │◀────▶│        NestJS API          │
│ React UI     │ WS   │ REST + WebSocket Gateway   │
└──────┬───────┘      └──────┬──────────────┬──────┘
       │                     │              │
       │                     ▼              ▼
       │              PostgreSQL         Redis
       │                     │              │
       │                     │              ▼
       │                     │        BullMQ Workers
       │                     │              │
       │                     │              ▼
       │                     │      Automation Engine
       │                     │      Alert Engine
       │                     │      Aggregation Jobs
       │                     │
       │                     ▼
       │                TimescaleDB
       │
       ▼
Realtime Device Dashboard
```

All telemetry enters through MQTT.

HTTP must never be the primary ingestion mechanism for devices.

---

# 9. Monorepo Structure

```text
nexora-pulse/
│
├── apps/
│   ├── web/
│   ├── api/
│   ├── worker/
│   └── mqtt-gateway/
│
├── packages/
│   ├── ui/
│   ├── config/
│   ├── database/
│   ├── types/
│   ├── validation/
│   ├── mqtt/
│   ├── telemetry/
│   ├── automation/
│   └── design-tokens/
│
├── infrastructure/
│   ├── docker/
│   ├── mosquitto/
│   ├── grafana/
│   ├── prometheus/
│   └── nginx/
│
├── docs/
│
├── scripts/
│
├── .github/
│
├── docker-compose.yml
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

Use pnpm workspaces.

Shared types must live inside packages.

Never duplicate DTO definitions across frontend and backend.

---

# 10. Backend Architecture

Use NestJS modules.

```text
src/
│
├── auth/
├── users/
├── organizations/
├── members/
├── devices/
├── telemetry/
├── mqtt/
├── commands/
├── automations/
├── alerts/
├── notifications/
├── analytics/
├── dashboards/
├── audit/
├── websocket/
├── storage/
├── health/
├── jobs/
├── common/
└── config/
```

Every module owns:

```text
controller
service
repository
dto
entities
tests
```

Avoid circular dependencies.

Use interfaces where module boundaries require abstraction.

---

# 11. Frontend Architecture

Suggested structure:

```text
app/
│
├── (marketing)
│
├── auth/
│
├── dashboard/
│
├── organizations/
│
└── [organizationSlug]/
    │
    ├── overview/
    ├── devices/
    ├── devices/[deviceId]/
    ├── automations/
    ├── alerts/
    ├── analytics/
    ├── activity/
    ├── members/
    └── settings/
```

Feature folders:

```text
features/
├── devices/
├── telemetry/
├── automations/
├── analytics/
├── alerts/
└── notifications/
```

Shared UI belongs in packages/ui.

---

# 12. Authentication

Implement:

- email registration
- login
- logout
- password reset
- email verification architecture
- session management
- secure HTTP-only cookies

Optional:

- GitHub login
- Google login

Passwords:

```text
Argon2id preferred
bcrypt acceptable
```

Rate limit:

- login
- registration
- password reset

Never expose whether an email exists.

---

# 13. Authorization & Multi-Tenancy

Use organization-level RBAC.

Roles:

```text
OWNER
ADMIN
ENGINEER
OPERATOR
VIEWER
```

Example permissions:

```text
device.create
device.update
device.delete
device.command
device.read

automation.create
automation.update
automation.delete

alert.manage

organization.members.manage
organization.settings.manage

audit.read
analytics.read
```

Every database query involving organization resources must include organization scope.

Cross-tenant access tests are mandatory.

---

# 14. Database Design

Core entities:

```text
User
Session
OAuthAccount

Organization
OrganizationMember
Invitation

Location
Zone

Device
DeviceCredential
DeviceFirmware
DeviceTwin

Sensor
Actuator

Telemetry
TelemetryAggregate

Command
CommandExecution

Automation
AutomationNode
AutomationExecution

AlertRule
AlertEvent

Notification
AuditLog

Dashboard
DashboardWidget
```

Use UUID IDs.

Every mutable entity must contain:

```text
createdAt
updatedAt
```

Important indexes:

```text
organization_members(org_id,user_id)

devices(org_id,status)

telemetry(device_id,sensor_id,timestamp)

commands(device_id,created_at)

alert_events(org_id,created_at)

automation_executions(org_id,started_at)
```

Telemetry tables should be optimized for time-range queries.

---

# 15. Device Model

Each device represents a physical machine.

Example:

```json
{
  "id": "uuid",
  "name": "Living Room ESP32",
  "type": "ESP32",
  "status": "ONLINE",
  "firmwareVersion": "1.0.0",
  "lastSeen": "timestamp",
  "location": "Living Room"
}
```

Device contains:

- identity
- credentials
- metadata
- firmware version
- connectivity state
- signal strength
- battery if supported
- tags
- notes

Never mix telemetry into the device table.

---

# 16. Digital Twin

Every device should have a server-side digital twin.

Twin contains desired and reported state.

Example:

```json
{
  "desired": {
    "fan": true,
    "led": false
  },
  "reported": {
    "fan": true,
    "led": false,
    "temperature": 26.4
  }
}
```

Flow:

```text
User changes desired state
        ↓
Command generated
        ↓
MQTT published
        ↓
Device executes
        ↓
Device reports state
        ↓
Twin updated
        ↓
UI synchronized
```

Desired and reported must always remain separate.

---

# 17. MQTT Architecture

Use hierarchical topics.

Example:

```text
nexora/{org}/{device}/telemetry
nexora/{org}/{device}/state
nexora/{org}/{device}/command
nexora/{org}/{device}/event
nexora/{org}/{device}/status
```

Example telemetry:

```json
{
  "timestamp": "ISO_DATE",
  "temperature": 26.4,
  "humidity": 68,
  "light": 420
}
```

Use retained messages only where appropriate.

Device authentication should use per-device credentials or certificates in future architecture.

Do not allow anonymous production publishing.

---

# 18. Telemetry Pipeline

Pipeline:

```text
ESP32
 ↓
MQTT
 ↓
MQTT Gateway
 ↓
Validation
 ↓
Normalization
 ↓
Redis Stream/Event
 ↓
Persistence Worker
 ↓
TimescaleDB
 ↓
Realtime Broadcast
 ↓
Dashboard
```

Requirements:

- schema validation
- malformed payload rejection
- timestamp validation
- duplicate protection
- idempotency
- batching where beneficial
- backpressure handling
- queue-based persistence

Never write directly from MQTT callback into expensive analytics.

---

# 19. Telemetry Data Model

Raw telemetry:

```text
device_id
sensor_id
timestamp
value
unit
quality
metadata
```

Support multiple data types:

```text
number
boolean
string
json
```

Quality states:

```text
GOOD
ESTIMATED
INVALID
MISSING
```

Do not silently treat invalid sensor data as valid.

---

# 20. Automation Engine

This is one of the flagship features.

Users create visual workflows.

Example:

```text
Temperature > 30°C
        │
        ▼
Check Time
        │
        ▼
Turn Fan ON
        │
        ▼
Send Notification
```

Nodes:

```text
Trigger
Condition
AND
OR
Delay
Schedule
Action
Notification
Webhook
```

Initial actions:

- toggle actuator
- publish MQTT command
- create notification
- create alert event
- webhook

Execution architecture:

```text
Telemetry Event
      ↓
Automation Matcher
      ↓
Rule Evaluation
      ↓
Execution Plan
      ↓
BullMQ Job
      ↓
Action Execution
      ↓
Audit Log
```

Automations must be deterministic.

Version every automation definition.

---

# 21. Rule Builder UX

Use React Flow.

Node categories:

### Trigger

```text
Telemetry received
Device online
Device offline
Schedule
Manual
```

### Logic

```text
IF
AND
OR
NOT
Compare
```

### Flow

```text
Delay
Throttle
Debounce
```

### Actions

```text
Send command
Notification
Webhook
Change twin desired state
```

Rules must validate before publishing.

Prevent invalid disconnected graphs.

---

# 22. Alert Engine

Alert rules monitor telemetry.

Examples:

```text
Temperature > 35°C

Humidity < 30%

Device offline for 10 minutes

Battery < 15%
```

Alert lifecycle:

```text
NORMAL
   ↓
TRIGGERED
   ↓
ACKNOWLEDGED
   ↓
RESOLVED
```

Every alert must retain history.

Users can acknowledge alerts.

Do not automatically delete alert events.

---

# 23. Device Commands

Commands are asynchronous.

Flow:

```text
User
 ↓
API
 ↓
Command Record
 ↓
MQTT Publish
 ↓
Device
 ↓
Acknowledgement
 ↓
Command Completed
```

States:

```text
PENDING
SENT
ACKNOWLEDGED
COMPLETED
FAILED
TIMEOUT
```

Command history must display:

- payload
- sender
- timestamps
- result
- error

Never assume delivery equals execution.

---

# 24. Realtime Dashboard

Main dashboard contains:

## Header

- organization selector
- global search
- notifications
- command palette
- user menu

## Hero Area

Show:

- online devices
- offline devices
- active alerts
- automations executed today

## Environment Overview

Large AtmospherePanel.

Display:

- temperature
- humidity
- pressure
- air quality
- light

Realtime updates with subtle pulse animation.

## Device Grid

Use responsive PulseCards.

Each card displays:

- device icon
- name
- location
- status
- latest sensor values
- last seen

## Activity

SignalTimeline with live events.

---

# 25. Device Detail Page

Sections:

```text
Overview
Telemetry
Controls
Automations
History
Twin
Settings
```

Overview includes:

- status
- battery
- signal
- firmware
- uptime
- last seen

Telemetry:

- live charts
- selectable ranges
- sensor comparison

Controls:

- switches
- sliders
- buttons
- command console

Twin:

- desired JSON
- reported JSON
- differences

History:

- commands
- connectivity
- alerts
- automation executions

---

# 26. Analytics

Provide time range filters.

Ranges:

```text
1h
6h
24h
7d
30d
Custom
```

Charts:

- temperature
- humidity
- battery trend
- device uptime
- telemetry volume
- alert frequency
- automation activity

Analytics must aggregate server-side.

Do not send millions of points to browsers.

Implement downsampling.

---

# 27. Locations & Zones

Organizations can contain locations.

Example:

```text
Home
 ├── Ground Floor
 │   ├── Living Room
 │   ├── Kitchen
 │   └── Garage
 │
 └── First Floor
     ├── Bedroom
     └── Office
```

Devices belong to zones.

Future support:

- floor plans
- drag/drop device placement

---

# 28. Notifications

Initial channels:

```text
In-App
Email
```

Future:

```text
Discord
Slack
Telegram
Webhook
```

Notification categories:

```text
Device
Alert
Automation
System
Security
```

Allow read/unread state.

---

# 29. Activity Feed

Unified timeline:

```text
10:42 Device Online

10:39 Temperature exceeded threshold

10:38 Automation executed

10:35 Fan command completed

10:21 Firmware metadata updated
```

Filters:

- device
- user
- automation
- alert
- date

All important actions should create audit entries.

---

# 30. API Specification

Prefix:

```text
/api/v1
```

Authentication:

```text
POST /auth/register
POST /auth/login
POST /auth/logout
GET  /auth/me
POST /auth/password-reset
```

Organizations:

```text
GET  /organizations
POST /organizations
GET  /organizations/:id
PATCH /organizations/:id
```

Devices:

```text
GET    /organizations/:orgId/devices
POST   /organizations/:orgId/devices
GET    /devices/:deviceId
PATCH  /devices/:deviceId
DELETE /devices/:deviceId

POST /devices/:deviceId/credentials
POST /devices/:deviceId/commands
GET  /devices/:deviceId/history
GET  /devices/:deviceId/twin
```

Telemetry:

```text
GET /devices/:deviceId/telemetry
GET /devices/:deviceId/telemetry/live
GET /devices/:deviceId/analytics
```

Automations:

```text
GET    /organizations/:orgId/automations
POST   /organizations/:orgId/automations
GET    /automations/:id
PATCH  /automations/:id
DELETE /automations/:id
POST   /automations/:id/enable
POST   /automations/:id/disable
```

Alerts:

```text
GET /organizations/:orgId/alerts
POST /organizations/:orgId/alerts
PATCH /alerts/:id/acknowledge
PATCH /alerts/:id/resolve
```

Notifications:

```text
GET /notifications
PATCH /notifications/:id/read
```

Audit:

```text
GET /organizations/:orgId/audit
```

Generate Swagger documentation automatically.

---

# 31. WebSocket Events

Server emits:

```text
device.online
device.offline
device.telemetry
device.state.updated

command.created
command.updated

automation.started
automation.completed
automation.failed

alert.triggered
alert.acknowledged
alert.resolved

notification.created
```

Client may subscribe only to authorized organization rooms.

Never trust client-specified organization IDs.

---

# 32. Background Jobs

Queues:

```text
telemetry-persistence

telemetry-aggregation

automation-execution

alert-evaluation

notification-delivery

device-health

analytics-generation

cleanup
```

Every job contains:

```text
jobId
organizationId
deviceId
createdAt
attempt
status
error
```

Use exponential retry.

Use dead-letter handling.

---

# 33. Device Health Engine

Continuously calculate health.

Signals:

- last seen
- heartbeat
- packet loss if available
- battery
- signal
- sensor freshness

Health states:

```text
HEALTHY
DEGRADED
WARNING
CRITICAL
OFFLINE
UNKNOWN
```

Do not mark offline immediately.

Use configurable grace periods.

---

# 34. Command Console

Developer-focused control interface.

Features:

- JSON editor
- schema validation
- payload presets
- command templates
- execution history
- response viewer
- timestamps
- copy
- resend

Example payload:

```json
{
  "fan": true,
  "speed": 3
}
```

Never allow arbitrary MQTT topic publishing from normal users.

Only publish through authorized device command APIs.

---

# 35. Security Requirements

Mandatory:

- TLS for production
- secure cookies
- CSRF protection where applicable
- rate limiting
- RBAC
- organization isolation
- MQTT authentication
- topic authorization
- payload validation
- replay protection architecture
- audit logs
- secret rotation architecture
- structured logs
- no secrets in frontend
- no secrets in logs
- CORS restrictions
- secure headers
- brute-force protection

Treat device payloads as hostile input.

---

# 36. MQTT Security

Requirements:

- username/password or certificate strategy abstraction
- organization-scoped topics
- ACL design
- deny wildcard publishing for devices
- deny cross-device command access
- TLS in production
- broker credentials outside source control

Topic authorization example:

```text
Device A

publish:
nexora/org1/deviceA/telemetry

subscribe:
nexora/org1/deviceA/command
```

Device A must never access Device B topics.

---

# 37. Rate Limiting

Protect:

```text
login
registration
password reset
device registration
command creation
automation creation
webhook endpoints
```

Different limits for:

- anonymous
- authenticated
- device clients

---

# 38. Observability

Every request gets:

```text
requestId
```

Logs include:

```text
requestId
userId
organizationId
deviceId
route
duration
status
```

MQTT processing logs:

```text
messageId
topic
deviceId
payloadSize
processingDuration
result
```

Metrics:

```text
mqtt_messages_total
mqtt_processing_duration
telemetry_ingested_total
automation_execution_total
automation_failure_total
alert_trigger_total
device_online_total
device_offline_total
command_duration
command_failure_total
```

Integrate Sentry.

Integrate OpenTelemetry tracing.

---

# 39. Testing Strategy

## Unit Tests

Test:

- telemetry validation
- automation evaluator
- alert evaluator
- digital twin merge
- command state transitions
- RBAC
- DTO validation

## Integration Tests

Test:

- PostgreSQL
- Redis
- MQTT gateway
- device registration
- telemetry ingestion
- automation execution
- alert generation

## E2E Tests

Scenario:

```text
Create account
↓
Create organization
↓
Create location
↓
Register ESP32 device
↓
Generate credentials
↓
Publish telemetry
↓
Dashboard updates
↓
Create automation
↓
Temperature exceeds threshold
↓
Automation sends fan command
↓
Device acknowledges
↓
Alert appears
↓
User acknowledges alert
↓
Audit history verified
```

Also test unauthorized organization access.

---

# 40. Docker

Services:

```text
web
api
worker
mqtt
postgres
redis
prometheus
grafana
```

Use Docker Compose for local development.

Health checks required.

Run production containers as non-root where practical.

Use multi-stage Docker builds.

---

# 41. CI/CD

GitHub Actions.

Pull Request pipeline:

```text
Install
↓
Lint
↓
Typecheck
↓
Unit Tests
↓
Integration Tests
↓
Build
```

Main branch:

```text
Tests
↓
Docker Build
↓
Image Publish
↓
Deployment
```

Cache pnpm dependencies.

Fail on TypeScript errors.

---

# 42. Environment Variables

Create `.env.example`.

```text
DATABASE_URL

REDIS_URL

MQTT_URL
MQTT_USERNAME
MQTT_PASSWORD

SESSION_SECRET

NEXT_PUBLIC_APP_URL
API_URL

S3_ENDPOINT
S3_BUCKET
S3_ACCESS_KEY
S3_SECRET_KEY

SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASSWORD

SENTRY_DSN

OTEL_EXPORTER_OTLP_ENDPOINT
```

Validate all environment variables during startup.

Never commit `.env`.

---

# 43. Agent Engineering Rules

Every coding agent must obey these.

## Inspect First

Before modifying:

1. inspect architecture
2. inspect package manifests
3. inspect existing patterns
4. inspect tests
5. inspect database schema
6. inspect API contracts

Never blindly generate files.

## Incremental Development

Build features vertically.

Preferred:

```text
Database
↓
Backend
↓
Validation
↓
Tests
↓
Frontend
↓
E2E
```

Avoid building the entire frontend before backend contracts exist.

## Type Safety

Strict TypeScript.

No unnecessary `any`.

Shared types belong in packages.

## Validation

Validate:

- REST
- WebSocket
- MQTT
- environment
- automation definitions
- command payloads

## Security

Never weaken RBAC.

Never bypass tenant isolation.

Never expose MQTT credentials to browsers.

Never execute arbitrary device code.

## Database

Use migrations.

Never manually alter production schema.

## Tests

Do not remove tests.

Every business rule deserves tests.

## Documentation

Update documentation whenever architecture changes.

---

# 44. Development Phases

## Phase 0 — Foundation

Deliver:

- monorepo
- pnpm
- TypeScript
- ESLint
- Prettier
- Tailwind
- shadcn
- PostgreSQL
- Redis
- MQTT
- Docker
- CI

Acceptance:

All development commands succeed.

---

## Phase 1 — Aether Grid Design System

Build before application screens.

Deliver:

- tokens
- typography
- spacing
- surfaces
- buttons
- inputs
- cards
- status badges
- charts
- dark/light themes
- command palette foundation

Acceptance:

Storybook or component documentation recommended.

No screen should invent its own styles.

---

## Phase 2 — Authentication

Deliver:

- register
- login
- logout
- sessions
- protected routes

Acceptance:

Secure authentication flow.

---

## Phase 3 — Organizations

Deliver:

- organization CRUD
- members
- roles
- invitations
- tenant isolation

Acceptance:

Cross-organization access impossible.

---

## Phase 4 — Device Registration

Deliver:

- device CRUD
- credentials
- device metadata
- locations
- zones

Acceptance:

A user can register a simulated ESP32.

---

## Phase 5 — MQTT Gateway

Deliver:

- broker connection
- topic parsing
- authentication
- telemetry validation
- state messages
- heartbeat

Acceptance:

Simulated device can publish telemetry.

---

## Phase 6 — Telemetry System

Deliver:

- persistence
- realtime updates
- charts
- historical queries
- aggregation

Acceptance:

Dashboard updates without refresh.

---

## Phase 7 — Digital Twin

Deliver:

- desired state
- reported state
- synchronization
- differences UI

Acceptance:

State remains consistent after commands.

---

## Phase 8 — Commands

Deliver:

- command creation
- MQTT publishing
- acknowledgement
- history
- retries

Acceptance:

Commands are asynchronous and observable.

---

## Phase 9 — Automation

Deliver:

- React Flow builder
- validation
- execution engine
- scheduling
- audit

Acceptance:

Temperature trigger can automatically control an actuator.

---

## Phase 10 — Alerts

Deliver:

- alert rules
- events
- acknowledgement
- resolution
- notifications

Acceptance:

Offline device creates alert after configured timeout.

---

## Phase 11 — Analytics

Deliver:

- charts
- uptime
- telemetry summaries
- automation metrics
- alert metrics

Acceptance:

Custom date ranges perform efficiently.

---

## Phase 12 — Production Hardening

Review:

- security
- RBAC
- MQTT ACL
- performance
- indexes
- caching
- logs
- tracing
- Docker
- CI
- E2E

---

# 45. Acceptance Criteria

The finished product must support this complete scenario.

```text
User registers.

User creates organization.

User creates rooms and zones.

User registers ESP32 device.

Platform generates secure device credentials.

ESP32 connects to MQTT broker.

Device begins publishing temperature and humidity.

Telemetry appears in realtime dashboard.

Historical chart becomes available.

User opens device page.

User toggles a smart relay.

Command is published.

Device acknowledges execution.

Digital twin updates.

User creates automation:

Temperature > 30°C

↓

Turn Fan ON

↓

Send Notification

Temperature rises.

Automation executes.

Fan command succeeds.

Notification appears.

Audit log records every important action.

Another organization cannot access this data.

System remains responsive while thousands of telemetry records are processed.
```

---

# 46. ESP32 Simulator

Create a simulator package.

Structure:

```text
apps/device-simulator/
```

Capabilities:

- connect to MQTT
- authenticate
- publish telemetry every configurable interval
- simulate online/offline
- simulate battery
- simulate actuator acknowledgement
- random environmental values
- deterministic seed mode for testing

CLI example:

```bash
pnpm simulator:start --device=device-001
```

This allows full development without physical hardware.

Later support actual ESP32 firmware.

---

# 47. Recommended ESP32 Firmware Architecture

Future firmware repository:

```text
firmware/
├── src/
│   ├── wifi
│   ├── mqtt
│   ├── sensors
│   ├── actuators
│   ├── config
│   └── main.cpp
```

Firmware responsibilities:

- WiFi
- MQTT
- heartbeat
- telemetry
- command listener
- state reporter

Do not mix business automation into firmware.

Business logic belongs on server.

---

# 48. README Requirements

README must include:

- project vision
- screenshots placeholders
- architecture diagram
- design system overview
- stack
- local development
- Docker
- MQTT setup
- simulator
- environment variables
- testing
- CI/CD
- observability
- roadmap
- limitations
- security notes

---

# 49. Future Roadmap

After MVP:

### OTA Firmware

Remote firmware update workflow.

### Mobile App

React Native client.

### Matter Integration

Support emerging smart-home ecosystems.

### LoRaWAN Gateway

Long-range agricultural devices.

### Edge Computing

Local gateway that continues automations during internet outages.

### AI Insights

Optional analytics layer.

Examples:

- anomaly detection
- unusual temperature pattern
- predictive maintenance
- natural language dashboard queries

AI must consume validated telemetry rather than replacing deterministic automation.

### Floor Plan Mode

Upload floor plan.

Drag devices visually onto rooms.

Realtime environmental heat map.

---

# 50. Definition of Done

A feature is complete only when all apply:

- database migration exists
- backend implemented
- API documented
- validation complete
- authorization enforced
- realtime behavior tested
- loading state exists
- empty state exists
- error state exists
- audit event added where appropriate
- unit tests added
- integration tests added
- E2E updated where necessary
- TypeScript passes
- lint passes
- documentation updated

No fake buttons.

No placeholder business logic.

No hardcoded secrets.

No cross-tenant leaks.

No synchronous heavy telemetry processing.

---

# 51. Final Engineering Goal

Nexora Pulse should demonstrate mastery of modern full-stack engineering by combining:

```text
Next.js
React
TypeScript

NestJS
PostgreSQL
Prisma

Redis
BullMQ
MQTT
Socket.IO

Docker
GitHub Actions

OpenTelemetry
Prometheus
Grafana
Sentry

Playwright
Vitest
Supertest
```

The final application should feel like a polished commercial IoT monitoring platform capable of supporting real devices, realtime data, automation, analytics, and secure multi-tenant collaboration.

Its defining identity is simple:

> **Connect devices. Observe everything. Automate intelligently.**
