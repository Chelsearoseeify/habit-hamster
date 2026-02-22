/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

clientsClaim()
self.skipWaiting()

// Workbox injects the precache manifest here at build time
precacheAndRoute(self.__WB_MANIFEST ?? [])

// --- Scheduled notification support ---

interface NotificationSchedule {
  title: string
  body: string
  fireAt: number // Unix timestamp ms
}

const pendingTimers: ReturnType<typeof setTimeout>[] = []

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type !== 'SCHEDULE_NOTIFICATIONS') return

  // Clear any previously scheduled timers
  for (const t of pendingTimers) clearTimeout(t)
  pendingTimers.length = 0

  const schedules: NotificationSchedule[] = event.data.schedules ?? []
  const now = Date.now()

  for (const s of schedules) {
    const delay = s.fireAt - now
    if (delay < 0) continue
    const t = setTimeout(() => {
      self.registration.showNotification(s.title, {
        body: s.body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: `habit-${s.fireAt}`,
      } as NotificationOptions)
    }, delay)
    pendingTimers.push(t)
  }
})

// Open the app when a notification is clicked
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow('/')
    })
  )
})
