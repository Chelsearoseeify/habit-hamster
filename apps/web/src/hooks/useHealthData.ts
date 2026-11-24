import { useState, useEffect, useCallback, useRef } from 'react'
import type { HealthDataPoint, HealthMetric } from '@/types'
import { getHealthData, syncHealthData } from '@/lib/api'
import { isHealthSyncAvailable, runHealthSync, type SyncOutcome } from '@/lib/health-sync'
import { formatDate, addDays, getToday } from '@/lib/date-utils'

export type TodayMetrics = Partial<Record<HealthMetric, number>>

/**
 * Loads recent Health Connect data for display and exposes a manual sync.
 * `available` is true only inside the Android wrapper, so the UI can hide the
 * sync button on the plain web build.
 */
export function useHealthData() {
  const [data, setData] = useState<HealthDataPoint[]>([])
  const [available, setAvailable] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [lastResult, setLastResult] = useState<SyncOutcome | null>(null)
  const syncingRef = useRef(false)

  const refresh = useCallback(async () => {
    const from = formatDate(addDays(new Date(), -7))
    const points = await getHealthData(from, getToday())
    setData(points)
  }, [])

  const sync = useCallback(async (): Promise<SyncOutcome> => {
    // Guard against overlapping runs (auto-sync on focus + manual tap).
    if (syncingRef.current) return { synced: 0, completed: [], available: true, log: [] }
    syncingRef.current = true
    setSyncing(true)
    try {
      const result = await runHealthSync()
      setLastResult(result)
      if (result.synced > 0) await refresh()
      return result
    } finally {
      syncingRef.current = false
      setSyncing(false)
    }
  }, [refresh])

  useEffect(() => {
    refresh().catch(console.error)
    isHealthSyncAvailable().then(setAvailable).catch(() => setAvailable(false))
  }, [refresh])

  // Auto-sync when running natively: once on load, and whenever the app is
  // brought back to the foreground (visibility regain / window focus).
  useEffect(() => {
    if (!available) return
    sync().catch(console.error)

    const onVisible = () => {
      if (document.visibilityState === 'visible') sync().catch(console.error)
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [available, sync])

  const today = getToday()
  const todayMetrics: TodayMetrics = {}
  for (const p of data) {
    if (p.date === today) todayMetrics[p.metric] = p.value
  }

  // Manual water logging: the POST upserts (replaces) the day's value, so send
  // the running total. Works on plain web too — no native/Health Connect needed.
  const logWater = useCallback(
    async (ml: number) => {
      const current = data.find((p) => p.date === today && p.metric === 'water_ml')?.value ?? 0
      const value = current + ml
      setData((prev) => [
        ...prev.filter((p) => !(p.date === today && p.metric === 'water_ml')),
        { date: today, metric: 'water_ml', value },
      ])
      await syncHealthData([{ date: today, metric: 'water_ml', value }])
      await refresh()
    },
    [data, today, refresh],
  )

  return { data, todayMetrics, available, syncing, lastResult, sync, refresh, logWater }
}
