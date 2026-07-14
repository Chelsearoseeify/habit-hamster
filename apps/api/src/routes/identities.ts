import { Hono } from 'hono'
import type { InValue } from '@libsql/client'
import { db, rowToIdentity } from '../db.js'

export const identitiesRouter = new Hono()

identitiesRouter.get('/', async (c) => {
  const result = await db.execute('SELECT * FROM identities ORDER BY created_at ASC')
  return c.json(result.rows.map(rowToIdentity))
})

identitiesRouter.post('/', async (c) => {
  const body = await c.req.json()
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  await db.execute({
    sql: `INSERT INTO identities (id, name, statement, created_at) VALUES (?, ?, ?, ?)`,
    args: [id, body.name, body.statement ?? null, createdAt],
  })
  const result = await db.execute({ sql: 'SELECT * FROM identities WHERE id = ?', args: [id] })
  return c.json(rowToIdentity(result.rows[0] as Record<string, unknown>), 201)
})

identitiesRouter.patch('/:id', async (c) => {
  const { id } = c.req.param()
  const body = await c.req.json()

  const fields: string[] = []
  const args: InValue[] = []

  if (body.name !== undefined) { fields.push('name = ?'); args.push(body.name) }
  if ('statement' in body) { fields.push('statement = ?'); args.push(body.statement ?? null) }

  if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400)

  args.push(id)
  await db.execute({ sql: `UPDATE identities SET ${fields.join(', ')} WHERE id = ?`, args })
  const result = await db.execute({ sql: 'SELECT * FROM identities WHERE id = ?', args: [id] })
  if (result.rows.length === 0) return c.json({ error: 'Not found' }, 404)
  return c.json(rowToIdentity(result.rows[0] as Record<string, unknown>))
})

identitiesRouter.delete('/:id', async (c) => {
  const { id } = c.req.param()
  await db.execute({ sql: 'DELETE FROM identities WHERE id = ?', args: [id] })
  return c.body(null, 204)
})
