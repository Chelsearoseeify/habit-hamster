# Health Connect / Samsung Health sync — resume plan

Status as of 2026-07-17. Feature lets Samsung Health data auto-complete habits +
show a metrics dashboard. Full architecture: memory `health-connect-sync.md`.

## DONE (in working tree, verify committed — see step 0)

- **Backend** (verified e2e vs live Turso): `health_data` table +
  `routines.health_trigger` col (migration already applied to live DB),
  `POST/GET /api/health-data` with auto-complete on sync. `apps/api/src/routes/health.ts`.
- **Web** (typechecks + builds): `lib/health-sync.ts` bridge, `useHealthData` hook,
  `HealthMetricsCard` on home, RoutineForm health-trigger picker.
- **Capacitor**: `apps/web/capacitor.config.ts`, `apps/web/android/` project,
  manifest perms + queries + intent-filters, plugin installed & synced.

## TODO — resume here

### 0. Commit (not done yet)
```
git checkout -b feat/health-connect
git add -A && git commit   # working tree has all the above uncommitted
```

### 1. Build + run the APK  (BLOCKER — needs machine setup)
- Install **Android Studio** (bundles Android SDK + JDK 21; Capacitor 8 needs
  JDK 21 — current machine has JDK 23, gradle may reject it).
- `cd apps/web && pnpm android:build`  (build web + cap sync + open Studio).
- Run on a real phone (needs **Samsung Health** + **Health Connect** apps installed;
  emulator won't have Samsung Health data).
- Grant Health Connect read perms when prompted → tap **Sync** on home card.
- Verify the loop: activity in Samsung Health → Sync → metrics show → a habit with
  a matching trigger flips to done.

### 2. Known gaps to close after first successful run
- **XP not awarded for auto-completions.** `handleHealthSync` in `App.tsx` reloads
  completions but does NOT run them through `onCompletionToggled`, so gamification
  XP/achievements/streak don't fire for habits completed via sync. Decide: award XP
  for auto-completions or not. If yes, wire `onCompletionToggled` per completed item.
- **Auto-sync on launch/resume** not wired — sync is manual (button only). Add a
  Capacitor `App` `resume`/`appStateChange` listener (or run sync in `useHealthData`
  mount when `available`) so it syncs without tapping.
- **Sleep day attribution**: a sleep session starting 23:30 is bucketed to the
  start date. May want to attribute to wake/end date instead. Check on real data.
- **Distance permission**: plugin's typed read perms omit `Distance` (used a cast).
  Confirm it actually returns data on device; if not, drop distance_m from the UI.
- **Timezone**: sync buckets by local date via `formatDate(new Date(...))`; API
  stores date strings. Confirm alignment with `TIMEZONE_OFFSET_HOURS` so a metric
  lands on the same date the app considers "today".

### 3. Polish (optional)
- Show a trigger badge on `RoutineCard` for health-linked routines.
- Android app icon + splash (currently default Capacitor art).
- Netlify: next deploy bundles the new capacitor deps into the web build — it's
  browser-safe and builds locally, but confirm the Netlify build stays green.

## Quick verify commands
```
# backend typecheck
cd apps/api && pnpm exec tsc --noEmit
# web typecheck + build
cd apps/web && pnpm exec tsc -b --noEmit && pnpm build
# re-sync android after web changes
cd apps/web && pnpm cap:sync
```
