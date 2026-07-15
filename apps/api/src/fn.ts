// Netlify Function (v2) entry for the Hono API. Bundled by `pnpm bundle:fn`
// (esbuild) into netlify/functions/api.mjs — hono/web-push are inlined; only
// @libsql/client stays external and is installed via netlify/functions/package.json.
// v2 functions take a web Request and return a Response, matching app.fetch.
import { app } from './index.js'

export default async (req: Request): Promise<Response> => app.fetch(req)

export const config = { path: '/api/*' }
