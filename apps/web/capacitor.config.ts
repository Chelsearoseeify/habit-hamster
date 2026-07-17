import type { CapacitorConfig } from '@capacitor/cli'

// Thin native Android shell. `server.url` points at the deployed site so the APK
// loads the live web app (and its /api Netlify function) — no APK rebuild per web
// change. The Health Connect plugin is injected natively regardless of origin.
// For a fully offline/self-contained build, drop `server` and it loads webDir.
const SERVER_URL = process.env.CAP_SERVER_URL ?? 'https://sunny-otter-e39d63.netlify.app'

const config: CapacitorConfig = {
  appId: 'com.habithamster.app',
  appName: 'Habit Hamster',
  webDir: 'dist',
  server: {
    url: SERVER_URL,
    cleartext: false,
  },
}

export default config
