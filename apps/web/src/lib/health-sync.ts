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
import { formatDate, addDays } from './date-utils'

/* eslint-disable @typescript-eslint/no-explicit-any */

/** True only inside the Android wrapper with Health Connect installed + available. */
export async function isHealthSyncAvailable(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  try {
    const { availability } = await HealthConnect.checkAvailability()
    return availability === 'Available'
  } catch {
    return false
  }
}

export interface SyncOutcome extends HealthSyncResult {
  available: boolean
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
  if (!Capacitor.isNativePlatform()) return { available: false, synced: 0, completed: [] }

  // 'Distance' isn't in the plugin's read RecordType union but the native layer
  // maps it; cast and let a runtime failure fall through to the per-metric catch.
  await HealthConnect.requestPermissions({
    read: ['Steps', 'Distance' as RecordType, 'ActivitySession', 'SleepSession'],
    write: [],
  })

  const end = new Date()
  const startISO = addDays(end, -days).toISOString()
  const endISO = end.toISOString()

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
      for (const a of aggregates ?? []) bump(formatDate(new Date(a.startTime)), metric, a.value)
    } catch {
      /* metric unavailable / permission denied — skip */
    }
  }
  await aggregate('Steps', 'steps')
  await aggregate('Distance', 'distance_m')

  // Exercise + sleep: sessions, summed to minutes per day.
  const sessions = async (type: 'ActivitySession' | 'SleepSession', metric: HealthMetric) => {
    try {
      const { records } = await HealthConnect.readRecords({ start: startISO, end: endISO, type })
      for (const r of (records as any[]) ?? []) {
        const mins = durationMinutes(r)
        if (mins > 0) bump(formatDate(new Date(r.startTime)), metric, mins)
      }
    } catch {
      /* skip */
    }
  }
  await sessions('ActivitySession', 'exercise_min')
  await sessions('SleepSession', 'sleep_min')

  const points: HealthDataPoint[] = []
  for (const [date, metrics] of acc) {
    for (const [metric, value] of Object.entries(metrics)) {
      points.push({ date, metric: metric as HealthMetric, value: Math.round(value as number) })
    }
  }

  if (points.length === 0) return { available: true, synced: 0, completed: [] }
  const result = await syncHealthData(points)
  return { available: true, ...result }
}
