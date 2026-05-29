// Cashhero Service Worker
// Handles background sync and future push notification support

const CACHE_NAME = 'cashhero-v1'

// ── Install ────────────────────────────────────────────────────────────────────
self.addEventListener('install', () => {
  self.skipWaiting()
})

// ── Activate ───────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch (Stale-While-Revalidate for static assets) ──────────────────────────
self.addEventListener('fetch', (event) => {
  // Hanya cache GET request untuk asset statis
  if (event.request.method !== 'GET') return
  if (event.request.url.includes('/api/')) return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      return cached || network
    })
  )
})

// ── Background Sync (untuk eksekusi auto log di latar belakang) ───────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'autolog-sync') {
    // Kirim pesan ke semua tab aktif agar AutoLogEngine dijalankan
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'AUTOLOG_SYNC' })
        })
      })
    )
  }
})

// ── Periodic Background Sync (Pengecekan Notifikasi Lokal) ────────────────────
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cashhero-smart-reminder') {
    event.waitUntil(
      (async () => {
        // Tembakkan notifikasi peringatan pintar jika diizinkan
        self.registration.showNotification('Cashhero - Pengingat Pintar', {
          body: 'Buka aplikasi untuk melihat transaksi rutin dan pembaruan portofolio Anda hari ini.',
          icon: '/cashhero-logo-192.png',
          badge: '/cashhero-logo-192.png',
          tag: 'cashhero-daily-reminder',
        })
      })()
    )
  }
})

// ── Menerima Pesan dari Client (Aplikasi Web) ──────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_LOCAL_NOTIFICATION') {
    const { title, options } = event.data.payload
    self.registration.showNotification(title, {
      ...options,
      icon: '/cashhero-logo-192.png',
      badge: '/cashhero-logo-192.png'
    })
  }
})

// ── Push Notification (jika menggunakan server backend FCM/WebPush) ───────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const title = data.title || 'Cashhero'
  const body = data.body || 'Ada notifikasi baru dari Cashhero.'

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/cashhero-logo-192.png',
      badge: '/cashhero-logo-192.png',
      tag: 'cashhero-notification',
    })
  )
})

// ── Notification Click ─────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      if (clients.length > 0) {
        clients[0].focus()
      } else {
        self.clients.openWindow('/')
      }
    })
  )
})
