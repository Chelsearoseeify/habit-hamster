import { Hono } from 'hono'
import type { InValue } from '@libsql/client'
import { db, rowToSystem } from '../db.js'

export const systemsRouter = new Hono()

systemsRouter.get('/', async (c) => {
  const result = await db.execute('SELECT * FROM systems ORDER BY created_at ASC')
  return c.json(result.rows.map(rowToSystem))
})

systemsRouter.post('/', async (c) => {
  const body = await c.req.json()
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  await db.execute({
    sql: `INSERT INTO systems (id, name, description, identity_id, rule_type, rule_count, rule_period, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      body.name,
      body.description ?? null,
      body.identityId ?? null,
      body.ruleType ?? 'count',
      body.ruleCount ?? 1,
      body.rulePeriod ?? 'day',
      createdAt,
    ],
  })
  const result = await db.execute({ sql: 'SELECT * FROM systems WHERE id = ?', args: [id] })
  return c.json(rowToSystem(result.rows[0] as Record<string, unknown>), 201)
})

systemsRouter.patch('/:id', async (c) => {
  const { id } = c.req.param()
  const body = await c.req.json()

  const fields: string[] = []
  const args: InValue[] = []

  if (body.name !== undefined) { fields.push('name = ?'); args.push(body.name) }
  if ('description' in body) { fields.push('description = ?'); args.push(body.description ?? null) }
  if ('identityId' in body) { fields.push('identity_id = ?'); args.push(body.identityId ?? null) }
  if (body.ruleType !== undefined) { fields.push('rule_type = ?'); args.push(body.ruleType) }
  if (body.ruleCount !== undefined) { fields.push('rule_count = ?'); args.push(body.ruleCount) }
  if (body.rulePeriod !== undefined) { fields.push('rule_period = ?'); args.push(body.rulePeriod) }

  if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400)

  args.push(id)
  await db.execute({ sql: `UPDATE systems SET ${fields.join(', ')} WHERE id = ?`, args })
  const result = await db.execute({ sql: 'SELECT * FROM systems WHERE id = ?', args: [id] })
  if (result.rows.length === 0) return c.json({ error: 'Not found' }, 404)
  return c.json(rowToSystem(result.rows[0] as Record<string, unknown>))
})

systemsRouter.delete('/:id', async (c) => {
  const { id } = c.req.param()
  await db.execute({ sql: 'DELETE FROM systems WHERE id = ?', args: [id] })
  return c.body(null, 204)
})
