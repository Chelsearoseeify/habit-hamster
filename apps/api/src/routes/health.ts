import { Hono } from 'hono'
import type { InValue } from '@libsql/client'
import type { FrequencyType, HealthDataPoint, HealthTrigger } from '@habit-hamster/types'
import { db, rowToHealthData, rowToRoutine } from '../db.js'

export const healthRouter = new Hono()

/** How many completions mark a routine "done" for one day. */
function dailyTarget(frequency: FrequencyType): number {
  return frequency.type === 'daily' ? frequency.timesPerDay : 1
}

// GET /api/health-data?from=YYYY-MM-DD&to=YYYY-MM-DD
healthRouter.get('/', async (c) => {
  const from = c.req.query('from')
  const to = c.req.query('to')
  let sql = 'SELECT * FROM health_data'
  const args: InValue[] = []
  if (from && to) {
    sql += ' WHERE date BETWEEN ? AND ?'
    args.push(from, to)
  } else if (from) {
    sql += ' WHERE date >= ?'
    args.push(from)
  } else if (to) {
    sql += ' WHERE date <= ?'
    args.push(to)
  }
  sql += ' ORDER BY date ASC, metric ASC'
  const result = await db.execute({ sql, args })
  return c.json(result.rows.map(rowToHealthData))
})

// POST /api/health-data  — body: HealthDataPoint[] (aggregated per day+metric).
// Upserts the values, then auto-completes any routine whose health_trigger is
// met on an affected date. Returns { synced, completed: [{routineId, date}] }.
healthRouter.post('/', async (c) => {
  const points = (await c.req.json()) as HealthDataPoint[]
  if (!Array.isArray(points) || points.length === 0) {
    return c.json({ synced: 0, completed: [] })
  }

  const syncedAt = new Date().toISOString()
  for (const p of points) {
    await db.execute({
      sql: `INSERT INTO health_data (date, metric, value, source, synced_at)
            VALUES (?, ?, ?, 'health_connect', ?)
            ON CONFLICT (date, metric) DO UPDATE SET value = excluded.value, synced_at = excluded.synced_at`,
      args: [p.date, p.metric, p.value, syncedAt],
    })
  }

  // Affected values keyed by `${date}|${metric}` for quick trigger lookup.
  const valueByKey = new Map<string, number>()
  const dates = new Set<string>()
  for (const p of points) {
    valueByKey.set(`${p.date}|${p.metric}`, p.value)
    dates.add(p.date)
  }

  const routinesResult = await db.execute(
    "SELECT * FROM routines WHERE health_trigger IS NOT NULL AND paused = 0",
  )
  const completed: { routineId: string; date: string; count: number }[] = []

  for (const row of routinesResult.rows) {
    const routine = rowToRoutine(row as Record<string, unknown>)
    const trigger = routine.healthTrigger as HealthTrigger | undefined
    if (!trigger) continue
    for (const date of dates) {
      const value = valueByKey.get(`${date}|${trigger.metric}`)
      if (value === undefined || value < trigger.threshold) continue
      const count = dailyTarget(routine.frequency)
      await db.execute({
        sql: `INSERT INTO completions (routine_id, date, count) VALUES (?, ?, ?)
              ON CONFLICT (routine_id, date) DO UPDATE SET count = excluded.count`,
        args: [routine.id, date, count],
      })
      completed.push({ routineId: routine.id, date, count })
    }
  }

  return c.json({ synced: points.length, completed })
})

healthRouter.delete('/', async (c) => {
  await db.execute('DELETE FROM health_data')
  return c.body(null, 204)
})
