import webpush from 'web-push'

const { VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env
const vapidConfigured = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY)

if (vapidConfigured) {
  webpush.setVapidDetails(
    `mailto:${VAPID_EMAIL ?? 'admin@example.com'}`,
    VAPID_PUBLIC_KEY!,
    VAPID_PRIVATE_KEY!,
  )
} else {
  // Allows the API to boot without push configured (e.g. local dev).
  console.warn('[webpush] VAPID keys not set — push notifications disabled')
}

export async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: { title: string; body: string },
): Promise<void> {
  if (!vapidConfigured) {
    throw new Error('Push notifications not configured (missing VAPID keys)')
  }
  await webpush.sendNotification(
    { endpoint: subscription.endpoint, keys: subscription.keys },
    JSON.stringify(payload),
  )
}
