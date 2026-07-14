import { Hono } from 'hono'
import { db, rowToRoutine, rowToCompletion } from '../db.js'
import { sendPushNotification } from '../lib/webpush.js'

export const cronRouter = new Hono()

cronRouter.post('/notify', async (c) => {
  // Protect from unauthorized calls — cron-job.org sends this header
  const authHeader = c.req.header('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Timezone offset: CET=1, CEST=2. Backend uses TIMEZONE_OFFSET_HOURS env var.
  const offsetHours = parseInt(process.env.TIMEZONE_OFFSET_HOURS ?? '1', 10)
  const now = new Date()
  const localMs = now.getTime() + offsetHours * 60 * 60 * 1000
  const localNow = new Date(localMs)
  const localH = localNow.getUTCHours()
  const localM = localNow.getUTCMinutes()
  const todayStr = localNow.toISOString().slice(0, 10)
  const currentLocalMinutes = localH * 60 + localM

  // Get all push subscriptions
  const subsResult = await db.execute('SELECT * FROM push_subscriptions')
  if (subsResult.rows.length === 0) return c.json({ sent: 0 })

  const notifications: { title: string; body: string }[] = []

  // Check routine reminders
  const routinesResult = await db.execute(
    'SELECT * FROM routines WHERE paused = 0 AND time_range IS NOT NULL',
  )
  for (const row of routinesResult.rows) {
    const routine = rowToRoutine(row as Record<string, unknown>)
    if (!routine.timeRange?.start) continue
    const [h, m] = routine.timeRange.start.split(':').map(Number)
    const routineMinutes = h * 60 + m
    if (Math.abs(currentLocalMinutes - routineMinutes) <= 1) {
      notifications.push({ title: 'Habit Hamster', body: `Time for: ${routine.name}` })
    }
  }

  // Streak-risk check at 20:00 local time
  if (localH === 20 && localM === 0) {
    const [allRoutinesResult, completionsResult] = await Promise.all([
      db.execute('SELECT * FROM routines WHERE paused = 0'),
      db.execute({ sql: 'SELECT * FROM completions WHERE date = ?', args: [todayStr] }),
    ])
    const completions = completionsResult.rows.map(rowToCompletion)
    const incomplete = allRoutinesResult.rows.filter((row) => {
      const c = completions.find((c) => c.routineId === (row.id as string))
      return !c || c.count === 0
    })
    if (incomplete.length > 0) {
      notifications.push({
        title: 'Habit Hamster',
        body: `${incomplete.length} routine${incomplete.length !== 1 ? 's' : ''} still to complete today!`,
      })
    }
  }

  if (notifications.length === 0) return c.json({ sent: 0 })

  // Send to all subscriptions, clean up expired ones
  let sent = 0
  for (const sub of subsResult.rows) {
    const subscription = {
      endpoint: sub.endpoint as string,
      keys: { p256dh: sub.p256dh as string, auth: sub.auth as string },
    }
    for (const notif of notifications) {
      try {
        await sendPushNotification(subscription, notif)
        sent++
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode
        if (statusCode === 410 || statusCode === 404) {
          await db.execute({
            sql: 'DELETE FROM push_subscriptions WHERE endpoint = ?',
            args: [sub.endpoint as string],
          })
        }
      }
    }
  }

  return c.json({ sent })
})
