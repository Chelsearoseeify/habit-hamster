import { subscribePush } from './api'

const NOTIFICATIONS_ENABLED_KEY = 'habit-hamster-notifications-enabled'

export function areNotificationsEnabled(): boolean {
  return (
    localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) === 'true' &&
    Notification.permission === 'granted'
  )
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  const permission = await Notification.requestPermission()
  const granted = permission === 'granted'
  localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, granted ? 'true' : 'false')
  return granted
}

export function setNotificationsEnabled(enabled: boolean): void {
  localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? 'true' : 'false')
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const arr = Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
  return arr.buffer as ArrayBuffer
}

export async function subscribeToWebPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!vapidKey) {
    console.warn('VITE_VAPID_PUBLIC_KEY is not set')
    return false
  }

  const registration = await navigator.serviceWorker.ready

  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })
  }

  const p256dh = subscription.getKey('p256dh')
  const auth = subscription.getKey('auth')
  if (!p256dh || !auth) return false

  await subscribePush({
    endpoint: subscription.endpoint,
    keys: {
      p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dh))),
      auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
    },
  })

  return true
}
