# Vitals Overwatch

## Overview

A proactive family health intelligence platform that transitions wellness from reactive crisis management to data-driven prevention. Unifies biometric data from wearables (Apple Watch, Oura, Whoop, Garmin) into a family dashboard with AI-driven anomaly detection and 72-hour predictive forecasting.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Replit Auth (OpenID Connect PKCE) via `@workspace/replit-auth-web`
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
│   ├── api-server/         # Express API server (port from $PORT env)
│   └── vitals-overwatch/   # React frontend (dark health-tech UI)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks (dist/ must be rebuilt after codegen)
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   └── replit-auth-web/    # useAuth hook (dist/ must be rebuilt when changed)
├── scripts/
│   └── src/seed.ts         # Demo data seeder
```

## Key Features

- **Landing Page** — cinematic marketing page with Framer Motion animations and demo forecast chart. Shows for unauthenticated users.
- **Replit Auth** — Sign In redirects to `/api/login`, on success routes to dashboard
- **Family Dashboard** — health cards for all members with HRV, RHR, SpO2 and alert counts
- **Guardian View** — focused monitoring page for elderly/high-risk members with large metric displays
- **Member Detail** — 7/14/30-day biometric time-series charts with baseline overlay
- **Baseline Report** — physician-ready clinical report with anomaly timeline and trends
- **Alerts Page** — filterable list of all family anomaly events with resolve functionality
- **AI Anomaly Detection** — z-score based detection comparing readings against 30-day personal baseline
- **Biometric Time-Travel** — 24/48/72hr AI forecast (Holt-Winters + linear regression), confidence band charts, predicted health events with probability scores
- **Providers Page** — connect/disconnect Apple Watch, Oura, Whoop, Garmin, Fitbit; sync generates realistic vitals data
- **Profile Page** — user stats (streak, readings, alerts), settings (timezone, notifications, guardian email)

## Database Schema

### `family_members`
- id, name, age, relationship, avatarInitials, wearableSource, isHighRisk, guardianViewEnabled, createdAt

### `vitals_readings`
- id, memberId, timestamp, heartRateVariability, restingHeartRate, spo2, sleepScore, recoveryScore, bodyTemperature, respiratoryRate, anomalyScore, anomalyFlags

### `health_alerts`
- id, memberId, severity (low/medium/high/critical), alertType, title, description, deviationPercent, detectedAt, resolved, resolvedAt

### `sessions`
- id (UUID), data (JSONB), expiresAt

### `users`
- id (Replit sub), email, firstName, lastName, profileImageUrl, createdAt, updatedAt

### `user_profiles`
- userId, timezone, notificationsEnabled, guardianAlertEmail, onboardingComplete, defaultFamilyMemberId

### `device_connections`
- id, userId, provider, memberId, connectedAt, lastSyncAt, syncedReadings, status

## API Endpoints

All under `/api`:
- `GET /api/auth/user` — current auth user (returns `{ isAuthenticated, user }`)
- `GET /api/login` — Replit OAuth redirect
- `GET /api/callback` — OAuth callback
- `GET /api/logout` — logout + redirect
- `GET /api/dashboard/overview` — family overview cards + recent alerts
- `GET /api/family/members` — list all members
- `POST /api/family/members` — add a member
- `GET /api/family/members/:id` — single member
- `GET /api/family/members/:id/vitals?days=7` — vitals history
- `POST /api/family/members/:id/vitals` — record new reading
- `GET /api/family/members/:id/baseline` — 30-day computed baseline
- `GET /api/family/members/:id/summary` — health summary with trends
- `GET /api/alerts` — all alerts (filter: ?memberId= ?resolved=)
- `POST /api/alerts/:id/resolve` — resolve an alert
- `GET /api/reports/:memberId?days=30` — clinical baseline report
- `GET /api/profile` — user profile
- `PATCH /api/profile` — update profile
- `GET /api/profile/stats` — profile stats (streak, readings, etc.)
- `GET /api/providers` — list data providers with connection status
- `POST /api/providers/:provider/connect` — connect a provider
- `DELETE /api/providers/:provider/disconnect` — disconnect a provider
- `POST /api/providers/:provider/sync` — sync data from provider
- `GET /api/forecast/:memberId?horizonHours=72` — AI biometric forecast

## Important Notes

- After running `pnpm --filter @workspace/api-spec run codegen`, rebuild dist for `lib/api-client-react` and `lib/replit-auth-web` using `./node_modules/.bin/tsc -p lib/<package>/tsconfig.json`
- The `SESSION_SECRET` env var must be set for sessions to work
- Auth requires `REPL_ID` env var (auto-set by Replit)

## Development

- `pnpm --filter @workspace/vitals-overwatch run dev` — run frontend
- `pnpm --filter @workspace/api-server run dev` — run API server
- `pnpm --filter @workspace/db run push` — push schema to DB
- `pnpm --filter @workspace/scripts run seed` — seed demo data
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client
- `./node_modules/.bin/tsc -p lib/api-client-react/tsconfig.json` — rebuild API client types
- `./node_modules/.bin/tsc -p lib/replit-auth-web/tsconfig.json` — rebuild auth lib types
