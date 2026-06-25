const CACHE = 'bulkmate-v2'
const ASSETS = [
  '/',
  '/index.html',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
]

// Install: cache assets utama
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  )
})

// Activate: hapus cache lama
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// Fetch: network-first untuk API, cache-first untuk aset statis
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)
  // Skip non-GET & cross-origin requests
  if (e.request.method !== 'GET' || url.origin !== location.origin) return

  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return res
      })
      return cached || network
    })
  )
})

// Pesan dari main thread untuk notifikasi
self.addEventListener('message', event => {
  const { type, payload } = event.data || {}
  if (type === 'SHOW_NOTIFICATION') showMealNotif(payload)
  if (type === 'SCHEDULE_NOTIFICATION') {
    const { delay, ...rest } = payload
    setTimeout(() => showMealNotif(rest), delay)
  }
})

function showMealNotif({ title, body, tag, snoozeMinutes = 5 }) {
  self.registration.showNotification(title, {
    body,
    tag: tag || 'bulkmate-alarm',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
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
