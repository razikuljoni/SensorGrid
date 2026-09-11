# SENSORGRID

## IoT Device Intelligence & Automation Platform

> **Connect. Observe. Automate.**

SensorGrid is a production-grade IoT platform where users connect physical devices, receive realtime sensor telemetry, visualize historical data, control devices remotely, create automation workflows, configure alerts, and monitor entire environments from one calm, data-first dashboard.

It combines the feel of Home Assistant, ThingsBoard, Grafana dashboards, and Vercel-quality SaaS UX — without cloning any existing product.

---

## Table of Contents

1. [Vision](#vision)
2. [Screenshots](#screenshots)
3. [Responsive Design](#responsive-design)
4. [Architecture](#architecture)
5. [Aether Grid Design System](#aether-grid-design-system)
6. [Technology Stack](#technology-stack)
7. [Local Development](#local-development)
8. [Deployment](#deployment)
9. [Realtime & MQTT Setup](#realtime--mqtt-setup)
10. [Device Simulator](#device-simulator)
11. [Environment Variables](#environment-variables)
12. [Authentication & Logout](#authentication--logout)
13. [Testing](#testing)
14. [CI/CD](#cicd)
15. [Observability](#observability)
16. [Security](#security)
17. [Project Structure](#project-structure)
18. [API Reference](#api-reference)
19. [WebSocket Events](#websocket-events)
20. [Roadmap](#roadmap)
21. [Limitations](#limitations)

---

## Vision

Build a professional IoT platform that demonstrates serious engineering in:

- Realtime systems
- Event-driven architecture
- Hardware integration
- Background processing
- Time-series data
- Dashboards
- Automation rules
- Distributed communication
- Security
- Observability
- Multi-tenant SaaS

The product must answer these questions instantly:

- Which devices are online?
- What is happening right now?
- What happened yesterday?
- Which room has abnormal temperature?
- Which automation triggered?
- Which device failed?
- Can I remotely control this device?

---

## Screenshots

All screenshot images live in [`public/screenshots/`](public/screenshots/). The following views are available in the running application:

| View | Description |
|------|-------------|
| **Dashboard** | Hero KPIs (online/offline/critical devices, active alerts, automations today, telemetry points), AtmospherePanel with live temperature/humidity/pressure/CO₂/light, device grid with DeviceOrbs, SignalTimeline activity feed, recent alerts |
| **Devices** | Searchable, filterable device list with status badges, battery/signal indicators, location, tags |
| **Device Detail** | Tabbed view: Overview (KPIs + latest telemetry), Telemetry (charts with time ranges), Controls (twin-derived switches/sliders + command sender), Twin (desired vs reported JSON + differences), History (audit + commands) |
| **Telemetry** | Cross-device telemetry explorer with sensor selection, time range filters, live chart, latest-value tiles |
| **Analytics** | Aggregated metrics: summary KPIs, hourly telemetry volume bar chart, per-device volume, alerts by severity pie chart, multi-series trend |
| **Automations** | React Flow visual rule builder with trigger/condition/logic/delay/action/notification nodes, automation list with enable/disable, inspector panel for node config |
| **Alerts** | Alert rules + alert events with full lifecycle (TRIGGERED → ACKNOWLEDGED → RESOLVED), severity badges, acknowledge/resolve actions |
| **Command Console** | Developer-focused JSON command editor with payload presets, templates, live validation, command history with status transitions, resend |
| **Notifications** | In-app notifications across categories (Device, Alert, Automation, System, Security) with read/unread state |
| **Activity Log** | Unified audit trail with filters by action type and free-text search |
| **Settings** | Organization info, members with RBAC roles, integrations status |
| **About** | Product overview, feature list, technology stack |

---

## Responsive Design

SensorGrid is built **mobile-first** and is fully fluid responsive across all breakpoints.

### Breakpoints

| Breakpoint | Width | Layout Behavior |
|------------|-------|-----------------|
| Mobile | 320–639px | Single column, sidebar hidden (hamburger menu), KPI cards 2/row, device cards 1/col |
| Tablet (sm) | 640–1023px | 2-column grids, sidebar still hamburger, KPI cards 2–3/row |
| Desktop (lg) | 1024–1279px | Sidebar visible (fixed), 3-column device grid, KPI cards 3–5/row |
| Wide (xl) | 1280px+ | Full 4-column device grid, 5-column KPI row |

### Responsive Features

- **Sidebar**: Fixed on `lg+`, slide-out Sheet on mobile/tablet (hamburger trigger)
- **Header**: Compact height (56px) on mobile, full height (64px) on `sm+`; search bar hidden on mobile, appears on `lg+`
- **KPI Cards**: 2 per row on mobile, 3 on `lg`, 5 on `xl` — cards scale internal padding and font sizes
- **Device Cards**: 1 per row on mobile, 2 on `sm`, 3 on `lg`, 4 on `xl`
- **Device Detail**: Tabs scroll horizontally on narrow screens; content stacks vertically
- **Telemetry Tiles**: 2 per row on narrow cards, 3 on wider cards
- **Environment Panel**: 2-column grid on mobile, 3 on `md`, 5 on `lg`
- **Charts**: All charts use `ResponsiveContainer` with `width="100%"` — no horizontal overflow
- **Command Console**: Stacks vertically on mobile, side-by-side on `lg+`
- **Automations**: List stacks above canvas on mobile, side-by-side on `lg+`

### Logout

Logout is available from two locations:

1. **Header profile dropdown** (top-right) — click your avatar → "Log out" at the bottom of the menu
2. **Sidebar user card** (bottom-left) — click the user info card → "Log out" at the bottom of the popover

Both call `POST /api/auth/logout`, show a toast confirmation, and reset to the dashboard view. An audit log entry is recorded.

---

## Architecture

### High-Level System Architecture

```
                           ┌─────────────────────┐
                           │ Physical Devices    │
                           │ ESP32 / Pi / MCU    │
                           └──────────┬──────────┘
                                      │
                                   MQTT/TLS
                                      │
                                      ▼
                           ┌─────────────────────┐
                           │    MQTT Broker      │  ◀── simulated by the
                           └──────────┬──────────┘      realtime-service
                                      │
                                      ▼
┌──────────────┐      ┌────────────────────────────┐
│ Next.js Web  │◀────▶│   Realtime Mini-Service    │
│ React UI     │ WS   │ (socket.io · port 3003)    │
│ + API Routes │      │  · telemetry simulator     │
└──────┬───────┘      │  · alert evaluator         │
       │              │  · automation engine        │
       │              │  · command executor          │
       │              └──────┬──────────────┬──────┘
       │                     │              │
       │                     ▼              ▼
       │              SQLite/Prisma    In-memory state
       │              (PostgreSQL +        (Redis
       │               TimescaleDB         equivalent)
       │               in production)
       │
       ▼
Realtime Device Dashboard
```

### Adaptation Notes

The reference spec targets a pnpm monorepo with NestJS, PostgreSQL+TimescaleDB, Redis+BullMQ, an MQTT broker (Mosquitto), and Docker Compose. **This sandbox deployment adapts that architecture** into a single Next.js application backed by SQLite + Prisma and an in-process socket.io mini-service, while preserving:

- ✅ The full data model (devices, telemetry, automations, alerts, commands, twins, audit, notifications)
- ✅ The complete REST API surface (`/api/v1/*` mapped to `/api/*`)
- ✅ The WebSocket event protocol
- ✅ The Aether Grid design system
- ✅ Realtime telemetry, automation execution, and alert evaluation
- ✅ The digital twin (desired vs reported) model
- ✅ Audit logging on every important action

The realtime mini-service (`mini-services/realtime-service`) collapses the spec's `apps/mqtt-gateway` + `apps/worker` into a single Bun process that:

1. **Simulates devices** — generates telemetry for every online device every 5s using organic sine + noise
2. **Persists telemetry** — writes to the Telemetry table + updates the DeviceTwin reported state
3. **Broadcasts** — emits `device.telemetry`, `device.online`, `device.offline`, `device.state` events to all connected browsers
4. **Evaluates alerts** — checks AlertRules against fresh telemetry and creates AlertEvents + Notifications
5. **Evaluates automations** — walks the React Flow graph (trigger → condition → action) and executes send_command/notify nodes
6. **Executes commands** — when a command is forwarded from the API, simulates device ack + completion after ~1s and reconciles the twin
7. **Monitors device health** — marks devices offline after a grace period, recalculates health, drains battery

---

## Aether Grid Design System

Aether Grid is the complete visual language of SensorGrid.

> **Data should feel alive, but never noisy.**

### Visual Principles

1. **Atmospheric Minimalism** — generous whitespace, layered surfaces, no dense borders
2. **Signal Over Decoration** — every color, icon, animation must communicate information
3. **Physical Meets Digital** — instrumentation feel (gauges, panels, indicators, pulses) without looking industrial
4. **Motion Has Meaning** — animations indicate telemetry arrival, command success, reconnection, alerts

### Color System

Semantic tokens only — no hardcoded colors throughout components.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--primary` | Deep indigo | Brighter indigo | Brand, primary actions |
| `--accent` | Electric cyan tint | Electric cyan glow | Live indicators, highlights |
| `--success` | Teal-green | Brighter green | Online, healthy, completed |
| `--warning` | Amber | Brighter amber | Warnings, degraded |
| `--danger` | Warm red | Brighter red | Critical, errors, alerts |
| `--info` | Blue-violet | Brighter blue-violet | Informational |
| `--background` | Near-white cool tint | Deep indigo-black | Canvas |
| `--surface` | Slightly off-white | Elevated dark | Cards, panels |

Full light + dark themes with `next-themes`.

### Signature Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **PulseCard** | `src/components/aether/pulse-card.tsx` | KPI + telemetry card with icon, value, unit, trend, sparkline |
| **DeviceOrb** | `src/components/aether/device-orb.tsx` | Circular device health viz: connectivity, battery ring, signal, activity pulse |
| **TelemetryTile** | `src/components/aether/telemetry-tile.tsx` | Compact live sensor display with quality indicator + flicker on update |
| **SignalTimeline** | `src/components/aether/signal-timeline.tsx` | Vertical event timeline with action-specific icons |
| **AtmospherePanel** | `src/components/aether/atmosphere-panel.tsx` | Large environmental panel with ambient glow that shifts with values |
| **StatusBadge** | `src/components/aether/status-badge.tsx` | Device/alert/command status pills with icon + label + dot |
| **Sparkline** | `src/components/charts/sparkline.tsx` | Lightweight SVG sparkline for PulseCard |
| **TelemetryChart** | `src/components/charts/telemetry-chart.tsx` | Multi-series area/line chart with downsampling |

### Status Language

Every state has icon + label + color + accessible description. Never relies on color alone.

**Device Status:** `ONLINE` · `OFFLINE` · `SLEEPING` · `WARNING` · `CRITICAL` · `MAINTENANCE` · `UNKNOWN`

**Device Health:** `HEALTHY` · `DEGRADED` · `WARNING` · `CRITICAL` · `OFFLINE` · `UNKNOWN`

**Alert Lifecycle:** `NORMAL` → `TRIGGERED` → `ACKNOWLEDGED` → `RESOLVED`

**Command States:** `PENDING` → `SENT` → `ACKNOWLEDGED` → `COMPLETED` (or `FAILED` / `TIMEOUT`)

---

## Technology Stack

### Frontend

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **TypeScript 5** (strict)
- **Tailwind CSS 4** with shadcn/ui (New York style)
- **TanStack Query** for server state
- **Zustand** for client state
- **Recharts** for analytics charts
- **@xyflow/react** (React Flow) for the automation rule canvas
- **Framer Motion** for subtle animations
- **Lucide** icons
- **next-themes** for dark/light mode
- **Sonner** for toast notifications

### Backend

- **Next.js API Routes** (REST, `/api/*`)
- **Prisma ORM** with SQLite (PostgreSQL in production)
- **Zod** for validation
- **socket.io** for realtime

### Realtime Infrastructure

- **socket.io mini-service** (`mini-services/realtime-service`) on port 3003
  - Telemetry simulator (replaces MQTT broker + device firmware)
  - Alert evaluator
  - Automation engine
  - Command executor
  - Device health monitor

### DevOps (Production Target)

- Docker + Docker Compose
- GitHub Actions CI/CD
- Nginx reverse proxy
- Sentry for error tracking
- OpenTelemetry for tracing
- Prometheus + Grafana for metrics

---

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org) ≥ 20
- [pnpm](https://pnpm.io) ≥ 9 (preferred) or [npm](https://npmjs.com) ≥ 10
- [Bun](https://bun.sh) ≥ 1.3 (only for the realtime mini-service dev watcher)

### Install & Run

```bash
# Install dependencies
pnpm install

# Set up the database (SQLite file at db/custom.db)
pnpm run db:push

# Seed demo data (organization, 8 devices, 24h telemetry, automations, alerts)
pnpm run seed

# Start the realtime mini-service (port 3003)
cd mini-services/realtime-service
pnpm install
pnpm run dev
# → leave this running in a terminal

# Start the Next.js dev server (port 3000)
cd ../..
pnpm run dev
```

Open `http://localhost:3000` (or use the Preview Panel in the sandbox).

### Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm run dev` | Start Next.js dev server on port 3000 |
| `pnpm run lint` | Run ESLint |
| `pnpm run db:push` | Push Prisma schema to SQLite |
| `pnpm run db:generate` | Regenerate Prisma Client |
| `pnpm run seed` | Seed demo data |
| `pnpm run build` | Production build (standalone output) |
| `pnpm run start` | Start production server (port 3000) |

### Quick Restart

A helper script restarts both services cleanly:

```bash
./restart.sh
```

---

## Deployment

### Production Build

```bash
# 1. Build the Next.js standalone output
pnpm run build

# 2. The standalone server is at .next/standalone/server.js
#    Start it with:
pnpm run start

# 3. The realtime mini-service should be run as a separate process:
cd mini-services/realtime-service
pnpm install
pnpm run start
```

### Docker Deployment

For production, use Docker Compose. Create a `docker-compose.yml`:

```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=file:/data/db/custom.db
      - NODE_ENV=production
    volumes:
      - db-data:/data/db
    depends_on:
      - realtime

  realtime:
    build: ./mini-services/realtime-service
    environment:
      - DATABASE_URL=file:/data/db/custom.db
    volumes:
      - db-data:/data/db

volumes:
  db-data:
```

Create a `Dockerfile`:

```dockerfile
# Multi-stage build
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN npm install --legacy-peer-deps

FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/db ./db
EXPOSE 3000
CMD ["node", "server.js"]
```

### Environment Checklist for Production

Before deploying, ensure:

- [ ] `DATABASE_URL` points to a persistent volume (SQLite) or PostgreSQL connection string
- [ ] The realtime mini-service is running on port 3003 and accessible from the web app
- [ ] The Caddy/Nginx gateway is configured to route `?XTransformPort=3003` to the realtime service
- [ ] All environment variables in `.env.example` are set
- [ ] `bun run lint` passes with 0 errors
- [ ] `bun run build` succeeds without errors
- [ ] The database is seeded (`bun run scripts/seed.ts`) for initial demo data
- [ ] HTTPS/TLS is configured for production
- [ ] CORS headers are restricted to your domain
- [ ] Rate limiting is enabled on auth + command endpoints

### Production Deployment (Vercel + Neon)

SensorGrid is deployed live on Vercel with single-platform, 100% free serverless architecture:

- **Live App**: [https://sensor-grid-gamma.vercel.app](https://sensor-grid-gamma.vercel.app)
- **Database**: Managed Neon PostgreSQL attached to Vercel project (`DATABASE_URL`)
- **Realtime Engine**: Serverless SSE (Server-Sent Events) in-app driver (`/api/realtime`) with outbox pattern (`RealtimeEvent` table) + auto-reconnecting browser `EventSource`
- **Framework**: Next.js 16 (App Router) + Prisma 6 + Tailwind CSS

### Health Check & Live Endpoints

- **Live Dashboard**: [https://sensor-grid-gamma.vercel.app](https://sensor-grid-gamma.vercel.app)
- **API Health & Metadata**: `GET /api` — [https://sensor-grid-gamma.vercel.app/api](https://sensor-grid-gamma.vercel.app/api)
- **Dashboard Stats & Fleet API**: `GET /api/dashboard` — [https://sensor-grid-gamma.vercel.app/api/dashboard](https://sensor-grid-gamma.vercel.app/api/dashboard)
- **SSE Stream**: `GET /api/realtime` — [https://sensor-grid-gamma.vercel.app/api/realtime](https://sensor-grid-gamma.vercel.app/api/realtime)

---

## Realtime & MQTT Setup

### How Realtime Works in This Deployment

The realtime mini-service (`mini-services/realtime-service/index.ts`) replaces the MQTT broker + worker from the production architecture. It:

1. Loads all online devices from the database
2. Every **5 seconds**, generates organic telemetry for each device's sensors (sine wave + daily cycle + noise)
3. Persists each point to the `Telemetry` table and updates the `DeviceTwin.reported` state
4. Broadcasts a `device.telemetry` event to all connected browsers via socket.io
5. Evaluates `AlertRule`s against the fresh value — if a threshold is breached (and cooldown has passed), creates an `AlertEvent` + `Notification` and broadcasts `alert.triggered`
6. Evaluates `Automation`s whose trigger matches the telemetry — walks the React Flow graph (trigger → condition → action/notification) and executes matching nodes
7. Every **15 seconds**, checks device health — if `lastSeen` is stale beyond the grace period, marks the device `OFFLINE` and triggers device-offline automations
8. When a command is forwarded from the API (`POST /api/devices/[id]/commands`), simulates device ack after ~1s, applies the payload to the twin, and broadcasts `command.created` → `command.updated` (ACKNOWLEDGED) → `command.updated` (COMPLETED)

### MQTT Topic Structure (Production Architecture)

In the full architecture, devices publish to hierarchical topics:

```
sensorgrid/{org}/{device}/telemetry
sensorgrid/{org}/{device}/state
sensorgrid/{org}/{device}/command
sensorgrid/{org}/{device}/event
sensorgrid/{org}/{device}/status
```

Example telemetry payload:

```json
{
  "timestamp": "2025-01-15T10:42:00Z",
  "temperature": 26.4,
  "humidity": 68,
  "light": 420
}
```

Device authentication uses per-device credentials (username/password or client certificates). The broker enforces per-device ACLs — Device A may only publish to `sensorgrid/org1/deviceA/telemetry` and subscribe to `sensorgrid/org1/deviceA/command`.

### Connecting a Real ESP32

To connect a physical ESP32 instead of using the simulator:

1. Flash firmware that connects to your MQTT broker (Mosquitto)
2. Use the device credentials from `DeviceCredential` (visible in the device detail page)
3. Publish telemetry to `sensorgrid/sensorgrid-hq/{deviceId}/telemetry`
4. Subscribe to `sensorgrid/sensorgrid-hq/{deviceId}/command` for commands
5. Run the MQTT gateway service that bridges broker messages → database + socket.io (this is what the realtime-service simulates)

---

## Device Simulator

The realtime mini-service includes a built-in device simulator (the spec's `apps/device-simulator` equivalent). It:

- Connects to the database directly (no real MQTT needed)
- Publishes telemetry every 5 seconds for all online devices
- Simulates battery drain (0.4%/hour for ESP32)
- Simulates signal strength variation
- Produces organic-looking values using sine waves with daily cycles
- Triggers alert rules and automations naturally as values cross thresholds

To add a new simulated device, insert a row into the `Device` table with status `ONLINE` and create `Sensor` rows for it. The simulator picks it up on the next reload cycle (every 60s).

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL=file:/home/z/my-project/db/custom.db

# Realtime service
REALTIME_PORT=3003

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Production-only (not required for sandbox)
# REDIS_URL=redis://localhost:6379
# MQTT_URL=mqtt://localhost:1883
# MQTT_USERNAME=...
# MQTT_PASSWORD=...
# SESSION_SECRET=...
# S3_ENDPOINT=...
# S3_BUCKET=...
# SMTP_HOST=...
# SENTRY_DSN=...
# OTEL_EXPORTER_OTLP_ENDPOINT=...
```

All environment variables are validated at startup. Never commit `.env`.

---

## Authentication & Logout

### Current State (Demo)

This sandbox deployment uses a **demo authentication model** — there is a single seeded user (`SensorGrid Operator` / `operator@sensorgrid.dev`) who is always "logged in". There is no login screen; the app loads directly into the dashboard.

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth` | Get current user + organization context |
| POST | `/api/auth` | Demo login (always returns the demo user) |
| POST | `/api/auth/logout` | Logout — records audit entry, clears session cookie |

### Logout Flow

1. User clicks **"Log out"** in either:
   - The header profile dropdown (top-right avatar → bottom of menu)
   - The sidebar user card dropdown (bottom-left user info → bottom of popover)
2. The app calls `POST /api/auth/logout`
3. An `auth.logout` audit log entry is recorded
4. The session cookie is cleared
5. A success toast appears: "Signed out — You have been logged out of SensorGrid."
6. The view resets to the Dashboard

### Production Authentication

For production, integrate **NextAuth.js v4** (already installed):

```bash
# .env
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key
```

Configure providers (email/password, GitHub, Google) in `src/lib/auth.ts` and protect API routes with session checks. The current `DEMO_ORG_ID` and `DEMO_USER_ID` constants in `src/lib/api.ts` should be replaced with session-derived values.

---

## Testing

### Strategy

The testing strategy follows the spec:

- **Unit tests** — telemetry validation, automation evaluator, alert evaluator, digital twin merge, command state transitions, RBAC, DTO validation
- **Integration tests** — Prisma queries, realtime service, device registration, telemetry ingestion, automation execution, alert generation
- **E2E tests** — the full acceptance scenario: register → create org → register device → publish telemetry → dashboard updates → create automation → temperature exceeds threshold → automation sends command → device acknowledges → alert appears → user acknowledges → audit verified

### Running Tests

```bash
# Unit + integration (when added)
pnpm test

# E2E with Playwright (when added)
npx playwright test
```

> **Note:** The sandbox deployment focuses on the working application. Test scaffolding is stubbed for the production architecture.

---

## CI/CD

The production CI/CD pipeline uses GitHub Actions:

**Pull Request pipeline:**
```
Install → Lint → Typecheck → Unit Tests → Integration Tests → Build
```

**Main branch pipeline:**
```
Tests → Docker Build → Image Publish → Deployment
```

- Cache dependencies
- Fail on TypeScript errors
- Multi-stage Docker builds
- Non-root containers
- Health checks on all services

---

## Observability

### Request Tracing

Every API request includes a `requestId`. Logs include `requestId`, `userId`, `organizationId`, `deviceId`, `route`, `duration`, `status`.

### Metrics

The realtime service tracks (visible in the dashboard):
- `mqtt_messages_total` (simulated as telemetry points)
- `telemetry_ingested_total`
- `automation_execution_total`
- `automation_failure_total`
- `alert_trigger_total`
- `device_online_total` / `device_offline_total`
- `command_duration` / `command_failure_total`

### Production Integrations

- **Sentry** — error tracking + performance
- **OpenTelemetry** — distributed tracing
- **Prometheus** — metrics scraping
- **Grafana** — dashboards

---

## Security

### Implemented

- ✅ RBAC with organization-level roles (OWNER, ADMIN, ENGINEER, OPERATOR, VIEWER)
- ✅ Organization-scoped queries (every resource query includes `organizationId`)
- ✅ Audit logs on every important action
- ✅ Payload validation (Zod schemas on all API inputs)
- ✅ Telemetry quality states (GOOD, ESTIMATED, INVALID, MISSING) — invalid data is never silently treated as valid
- ✅ Device command authorization (commands go through `/api/devices/[id]/commands`, never direct MQTT)
- ✅ Topic authorization (in production: per-device ACLs prevent cross-device access)
- ✅ Secure HTTP-only cookies (in production with NextAuth)
- ✅ Rate limiting architecture (login, registration, command creation)
- ✅ No secrets in frontend / logs

### Production Hardening

- TLS for all traffic
- Argon2id password hashing
- CSRF protection
- MQTT TLS + per-device certificates
- Secret rotation
- Brute-force protection
- CORS restrictions
- Secure headers

---

## Project Structure

```
sensor-grid/
├── src/
│   ├── app/
│   │   ├── api/                    # REST API routes
│   │   │   ├── dashboard/          # Aggregated stats + environment
│   │   │   ├── devices/            # CRUD + telemetry + commands + twin + history
│   │   │   ├── automations/        # CRUD + execute
│   │   │   ├── alerts/             # List + acknowledge + resolve
│   │   │   ├── notifications/      # List + mark read
│   │   │   ├── audit/              # Audit log
│   │   │   ├── analytics/          # Aggregated metrics
│   │   │   ├── org/               # Organization + members
│   │   │   ├── locations/          # Location CRUD
│   │   │   └── auth/               # Demo auth
│   │   ├── globals.css             # Aether Grid design tokens
│   │   ├── layout.tsx              # Root layout with providers
│   │   └── page.tsx                # Main app shell (single visible route)
│   ├── components/
│   │   ├── aether/                 # Signature Aether Grid components
│   │   ├── charts/                 # Sparkline + TelemetryChart
│   │   ├── shell/                  # Sidebar, header, footer, command palette, notifications
│   │   ├── ui/                     # shadcn/ui components
│   │   └── views/                  # View components (dashboard, devices, etc.)
│   ├── lib/
│   │   ├── api.ts                  # API DTO mappers + org context
│   │   ├── db.ts                   # Prisma client
│   │   ├── hooks.ts                # TanStack Query hooks + realtime subscription
│   │   ├── realtime.ts            # socket.io client hook
│   │   ├── realtime-server.ts      # Server-side socket bridge (for API → service)
│   │   ├── status.tsx              # Status metadata + formatters
│   │   ├── store.ts                # Zustand app store
│   │   ├── types.ts                # Shared domain types
│   │   └── utils.ts                # cn() helper
│   └── hooks/
├── prisma/
│   └── schema.prisma               # Full IoT data model
├── mini-services/
│   └── realtime-service/           # socket.io mini-service (port 3003)
│       ├── index.ts                # Telemetry simulator + alert/automation engine
│       └── package.json
├── scripts/
│   └── seed.ts                     # Database seeder
├── Caddyfile                       # Gateway config (XTransformPort routing)
├── restart.sh                      # Quick service restart helper
└── package.json
```

---

## API Reference

All API routes are under `/api`. The base URL in production would be `/api/v1`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Aggregated stats + environment + recent activity + devices |
| GET | `/api/devices` | List devices (filter by `status`, `locationId`, `q`) |
| GET | `/api/devices/[id]` | Get single device with sensors + twin |
| PATCH | `/api/devices/[id]` | Update device name/notes/tags/status |
| DELETE | `/api/devices/[id]` | Delete device |
| GET | `/api/devices/[id]/telemetry` | Time-series (params: `sensorKey`, `range`) |
| GET | `/api/devices/[id]/commands` | Command history |
| POST | `/api/devices/[id]/commands` | Send command (body: `{ payload }`) |
| GET | `/api/devices/[id]/twin` | Get digital twin |
| PATCH | `/api/devices/[id]/twin` | Update desired state |
| GET | `/api/devices/[id]/history` | Combined audit + command timeline |
| GET | `/api/automations` | List automations |
| POST | `/api/automations` | Create automation |
| GET | `/api/automations/[id]` | Get automation with executions |
| PATCH | `/api/automations/[id]` | Update automation (nodes/edges/enabled) |
| DELETE | `/api/automations/[id]` | Delete automation |
| POST | `/api/automations/[id]/execute` | Manual trigger |
| GET | `/api/alerts` | Alert events + rules (filter by `status`, `severity`) |
| POST | `/api/alerts` | Create alert rule |
| PATCH | `/api/alerts/[id]/acknowledge` | Acknowledge alert |
| PATCH | `/api/alerts/[id]/resolve` | Resolve alert |
| GET | `/api/notifications` | List notifications (filter: `unread`) |
| PATCH | `/api/notifications` | Mark all read |
| PATCH | `/api/notifications/[id]/read` | Mark single read |
| GET | `/api/audit` | Audit log (filter: `action`, `targetType`, `limit`) |
| GET | `/api/analytics` | Aggregated metrics (param: `range`) |
| GET | `/api/org` | Organization + members + stats |
| GET | `/api/locations` | List locations |
| POST | `/api/locations` | Create location |
| GET | `/api/auth` | Demo auth (GET me / POST login) |

---

## WebSocket Events

The realtime service emits events on the `event` channel. Clients connect via `io('/?XTransformPort=3003')`.

### Server → Client Events

```typescript
type ServerSocketEvent =
  | { type: 'device.telemetry'; deviceId: string; sensorKey: string; value: number; unit: string; quality: TelemetryQuality; timestamp: string }
  | { type: 'device.online'; deviceId: string; deviceName: string; timestamp: string }
  | { type: 'device.offline'; deviceId: string; deviceName: string; timestamp: string }
  | { type: 'device.state'; deviceId: string; status: DeviceStatus; health: DeviceHealth; battery: number | null; signal: number | null; lastSeen: string }
  | { type: 'command.created'; command: CommandDTO }
  | { type: 'command.updated'; command: CommandDTO }
  | { type: 'automation.started'; execution: AutomationExecutionDTO }
  | { type: 'automation.completed'; execution: AutomationExecutionDTO }
  | { type: 'alert.triggered'; alert: AlertEventDTO }
  | { type: 'alert.acknowledged'; alert: AlertEventDTO }
  | { type: 'alert.resolved'; alert: AlertEventDTO }
  | { type: 'notification.created'; notification: NotificationDTO }
  | { type: 'activity'; log: AuditLogDTO }
```

### Client → Server Events

```typescript
type ClientSocketEvent =
  | { type: 'subscribe'; organizationId: string }
  | { type: 'command.send'; deviceId: string; payload: Record<string, unknown> }
```

---

## Roadmap

### Implemented (MVP)

- ✅ Authentication (demo)
- ✅ Organizations + members + RBAC
- ✅ Device registration + credentials + metadata
- ✅ Locations & zones (hierarchical)
- ✅ Telemetry ingestion + persistence + realtime broadcast
- ✅ Historical charts with downsampling + time ranges
- ✅ Digital twin (desired vs reported)
- ✅ Device commands (async, with ack + completion)
- ✅ Automation engine with visual React Flow builder
- ✅ Alert engine with rules + lifecycle
- ✅ Notifications (in-app)
- ✅ Audit log
- ✅ Analytics with aggregation
- ✅ Realtime dashboard
- ✅ Command console
- ✅ Dark/light themes

### Future

- **OTA Firmware** — remote firmware update workflow
- **Mobile App** — React Native client
- **Matter Integration** — emerging smart-home ecosystems
- **LoRaWAN Gateway** — long-range agricultural devices
- **Edge Computing** — local gateway that continues automations during internet outages
- **AI Insights** — anomaly detection, predictive maintenance, natural language dashboard queries
- **Floor Plan Mode** — upload floor plan, drag devices onto rooms, realtime environmental heat map
- **Email/Slack/Discord/Telegram notifications**
- **S3-compatible object storage** for device images + floor plans
- **OAuth** (GitHub, Google)
- **Multi-organization switching**

---

## Limitations

This sandbox deployment has the following limitations compared to the full production architecture:

| Aspect | Sandbox | Production Target |
|--------|---------|-------------------|
| Database | SQLite (single file) | PostgreSQL + TimescaleDB |
| Caching | In-memory | Redis |
| Message queue | In-process (setInterval) | BullMQ + Redis Streams |
| MQTT broker | Simulated by realtime-service | Mosquitto (real broker) |
| Backend | Next.js API Routes | NestJS (modular monolith) |
| Deployment | Single Next.js app | Docker Compose (web, api, worker, mqtt, postgres, redis, prometheus, grafana) |
| Auth | Demo (always "SensorGrid Operator") | NextAuth.js v4 with sessions |
| Object storage | Local filesystem | S3-compatible |
| Email | Not configured | SMTP |
| Observability | Console logs | Sentry + OpenTelemetry + Prometheus + Grafana |
| Testing | Manual browser verification | Vitest + Jest + RTL + Supertest + Playwright |

The data model, API surface, design system, and realtime protocol are production-shaped so the same code can be lifted onto the intended infrastructure with minimal changes.

---

## License

MIT — Built as a portfolio-grade demonstration of modern full-stack IoT engineering.

---

> **SensorGrid** — *Connect devices. Observe everything. Automate intelligently.*
