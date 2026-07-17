import { Hono } from 'hono'
import { db, rowToGamification } from '../db.js'

export const gamificationRouter = new Hono()

gamificationRouter.get('/', async (c) => {
  const result = await db.execute("SELECT * FROM gamification WHERE id = 'current'")
  if (result.rows.length === 0) {
    return c.json({ xp: 0, level: 1, achievements: [], streakFreezes: 0 })
  }
  return c.json(rowToGamification(result.rows[0] as Record<string, unknown>))
})

gamificationRouter.put('/', async (c) => {
  const body = await c.req.json()
  await db.execute({
    sql: `INSERT INTO gamification (id, xp, level, achievements, streak_freezes)
          VALUES ('current', ?, ?, ?, ?)
          ON CONFLICT (id) DO UPDATE SET
            xp = excluded.xp,
            level = excluded.level,
            achievements = excluded.achievements,
            streak_freezes = excluded.streak_freezes`,
    args: [body.xp, body.level, JSON.stringify(body.achievements), body.streakFreezes],
  })
  return c.json(body)
})

gamificationRouter.delete('/', async (c) => {
  await db.execute("DELETE FROM gamification WHERE id = 'current'")
  await db.execute('DELETE FROM perfect_day_bonuses')
  return c.body(null, 204)
})

gamificationRouter.get('/perfect-day/:date', async (c) => {
  const { date } = c.req.param()
  const result = await db.execute({
    sql: 'SELECT date FROM perfect_day_bonuses WHERE date = ?',
    args: [date],
  })
  return c.json({ awarded: result.rows.length > 0 })
})

gamificationRouter.post('/perfect-day/:date', async (c) => {
  const { date } = c.req.param()
  await db.execute({
    sql: 'INSERT OR IGNORE INTO perfect_day_bonuses (date) VALUES (?)',
    args: [date],
  })
  return c.body(null, 204)
})
