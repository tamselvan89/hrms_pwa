import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst } from 'workbox-strategies'

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

registerRoute(
  ({ url }) => url.origin === 'https://api.hrms.netkathir.com',
  new NetworkFirst({ cacheName: 'api-cache', networkTimeoutSeconds: 5 })
)

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({ cacheName: 'images' })
)

// ── Push notification handler (server-triggered) ───────────────────────────
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'Attendance Reminder', {
      body: data.body || '',
      icon: '/punch/icons/icon-192.png',
      badge: '/punch/icons/icon-192.png',
      data: { url: data.url || '/punch/' },
      requireInteraction: true,
      vibrate: [200, 100, 200],
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('/punch/') && 'focus' in client) return client.focus()
      }
      return clients.openWindow(event.notification.data.url)
    })
  )
})

// ── Local scheduled reminders (client-side, works while SW is alive) ───────
// Message from the app: schedule a punch-out reminder at 9 PM IST
self.addEventListener('message', event => {
  if (event.data?.type === 'SCHEDULE_PUNCHOUT_REMINDER') {
    const { msUntil9PM } = event.data

    // Clear any existing timer
    if (self._punchoutTimer) clearTimeout(self._punchoutTimer)

    if (msUntil9PM <= 0) return

    self._punchoutTimer = setTimeout(() => {
      self.registration.showNotification('⏰ Punch Out Reminder', {
        body: "You're still clocked in. Don't forget to punch out before leaving!",
        icon: '/punch/icons/icon-192.png',
        badge: '/punch/icons/icon-192.png',
        data: { url: '/punch/' },
        requireInteraction: true,
        vibrate: [300, 100, 300, 100, 300],
      })
    }, msUntil9PM)
  }

  if (event.data?.type === 'CANCEL_PUNCHOUT_REMINDER') {
    if (self._punchoutTimer) {
      clearTimeout(self._punchoutTimer)
      self._punchoutTimer = null
    }
  }
})
