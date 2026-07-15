import { Hono } from 'hono'
import type { InValue } from '@libsql/client'
import { db, rowToRoutine } from '../db.js'

export const routinesRouter = new Hono()

routinesRouter.get('/', async (c) => {
  const result = await db.execute('SELECT * FROM routines ORDER BY created_at ASC')
  return c.json(result.rows.map(rowToRoutine))
})

routinesRouter.post('/', async (c) => {
  const body = await c.req.json()
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  await db.execute({
    sql: `INSERT INTO routines (id, name, category, frequency, time_range, preferred_days, description, created_at, paused, identity_id, system_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      body.name,
      body.category,
      JSON.stringify(body.frequency),
      body.timeRange ? JSON.stringify(body.timeRange) : null,
      body.preferredDays ? JSON.stringify(body.preferredDays) : null,
      body.description ?? null,
      createdAt,
      0,
      body.identityId ?? null,
      body.systemId ?? null,
    ],
  })
  const result = await db.execute({ sql: 'SELECT * FROM routines WHERE id = ?', args: [id] })
  return c.json(rowToRoutine(result.rows[0] as Record<string, unknown>), 201)
})

routinesRouter.patch('/:id', async (c) => {
  const { id } = c.req.param()
  const body = await c.req.json()

  const fields: string[] = []
  const args: InValue[] = []

  if (body.name !== undefined) { fields.push('name = ?'); args.push(body.name) }
  if (body.category !== undefined) { fields.push('category = ?'); args.push(body.category) }
  if (body.frequency !== undefined) { fields.push('frequency = ?'); args.push(JSON.stringify(body.frequency)) }
  if ('timeRange' in body) { fields.push('time_range = ?'); args.push(body.timeRange ? JSON.stringify(body.timeRange) : null) }
  if ('preferredDays' in body) { fields.push('preferred_days = ?'); args.push(body.preferredDays ? JSON.stringify(body.preferredDays) : null) }
  if ('description' in body) { fields.push('description = ?'); args.push(body.description ?? null) }
  if (body.paused !== undefined) { fields.push('paused = ?'); args.push(body.paused ? 1 : 0) }
  if ('identityId' in body) { fields.push('identity_id = ?'); args.push(body.identityId ?? null) }
  if ('systemId' in body) { fields.push('system_id = ?'); args.push(body.systemId ?? null) }

  if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400)

  args.push(id)
  await db.execute({ sql: `UPDATE routines SET ${fields.join(', ')} WHERE id = ?`, args })
  const result = await db.execute({ sql: 'SELECT * FROM routines WHERE id = ?', args: [id] })
  if (result.rows.length === 0) return c.json({ error: 'Not found' }, 404)
  return c.json(rowToRoutine(result.rows[0] as Record<string, unknown>))
})

routinesRouter.delete('/:id', async (c) => {
  const { id } = c.req.param()
  await db.execute({ sql: 'DELETE FROM routines WHERE id = ?', args: [id] })
  return c.body(null, 204)
})
