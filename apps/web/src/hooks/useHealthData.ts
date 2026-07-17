import { useState, useEffect, useCallback } from 'react'
import type { HealthDataPoint, HealthMetric } from '@/types'
import { getHealthData } from '@/lib/api'
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

  const refresh = useCallback(async () => {
    const from = formatDate(addDays(new Date(), -7))
    const points = await getHealthData(from, getToday())
    setData(points)
  }, [])

  useEffect(() => {
    refresh().catch(console.error)
    isHealthSyncAvailable().then(setAvailable).catch(() => setAvailable(false))
  }, [refresh])

  const sync = useCallback(async (): Promise<SyncOutcome> => {
    setSyncing(true)
    try {
      const result = await runHealthSync()
      setLastResult(result)
      if (result.synced > 0) await refresh()
      return result
    } finally {
      setSyncing(false)
    }
  }, [refresh])

  const today = getToday()
  const todayMetrics: TodayMetrics = {}
  for (const p of data) {
    if (p.date === today) todayMetrics[p.metric] = p.value
  }

  return { data, todayMetrics, available, syncing, lastResult, sync, refresh }
}
