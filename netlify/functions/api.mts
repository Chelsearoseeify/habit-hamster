// Netlify Function (v2) that serves the Hono API. Netlify v2 functions receive a
// standard web Request and return a Response, which is exactly Hono's app.fetch
// signature — so we forward straight through. `config.path` routes every /api/*
// request to this function; the Hono app is mounted at basePath('/api'), so the
// full path lines up.
import { app } from '../../apps/api/src/index.js'

export default async (req: Request): Promise<Response> => app.fetch(req)

export const config = { path: '/api/*' }
