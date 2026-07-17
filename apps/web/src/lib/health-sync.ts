// Bridge to Android Health Connect (Samsung Health feeds into it) via the
// @devmaxime/capacitor-health-connect plugin.
//
// The plugin is a thin registerPlugin() wrapper with a web fallback that reports
// "NotSupported", so importing it statically is browser-safe: on the plain web
// build every call is a no-op and isHealthSyncAvailable() returns false; inside
// the Capacitor Android wrapper the Capacitor bridge routes calls to native.
import { Capacitor } from '@capacitor/core'
import { HealthConnect } from '@devmaxime/capacitor-health-connect'
import type { RecordType } from '@devmaxime/capacitor-health-connect'
import type { HealthDataPoint, HealthMetric } from '@/types'
import { syncHealthData, type HealthSyncResult } from './api'
import { formatDate } from './date-utils'

/* eslint-disable @typescript-eslint/no-explicit-any */

/** True only inside the Android wrapper with Health Connect installed + available. */
export async function isHealthSyncAvailable(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  try {
    const { availability } = await HealthConnect.checkAvailability()
    console.log('[health] checkAvailability ->', availability)
    return availability === 'Available'
  } catch (e) {
    console.log('[health] checkAvailability FAILED', String(e))
    return false
  }
}

export interface SyncOutcome extends HealthSyncResult {
  available: boolean
  /** Raw step-by-step trace of what Health Connect returned, for on-device debugging. */
  log: string[]
}

function durationMinutes(record: any): number {
  const start = record?.startTime ? new Date(record.startTime).getTime() : NaN
  const end = record?.endTime ? new Date(record.endTime).getTime() : NaN
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0
  return (end - start) / 60000
}

/**
 * Reads the last `days` of Health Connect data, aggregates it into one value per
 * day+metric, and pushes it to the API (which auto-completes triggered routines).
 * No-op returning { available: false } when not running on the native wrapper.
 */
export async function runHealthSync(days = 7): Promise<SyncOutcome> {
  const log: string[] = []
  const trace = (...parts: unknown[]) => {
    const line = parts.map((p) => (typeof p === 'string' ? p : JSON.stringify(p))).join(' ')
    console.log('[health]', line)
    log.push(line)
  }

  if (!Capacitor.isNativePlatform()) return { available: false, synced: 0, completed: [], log }

  // 'Distance' isn't in the plugin's read RecordType union but the native layer
  // maps it; cast and let a runtime failure fall through to the per-metric catch.
  const perms = await HealthConnect.requestPermissions({
    read: [
      'Steps',
      'Distance' as RecordType,
      'ActivitySession',
      'SleepSession',
      'Hydration' as RecordType,
      'Nutrition' as RecordType,
    ],
    write: [],
  })
  trace('requestPermissions ->', perms)

  // Start the window at LOCAL midnight `days` ago. aggregateRecords({groupBy:'day'})
  // cuts buckets relative to the window start, so a non-midnight start files
  // today's steps under yesterday's date. Midnight-align → calendar-day buckets.
  const end = new Date()
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - days)
  const startISO = start.toISOString()
  const endISO = end.toISOString()
  trace('window', startISO, '->', endISO)

  // date -> metric -> summed value
  const acc = new Map<string, Partial<Record<HealthMetric, number>>>()
  const bump = (date: string, metric: HealthMetric, value: number) => {
    const day = acc.get(date) ?? {}
    day[metric] = (day[metric] ?? 0) + value
    acc.set(date, day)
  }

  // Steps + distance: daily aggregates straight from Health Connect.
  const aggregate = async (type: 'Steps' | 'Distance', metric: HealthMetric) => {
    try {
      const { aggregates } = await HealthConnect.aggregateRecords({
        start: startISO,
        end: endISO,
        type,
        groupBy: 'day',
      })
      trace(`aggregate ${type} ->`, aggregates)
      for (const a of aggregates ?? []) bump(formatDate(new Date(a.startTime)), metric, a.value)
    } catch (e) {
      trace(`aggregate ${type} FAILED`, String(e))
      /* metric unavailable / permission denied — skip */
    }
  }
  await aggregate('Steps', 'steps')
  await aggregate('Distance', 'distance_m')

  // Exercise + sleep: sessions, summed to minutes per day.
  const sessions = async (type: 'ActivitySession' | 'SleepSession', metric: HealthMetric) => {
    try {
      const { records } = await HealthConnect.readRecords({ start: startISO, end: endISO, type })
      trace(`readRecords ${type} -> ${(records as any[])?.length ?? 0} records`, records)
      for (const r of (records as any[]) ?? []) {
        const mins = durationMinutes(r)
        if (mins > 0) bump(formatDate(new Date(r.startTime)), metric, mins)
      }
    } catch (e) {
      trace(`readRecords ${type} FAILED`, String(e))
      /* skip */
    }
  }
  await sessions('ActivitySession', 'exercise_min')
  await sessions('SleepSession', 'sleep_min')

  // Hydration (mL) + Nutrition (kcal): instantaneous/interval records, each with
  // a `value` field surfaced by our native converter patch. Sum per day.
  const totals = async (type: 'Hydration' | 'Nutrition', metric: HealthMetric) => {
    try {
      const { records } = await HealthConnect.readRecords({
        start: startISO,
        end: endISO,
        type: type as RecordType,
      })
      trace(`readRecords ${type} -> ${(records as any[])?.length ?? 0} records`, records)
      for (const r of (records as any[]) ?? []) {
        const value = Number(r?.value)
        if (Number.isFinite(value) && value > 0) bump(formatDate(new Date(r.startTime)), metric, value)
      }
    } catch (e) {
      trace(`readRecords ${type} FAILED`, String(e))
    }
  }
  await totals('Hydration', 'water_ml')
  await totals('Nutrition', 'nutrition_kcal')

  const points: HealthDataPoint[] = []
  for (const [date, metrics] of acc) {
    for (const [metric, value] of Object.entries(metrics)) {
      points.push({ date, metric: metric as HealthMetric, value: Math.round(value as number) })
    }
  }

  trace('aggregated points ->', points)
  if (points.length === 0) return { available: true, synced: 0, completed: [], log }
  const result = await syncHealthData(points)
  trace('syncHealthData result ->', result)
  return { available: true, ...result, log }
}
