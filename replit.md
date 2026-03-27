# Vitals Overwatch

## Overview

A proactive family health intelligence platform that transitions wellness from reactive crisis management to data-driven prevention. Unifies biometric data from wearables (Apple Watch, Oura, Whoop) into a family dashboard with AI-driven anomaly detection.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild
- **Frontend**: React + Vite + Tailwind + shadcn/ui
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Routing**: Wouter

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── vitals-overwatch/   # React frontend (dark health-tech UI)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/
│   └── src/seed.ts         # Demo data seeder
```

## Key Features

- **Family Dashboard** — health cards for all members with HRV, RHR, SpO2 and alert counts
- **Guardian View** — focused monitoring page for elderly/high-risk members with large metric displays
- **Member Detail** — 7/14/30-day biometric time-series charts with baseline overlay
- **Baseline Report** — physician-ready clinical report with anomaly timeline and trends
- **Alerts Page** — filterable list of all family anomaly events with resolve functionality
- **AI Anomaly Detection** — z-score based detection comparing readings against 30-day personal baseline

## Database Schema

### `family_members`
- id, name, age, relationship, avatarInitials, wearableSource, isHighRisk, guardianViewEnabled, createdAt

### `vitals_readings`
- id, memberId, timestamp, heartRateVariability, restingHeartRate, spo2, sleepScore, recoveryScore, bodyTemperature, respiratoryRate, anomalyScore, anomalyFlags

### `health_alerts`
- id, memberId, severity (low/medium/high/critical), alertType, title, description, deviationPercent, detectedAt, resolved, resolvedAt

## API Endpoints

All under `/api`:
- `GET /api/dashboard/overview` — family overview cards + recent alerts
- `GET /api/family/members` — list all members
- `POST /api/family/members` — add a member
- `GET /api/family/members/:id` — single member
- `GET /api/family/members/:id/vitals?days=7` — vitals history
- `POST /api/family/members/:id/vitals` — record new reading (auto-computes anomaly)
- `GET /api/family/members/:id/baseline` — 30-day computed baseline
- `GET /api/family/members/:id/summary` — health summary with trends
- `GET /api/alerts` — all alerts (filter: ?memberId= ?resolved=)
- `POST /api/alerts/:id/resolve` — resolve an alert
- `GET /api/reports/:memberId?days=30` — generate clinical baseline report

## Development

- `pnpm --filter @workspace/vitals-overwatch run dev` — run frontend
- `pnpm --filter @workspace/api-server run dev` — run API server
- `pnpm --filter @workspace/db run push` — push schema to DB
- `pnpm --filter @workspace/scripts run seed` — seed demo data
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client
