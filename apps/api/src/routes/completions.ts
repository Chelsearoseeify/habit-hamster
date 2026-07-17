import { Hono } from 'hono'
import { db, rowToCompletion } from '../db.js'

export const completionsRouter = new Hono()

completionsRouter.get('/', async (c) => {
  const result = await db.execute('SELECT * FROM completions')
  return c.json(result.rows.map(rowToCompletion))
})

completionsRouter.put('/:routineId/:date', async (c) => {
  const { routineId, date } = c.req.param()
  const { count } = await c.req.json()
  await db.execute({
    sql: `INSERT INTO completions (routine_id, date, count) VALUES (?, ?, ?)
          ON CONFLICT (routine_id, date) DO UPDATE SET count = excluded.count`,
    args: [routineId, date, count],
  })
  return c.json({ routineId, date, count })
})

completionsRouter.delete('/', async (c) => {
  await db.execute('DELETE FROM completions')
  return c.body(null, 204)
})

completionsRouter.delete('/:routineId/:date', async (c) => {
  const { routineId, date } = c.req.param()
  await db.execute({
    sql: 'DELETE FROM completions WHERE routine_id = ? AND date = ?',
    args: [routineId, date],
  })
  return c.body(null, 204)
})
