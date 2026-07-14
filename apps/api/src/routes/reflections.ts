import { Hono } from 'hono'
import { db, rowToReflection } from '../db.js'

export const reflectionsRouter = new Hono()

reflectionsRouter.get('/', async (c) => {
  const result = await db.execute('SELECT * FROM reflections')
  return c.json(result.rows.map(rowToReflection))
})

reflectionsRouter.put('/:date', async (c) => {
  const { date } = c.req.param()
  const { mood, note } = await c.req.json()
  await db.execute({
    sql: `INSERT INTO reflections (date, mood, note) VALUES (?, ?, ?)
          ON CONFLICT (date) DO UPDATE SET mood = excluded.mood, note = excluded.note`,
    args: [date, mood, note ?? null],
  })
  return c.json({ date, mood, note: note ?? undefined })
})

reflectionsRouter.delete('/:date', async (c) => {
  const { date } = c.req.param()
  await db.execute({ sql: 'DELETE FROM reflections WHERE date = ?', args: [date] })
  return c.body(null, 204)
})
