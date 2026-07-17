import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handle } from 'hono/vercel'
import { routinesRouter } from './routes/routines.js'
import { completionsRouter } from './routes/completions.js'
import { gamificationRouter } from './routes/gamification.js'
import { pushRouter } from './routes/push.js'
import { identitiesRouter } from './routes/identities.js'
import { systemsRouter } from './routes/systems.js'
import { reflectionsRouter } from './routes/reflections.js'
import { healthRouter } from './routes/health.js'
import { cronRouter } from './cron/notify.js'

export const config = { runtime: 'nodejs' }

export const app = new Hono().basePath('/api')

app.use(
  '*',
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
)

app.route('/routines', routinesRouter)
app.route('/completions', completionsRouter)
app.route('/gamification', gamificationRouter)
app.route('/push', pushRouter)
app.route('/identities', identitiesRouter)
app.route('/systems', systemsRouter)
app.route('/reflections', reflectionsRouter)
app.route('/health-data', healthRouter)
app.route('/cron', cronRouter)

app.get('/health', (c) => c.json({ ok: true }))

export default handle(app)
export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)
