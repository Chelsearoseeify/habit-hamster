# Habit Hamster — Backend Migration & Web Push Notifications

A technical document covering the architecture decisions, implementation plan, and step-by-step changes made to migrate Habit Hamster from a local-only PWA to a cloud-backed app with real push notifications.

---

## Table of Contents

1. [Background & Motivation](#1-background--motivation)
2. [Architecture Overview](#2-architecture-overview)
3. [Tech Stack Decisions](#3-tech-stack-decisions)
4. [Repository Structure](#4-repository-structure)
5. [Phase 1 — Turborepo Monorepo Setup](#5-phase-1--turborepo-monorepo-setup)
6. [Phase 2 — Shared Types Package](#6-phase-2--shared-types-package)
7. [Phase 3 — Hono API + Turso Database](#7-phase-3--hono-api--turso-database)
8. [Phase 4 — Frontend Migration (Dexie → API)](#8-phase-4--frontend-migration-dexie--api)
9. [Phase 5 — Web Push Notifications](#9-phase-5--web-push-notifications)
10. [Phase 6 — Vercel Deployment](#10-phase-6--vercel-deployment)
11. [Environment Variables Reference](#11-environment-variables-reference)
12. [First-Time Setup Guide](#12-first-time-setup-guide)
13. [Data Migration from IndexedDB](#13-data-migration-from-indexeddb)
14. [How It All Works Together](#14-how-it-all-works-together)

---

## 1. Background & Motivation

### The Problem

The original Habit Hamster app stored all data in **IndexedDB** (via Dexie) directly in the browser. This worked fine locally but created two problems:

**Problem 1 — Notifications don't work on mobile**

The app used `setTimeout` inside the service worker to fire notifications at scheduled times. Mobile browsers (especially iOS Safari and Android Chrome) aggressively kill service workers when the app is backgrounded. The timers are lost, and notifications never fire.

**Problem 2 — No backend access to data**

To send reliable push notifications, a backend needs to know *when* to notify (routine schedules) and *what* to say. With data locked in the device's IndexedDB, no server could read it.

### The Solution

Move data to a hosted cloud database (Turso) so:
- The backend can read routine schedules
- A cron job runs every minute, checks schedules, and sends Web Push notifications via the browser's push infrastructure
- Notifications arrive even when the app is completely closed

---

## 2. Architecture Overview

### Before

```
Phone (PWA)
  └── IndexedDB (Dexie)   ← all data, local only
  └── Service Worker      ← setTimeout timers (unreliable on mobile)
```

### After

```
Phone (PWA)
  └── fetch() → API       ← reads/writes data
  └── Service Worker      ← listens for `push` events (reliable)
        ↑
Browser Push Service (Google/Apple infrastructure)
        ↑
Vercel Serverless API
  └── Turso (hosted SQLite)   ← routines, completions, push subscriptions
        ↑
cron-job.org (every minute)   ← calls POST /api/cron/notify
```

### Notification Flow

```
1. User enables notifications in app
2. Browser generates a unique push subscription (endpoint + keys)
3. App POSTs subscription to POST /api/push/subscribe → saved in Turso
4. Every minute, cron-job.org calls POST /api/cron/notify
5. API checks current local time (CET/CEST) against routine timeRange.start values
6. For matching routines, sends Web Push message to all subscriptions
7. Browser Push Service delivers it to the device (even if app is closed)
8. Service worker receives `push` event → shows notification
```

---

## 3. Tech Stack Decisions

| Layer | Choice | Reason |
|---|---|---|
| Monorepo | **Turborepo** + pnpm workspaces | Shared types between frontend/backend, single `pnpm dev` to run both |
| Database | **Turso** (hosted SQLite) | Free tier (9GB, 1B reads/month), SQLite schema matches existing Dexie schema |
| Backend framework | **Hono** | Lightweight, runs on Vercel serverless functions, TypeScript-native |
| Hosting | **Vercel** | Free tier, handles both frontend (Vite build) and backend (serverless) in one deploy |
| Push notifications | **Web Push (VAPID)** | Browser-native standard, works on Android and iOS 16.4+ |
| Cron scheduling | **cron-job.org** | Free, minute-level scheduling (Vercel free tier only allows daily cron) |
| Offline support | **None** | Removed Dexie entirely. App requires internet. Reduces complexity significantly. |

---

## 4. Repository Structure

```
habit-hamster/
├── package.json                   ← workspace root (turbo scripts, no app deps)
├── pnpm-workspace.yaml            ← declares apps/* and packages/*
├── turbo.json                     ← build pipeline (build depends on ^build)
├── vercel.json                    ← deployment config
├── .env.example                   ← all required env vars documented
│
├── apps/
│   ├── web/                       ← Vite + React frontend
│   │   ├── package.json           ← @habit-hamster/web
│   │   ├── vite.config.ts         ← + dev proxy: /api → localhost:3000
│   │   └── src/
│   │       ├── lib/
│   │       │   ├── api.ts         ← NEW: typed fetch wrapper (all API calls)
│   │       │   ├── storage.ts     ← re-exports from api.ts (unchanged interface)
│   │       │   └── notifications.ts ← NEW: subscribeToWebPush()
│   │       ├── hooks/
│   │       │   ├── useRoutines.ts ← updated: individual API calls
│   │       │   └── useCompletions.ts ← updated: optimistic + API sync
│   │       └── sw.ts              ← updated: handles `push` events
│   │
│   └── api/                       ← Hono backend
│       ├── package.json           ← @habit-hamster/api
│       └── src/
│           ├── index.ts           ← Hono app + Vercel handler exports
│           ├── db.ts              ← Turso client + row→type mappers
│           ├── schema.sql         ← canonical DB schema (run once)
│           ├── routes/
│           │   ├── routines.ts    ← GET/POST/PATCH/DELETE /routines
│           │   ├── completions.ts ← GET/PUT/DELETE /completions/:id/:date
│           │   ├── gamification.ts← GET/PUT + perfect-day bonus
│           │   └── push.ts        ← POST/DELETE /push/subscribe
│           ├── lib/
│           │   └── webpush.ts     ← VAPID setup + sendPushNotification()
│           └── cron/
│               └── notify.ts     ← POST /cron/notify (protected endpoint)
│
└── packages/
    └── types/                     ← @habit-hamster/types
        └── src/index.ts           ← Routine, Completion, GamificationState, etc.
```

---

## 5. Phase 1 — Turborepo Monorepo Setup

### What changed

The existing single-package project was restructured into a monorepo without changing any app behavior.

**Files moved (git mv, history preserved):**
```
src/          → apps/web/src/
index.html    → apps/web/index.html
public/       → apps/web/public/
vite.config.ts → apps/web/vite.config.ts
tailwind.config.js → apps/web/tailwind.config.js
postcss.config.js  → apps/web/postcss.config.js
tsconfig*.json     → apps/web/
components.json    → apps/web/
eslint.config.js   → apps/web/
```

**New root files created:**

`pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

`turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev":   { "persistent": true, "cache": false },
    "lint":  {}
  }
}
```

Root `package.json` (workspace root — no app dependencies):
```json
{
  "name": "habit-hamster-monorepo",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint"
  },
  "devDependencies": { "turbo": "^2.0.0" },
  "packageManager": "pnpm@10.30.3",
  "pnpm": { "onlyBuiltDependencies": ["esbuild"] }
}
```

**Why `^build` in turbo.json?**
The `^` means "run the `build` task in all dependencies first". So if `apps/web` depends on `packages/types`, types gets built before web. This ensures shared packages are always compiled before consumers.

---

## 6. Phase 2 — Shared Types Package

### Why a shared types package?

Without it, `Routine`, `Completion`, etc. would need to be duplicated in both the frontend and backend. Any change to a type would require updating two places, and they could drift out of sync.

### `packages/types/src/index.ts`

```typescript
export type FrequencyType =
  | { type: 'daily'; timesPerDay: number }
  | { type: 'weekly'; timesPerWeek: number }
  | { type: 'weekdays'; days: number[] }
  | { type: 'interval'; days: number }

export interface Routine {
  id: string
  name: string
  category: string
  frequency: FrequencyType
  timeRange?: { start: string; end?: string }
  preferredDays?: number[]
  description?: string
  createdAt: string
  paused?: boolean
}

export interface Completion {
  routineId: string
  date: string     // YYYY-MM-DD
  count: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt?: string
}

export interface GamificationState {
  xp: number
  level: number
  achievements: Achievement[]
  streakFreezes: number
}

export interface PushSubscriptionPayload {
  endpoint: string
  keys: { p256dh: string; auth: string }
}
```

### How it's consumed

`apps/web/src/types/index.ts` becomes a thin re-export:
```typescript
export * from '@habit-hamster/types'

// Web-only types (not needed by backend)
export type ViewType = 'day' | 'week' | 'month' | 'year' | 'rewards' | 'routines'
export const CATEGORIES = ['Fitness', 'Nutrition', 'Skincare', 'Supplements'] as const
export type Category = (typeof CATEGORIES)[number]
```

All existing components still import from `@/types` — zero import changes needed anywhere else.

---

## 7. Phase 3 — Hono API + Turso Database

### Database Schema (`apps/api/src/schema.sql`)

```sql
CREATE TABLE IF NOT EXISTS routines (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  category     TEXT NOT NULL,
  frequency    TEXT NOT NULL,       -- JSON blob: FrequencyType
  time_range   TEXT,                -- JSON blob: {start, end?} or NULL
  preferred_days TEXT,              -- JSON blob: number[] or NULL
  description  TEXT,
  created_at   TEXT NOT NULL,
  paused       INTEGER NOT NULL DEFAULT 0   -- 0=false, 1=true (SQLite has no boolean)
);

CREATE TABLE IF NOT EXISTS completions (
  routine_id  TEXT NOT NULL,
  date        TEXT NOT NULL,        -- YYYY-MM-DD
  count       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (routine_id, date),
  FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gamification (
  id              TEXT PRIMARY KEY DEFAULT 'current',
  xp              INTEGER NOT NULL DEFAULT 0,
  level           INTEGER NOT NULL DEFAULT 1,
  achievements    TEXT NOT NULL DEFAULT '[]',   -- JSON blob: Achievement[]
  streak_freezes  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS perfect_day_bonuses (
  date TEXT PRIMARY KEY   -- YYYY-MM-DD
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          TEXT PRIMARY KEY,
  endpoint    TEXT NOT NULL UNIQUE,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

INSERT OR IGNORE INTO gamification (id) VALUES ('current');
```

**Schema decisions:**
- `frequency`, `time_range`, `preferred_days` stored as JSON strings — matches what Dexie stored, avoids a complex normalized schema for a personal app
- `paused` as `INTEGER` (0/1) — SQLite has no native boolean
- `completions` compound primary key `(routine_id, date)` — matches Dexie's `[routineId+date]` index
- `push_subscriptions.endpoint` has `UNIQUE` constraint — upsert on re-subscribe from same device

### Turso Client (`apps/api/src/db.ts`)

```typescript
import { createClient } from '@libsql/client'

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

// Converts a raw DB row to a typed Routine object
export function rowToRoutine(row: Record<string, unknown>): Routine {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as string,
    frequency: JSON.parse(row.frequency as string),
    timeRange: row.time_range ? JSON.parse(row.time_range as string) : undefined,
    preferredDays: row.preferred_days ? JSON.parse(row.preferred_days as string) : undefined,
    description: (row.description as string) ?? undefined,
    createdAt: row.created_at as string,
    paused: (row.paused as number) === 1,
  }
}
```

### API Routes

| Method | Path | Description |
|---|---|---|
| GET | `/api/routines` | List all routines |
| POST | `/api/routines` | Create routine (server generates id + createdAt) |
| PATCH | `/api/routines/:id` | Partial update (any fields) |
| DELETE | `/api/routines/:id` | Delete + cascade completions |
| GET | `/api/completions` | List all completions |
| PUT | `/api/completions/:routineId/:date` | Upsert completion `{count}` |
| DELETE | `/api/completions/:routineId/:date` | Remove completion |
| GET | `/api/gamification` | Get XP/level/achievements |
| PUT | `/api/gamification` | Save full gamification state |
| GET | `/api/gamification/perfect-day/:date` | Check if bonus awarded |
| POST | `/api/gamification/perfect-day/:date` | Mark bonus as awarded |
| POST | `/api/push/subscribe` | Save push subscription |
| DELETE | `/api/push/unsubscribe` | Remove push subscription |
| POST | `/api/cron/notify` | Cron handler (called by cron-job.org) |
| GET | `/api/health` | Health check |

### Cron Handler Logic (`apps/api/src/cron/notify.ts`)

The cron endpoint runs every minute (called by cron-job.org):

1. **Auth check** — verifies `Authorization: Bearer <CRON_SECRET>` header
2. **Compute local time** — takes UTC time + `TIMEZONE_OFFSET_HOURS` (1 for CET, 2 for CEST)
3. **Routine reminders** — for each non-paused routine with a `timeRange.start`, checks if current local time is within ±1 minute of the scheduled time
4. **Streak risk** — at 20:00 local time, counts incomplete routines and sends a reminder
5. **Send notifications** — sends to all stored push subscriptions
6. **Cleanup** — removes expired subscriptions (HTTP 410/404 from push service)

---

## 8. Phase 4 — Frontend Migration (Dexie → API)

### The key insight: `storage.ts` as a seam

The entire frontend used a single facade file `src/lib/storage.ts` as the data layer:

```typescript
// Before
export { getRoutines, saveRoutines, getCompletions, saveCompletions, ... } from './db'

// After
export { getRoutines, getCompletions, getGamificationState, saveGamificationState,
         getPerfectDayBonus, setPerfectDayBonus } from './api'
```

Changing this one file redirects all data operations from Dexie to the API. `useGamification` needed **zero changes** because it calls the same function names.

### New `apps/web/src/lib/api.ts`

```typescript
const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// Routines — note: no saveRoutines(), now individual operations
export const getRoutines = () => request<Routine[]>('/routines')
export const createRoutine = (r: Omit<Routine, 'id'|'createdAt'>) =>
  request<Routine>('/routines', { method: 'POST', body: JSON.stringify(r) })
export const updateRoutine = (id: string, updates: Partial<...>) =>
  request<Routine>(`/routines/${id}`, { method: 'PATCH', body: JSON.stringify(updates) })
export const deleteRoutine = (id: string) =>
  request<void>(`/routines/${id}`, { method: 'DELETE' })

// Completions — note: no saveCompletions(), now per-record operations
export const getCompletions = () => request<Completion[]>('/completions')
export const upsertCompletion = (routineId: string, date: string, count: number) =>
  request<void>(`/completions/${routineId}/${date}`, { method: 'PUT', body: JSON.stringify({ count }) })
export const removeCompletion = (routineId: string, date: string) =>
  request<void>(`/completions/${routineId}/${date}`, { method: 'DELETE' })
```

### Hook changes

**`useRoutines.ts`** — biggest change: `addRoutine` is now async (server generates ID), individual operations replace bulk `saveRoutines`:

```typescript
const addRoutine = useCallback(async (routine: Omit<Routine, 'id' | 'createdAt'>) => {
  const newRoutine = await createRoutine(routine)   // server returns id
  setRoutines((prev) => [...prev, newRoutine])
  return newRoutine
}, [])

const updateRoutine = useCallback((id: string, updates: ...) => {
  setRoutines((prev) => prev.map((r) => r.id === id ? { ...r, ...updates } : r))  // optimistic
  apiUpdateRoutine(id, updates).catch(console.error)                               // sync to server
}, [])

const deleteRoutine = useCallback((id: string) => {
  setRoutines((prev) => prev.filter((r) => r.id !== id))  // optimistic
  apiDeleteRoutine(id).catch(console.error)                // sync to server
}, [])
```

**`useCompletions.ts`** — optimistic pattern: update state immediately, fire API call in background:

```typescript
const toggleCompletion = useCallback((routineId, date, maxCount = 1) => {
  setCompletions((prev) => {
    // ... compute new state ...
    if (newCount > 0) {
      upsertCompletion(routineId, date, newCount).catch(console.error)
    } else {
      removeCompletion(routineId, date).catch(console.error)
    }
    return updated
  })
}, [])
```

**Why optimistic updates?** Completion toggles happen rapidly (user tapping checkboxes). Waiting for the server before updating the UI would feel laggy. The optimistic approach updates the UI instantly and syncs in the background. If the API call fails, the error is logged but the UI stays responsive.

### Vite dev proxy

Added to `apps/web/vite.config.ts` so `/api` calls during development are forwarded to the local API server:

```typescript
server: {
  proxy: {
    '/api': { target: 'http://localhost:3000', changeOrigin: true }
  }
}
```

This means `VITE_API_URL` doesn't need to be set in local development.

### Bundle size improvement

Removing Dexie reduced the frontend JS bundle from **477 KB → 375 KB** (gzipped: 153 KB → 119 KB).

---

## 9. Phase 5 — Web Push Notifications

### How Web Push works

Web Push is a browser standard that allows servers to send messages to a browser even when the website isn't open. It works through browser vendor infrastructure (Google for Chrome, Apple for Safari):

```
1. Browser creates a push subscription: { endpoint, keys: { p256dh, auth } }
   - endpoint: a URL on Google/Apple's servers specific to this browser+device
   - p256dh, auth: encryption keys so only your server can send to this subscription

2. Your server sends a push message to the endpoint URL using the VAPID keys
   (VAPID proves your server's identity to Google/Apple)

3. Google/Apple's push service delivers it to the device

4. The service worker receives a `push` event and shows the notification
```

### VAPID Keys

VAPID (Voluntary Application Server Identification) is a standard that identifies your server to the push infrastructure. You generate a public/private key pair once:

```bash
npx web-push generate-vapid-keys
```

- **Private key**: kept secret on the server, used to sign push messages
- **Public key**: shared with the browser when subscribing, used to verify messages came from your server

### `apps/web/src/lib/notifications.ts`

```typescript
export async function subscribeToWebPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

  const registration = await navigator.serviceWorker.ready

  // Get or create the subscription for this browser/device
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,                           // required: must always show a notification
      applicationServerKey: urlBase64ToUint8Array(vapidKey),  // your public VAPID key
    })
  }

  // Extract keys and send to backend for storage
  const p256dh = subscription.getKey('p256dh')
  const auth = subscription.getKey('auth')
  await subscribePush({
    endpoint: subscription.endpoint,
    keys: {
      p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dh))),
      auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
    },
  })
  return true
}
```

### Updated Service Worker (`apps/web/src/sw.ts`)

Replaced the old `setTimeout` approach with a proper `push` event handler:

```typescript
// OLD (unreliable on mobile — timers die when SW is killed)
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'SCHEDULE_NOTIFICATIONS') return
  for (const s of schedules) {
    setTimeout(() => self.registration.showNotification(...), delay)
  }
})

// NEW (reliable — browser wakes SW just to handle this)
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return
  const data = event.data.json() as { title: string; body: string }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
    })
  )
})
```

**Why is this reliable?** The browser itself is responsible for receiving the push message and waking up your service worker. The OS-level push infrastructure (the same used by native apps) handles delivery. Your service worker doesn't need to be running — the browser wakes it up specifically to handle the `push` event.

---

## 10. Phase 6 — Vercel Deployment

### `vercel.json`

```json
{
  "buildCommand": "pnpm turbo build",
  "outputDirectory": "apps/web/dist",
  "installCommand": "pnpm install",
  "framework": null,
  "rewrites": [
    { "source": "/api/:path*", "destination": "/apps/api/src/index" }
  ]
}
```

The `rewrites` rule sends all `/api/*` traffic to the Hono app at `apps/api/src/index.ts`, which Vercel treats as a serverless function.

### cron-job.org Setup

Since Vercel's free (Hobby) plan only allows daily cron, cron-job.org is used instead — it's free and supports per-minute scheduling.

Configuration:
- **URL**: `https://your-app.vercel.app/api/cron/notify`
- **Method**: POST
- **Schedule**: Every minute (`* * * * *`)
- **Headers**: `Authorization: Bearer <CRON_SECRET>`

The `CRON_SECRET` env var is checked on every request to the cron endpoint, preventing unauthorized calls.

---

## 11. Environment Variables Reference

Set all of these in your Vercel project dashboard (Settings → Environment Variables), and locally in a `.env` file at the repo root.

| Variable | Where used | Description |
|---|---|---|
| `TURSO_DATABASE_URL` | API | `libsql://your-db.turso.io` |
| `TURSO_AUTH_TOKEN` | API | Auth token from Turso CLI |
| `VAPID_EMAIL` | API | `mailto:your@email.com` |
| `VAPID_PUBLIC_KEY` | API | Public VAPID key (base64url) |
| `VAPID_PRIVATE_KEY` | API | Private VAPID key (keep secret!) |
| `VITE_VAPID_PUBLIC_KEY` | Frontend build | Same as `VAPID_PUBLIC_KEY` — must be prefixed `VITE_` to be included in the bundle |
| `VITE_API_URL` | Frontend build | Leave empty in dev (uses Vite proxy). Set to `https://your-app.vercel.app/api` in production |
| `CRON_SECRET` | API + cron-job.org | Random secret, sent as `Authorization: Bearer <value>` by cron-job.org |
| `TIMEZONE_OFFSET_HOURS` | API | `1` for CET, `2` for CEST. Update manually when clocks change. |
| `FRONTEND_URL` | API | `https://your-app.vercel.app` — used for CORS |

---

## 12. First-Time Setup Guide

### Step 1 — Install Turso CLI and create the database

```bash
# Install Turso CLI
curl -sSfL https://get.turso.tech/install.sh | bash

# Authenticate
turso auth login

# Create the database
turso db create habit-hamster

# Run the schema
turso db shell habit-hamster < apps/api/src/schema.sql

# Get your credentials
turso db show habit-hamster --url     # → TURSO_DATABASE_URL
turso db tokens create habit-hamster  # → TURSO_AUTH_TOKEN
```

### Step 2 — Generate VAPID keys

```bash
npx web-push generate-vapid-keys
```

Save the output — you need both the public and private keys.

### Step 3 — Create local `.env`

```bash
cp .env.example .env
# Edit .env with your real values
```

### Step 4 — Run locally

```bash
pnpm dev
# Web app: http://localhost:5173
# API:     http://localhost:3000
```

The Vite dev server proxies `/api` requests to the local API automatically.

### Step 5 — Deploy to Vercel

```bash
# Push to GitHub (create a repo if you haven't)
git add -A
git commit -m "feat: add backend, Turso DB, and Web Push notifications"
git push origin main
```

Then in the Vercel dashboard:
1. Import your GitHub repository
2. Set root directory to the repo root (not `apps/web`)
3. Add all environment variables from Step 3
4. Deploy

### Step 6 — Set up cron-job.org

1. Create a free account at [cron-job.org](https://cron-job.org)
2. Create a new cron job:
   - **URL**: `https://your-app.vercel.app/api/cron/notify`
   - **Method**: POST
   - **Schedule**: Every minute
   - **Request headers**: Add `Authorization: Bearer <your-CRON_SECRET>`
3. Save and enable

### Step 7 — Enable notifications in the app

Open the deployed app on your phone, install it as a PWA ("Add to Home Screen"), then tap the settings icon and enable reminders. The first time you enable, the browser will ask for notification permission. Once granted, your device's push subscription is saved to the database.

---

## 13. Data Migration from IndexedDB

If you had existing data in the old Dexie-based version, you need to import it into Turso before switching to the new version.

### Export from the old app

Open the old version in your browser, open DevTools console, and run:

```javascript
// Open IndexedDB and export all data
const db = await new Promise((resolve) => {
  const req = indexedDB.open('HabitHamsterDB')
  req.onsuccess = () => resolve(req.result)
})

const getData = (storeName) => new Promise((resolve) => {
  const tx = db.transaction(storeName, 'readonly')
  const req = tx.objectStore(storeName).getAll()
  req.onsuccess = () => resolve(req.result)
})

const data = {
  routines: await getData('routines'),
  completions: await getData('completions'),
  gamification: await getData('gamification'),
}

console.log(JSON.stringify(data))
// Copy the output
```

### Import into the new API

With the API running locally (`pnpm dev`), run this in a new terminal (replace the JSON with your exported data):

```bash
# Import routines
curl -X POST http://localhost:3000/api/routines \
  -H "Content-Type: application/json" \
  -d '{"name":"Morning Skin care","category":"Skincare","frequency":{"type":"daily","timesPerDay":1},"timeRange":{"start":"08:30"}}'

# Or write a small script to loop through all routines
```

For a bulk import, a small Node.js script reading the exported JSON and POSTing each record to the API is the most practical approach.

---

## 14. How It All Works Together

### A complete user journey

**Morning, 8:30 AM (CET)**

1. cron-job.org calls `POST /api/cron/notify` at 8:30:00
2. API reads `TIMEZONE_OFFSET_HOURS=1`, converts UTC to local time: 08:30 local
3. API queries Turso: `SELECT * FROM routines WHERE paused = 0 AND time_range IS NOT NULL`
4. Finds "Morning Skin care" with `timeRange.start = "08:30"` — matches within ±1 minute
5. API queries `push_subscriptions` table — finds your phone's subscription
6. Calls `webpush.sendNotification(subscription, { title: "Habit Hamster", body: "Time for: Morning Skin care" })`
7. Google/Apple push service delivers the message to your phone
8. Phone wakes the service worker's `push` event handler
9. Service worker calls `showNotification("Habit Hamster", { body: "Time for: Morning Skin care" })`
10. You see the notification — even if the app is completely closed

**You tap the notification**

11. Service worker's `notificationclick` handler fires
12. If the app is open in a background tab, it focuses it
13. Otherwise, opens `https://your-app.vercel.app/`

**You open the app**

14. `useRoutines` hook fires `GET /api/routines` → Turso returns your routines
15. `useCompletions` hook fires `GET /api/completions` → Turso returns all completions
16. App renders with your data

**You check off "Morning Skin care"**

17. `toggleCompletion` updates local React state immediately (optimistic)
18. Fires `PUT /api/completions/{routineId}/2026-03-02` with `{ count: 1 }` in background
19. Turso saves the completion
20. Next time the cron runs at 20:00, it will see this routine is completed and won't include it in the streak-risk notification

**20:00 streak-risk check**

21. cron-job.org calls `POST /api/cron/notify` at 20:00
22. API queries all non-paused routines and today's completions
23. If any routines are uncompleted, sends: "2 routines still to complete today!"
24. You get a reminder on your phone

---

*Document generated from the Habit Hamster codebase — March 2026*
