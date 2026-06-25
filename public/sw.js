const CACHE = 'bulkmate-sw-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

// Terima pesan dari main thread untuk tampilkan / jadwalkan notifikasi
self.addEventListener('message', event => {
  const { type, payload } = event.data || {}

  if (type === 'SHOW_NOTIFICATION') {
    showMealNotif(payload)
  }

  if (type === 'SCHEDULE_NOTIFICATION') {
    const { delay, ...rest } = payload
    setTimeout(() => showMealNotif(rest), delay)
  }
})

function showMealNotif({ title, body, tag, snoozeMinutes = 5 }) {
  self.registration.showNotification(title, {
    body,
    tag: tag || 'bulkmate-alarm',
    icon: '/vite.svg',
    badge: '/vite.svg',
    vibrate: [300, 100, 300, 100, 300, 100, 300],
    requireInteraction: true,
    data: { snoozeMinutes, title, body, tag },
    actions: [
      { action: 'ok',     title: 'Oke' },
      { action: 'snooze', title: `Snooze ${snoozeMinutes} menit` },
    ],
  })
}

self.addEventListener('notificationclick', event => {
  const { action, notification } = event
  const { snoozeMinutes = 5, title, body, tag } = notification.data || {}
  notification.close()

  if (action === 'snooze') {
    event.waitUntil(
      new Promise(resolve => {
        setTimeout(() => {
          showMealNotif({ title: `⏰ ${title}`, body: 'Snooze selesai! ' + body, tag: tag + '-snooze', snoozeMinutes })
          resolve()
        }, snoozeMinutes * 60 * 1000)
      })
    )
    return
  }

  // Fokus / buka app
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(list => {
      for (const client of list) {
        if ('focus' in client) return client.focus()
      }
      return self.clients.openWindow('/')
    })
  )
})
