import type { CapacitorConfig } from '@capacitor/cli'

// Thin native Android shell. `server.url` points at the deployed site so the APK
// loads the live web app (and its /api Netlify function) — no APK rebuild per web
// change. The Health Connect plugin is injected natively regardless of origin.
// For a fully offline/self-contained build, drop `server` and it loads webDir.
const SERVER_URL = process.env.CAP_SERVER_URL ?? 'https://sunny-otter-e39d63.netlify.app'

// Allow cleartext only when pointing at a plain-http origin (local dev server).
// Prod https stays secure.
const cleartext = SERVER_URL.startsWith('http://')

const config: CapacitorConfig = {
  appId: 'com.habithamster.app',
  appName: 'Habit Hamster',
  webDir: 'dist',
  server: {
    url: SERVER_URL,
    cleartext,
  },
}

export default config
