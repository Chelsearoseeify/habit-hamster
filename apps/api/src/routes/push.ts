import { Hono } from 'hono'
import { db } from '../db.js'

export const pushRouter = new Hono()

pushRouter.post('/subscribe', async (c) => {
  const { endpoint, keys } = await c.req.json()
  const id = crypto.randomUUID()
  await db.execute({
    sql: `INSERT INTO push_subscriptions (id, endpoint, p256dh, auth, created_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT (endpoint) DO UPDATE SET
            p256dh = excluded.p256dh,
            auth = excluded.auth`,
    args: [id, endpoint, keys.p256dh, keys.auth, new Date().toISOString()],
  })
  return c.body(null, 204)
})

pushRouter.delete('/unsubscribe', async (c) => {
  const { endpoint } = await c.req.json()
  await db.execute({
    sql: 'DELETE FROM push_subscriptions WHERE endpoint = ?',
    args: [endpoint],
  })
  return c.body(null, 204)
})
