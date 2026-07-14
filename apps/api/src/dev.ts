// Local development server. Production uses the Vercel handlers exported from
// index.ts; this stands up a plain Node HTTP server around the same Hono app.
import { serve } from '@hono/node-server'
import { app } from './index.js'

const port = Number(process.env.API_PORT ?? 3000)
serve({ fetch: app.fetch, port })
console.log(`API dev server listening on http://localhost:${port}`)
