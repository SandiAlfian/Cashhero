// Cashhero Service Worker
// Handles background sync and Firebase FCM background push notification support

// ── Firebase Cloud Messaging Integration ──────────────────────────────────────
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBTBuTd-ddbCjebkhcXlwhi8wBD5A9IX4Q",
  authDomain: "cashhero-1ccbc.firebaseapp.com",
  projectId: "cashhero-1ccbc",
  storageBucket: "cashhero-1ccbc.firebasestorage.app",
  messagingSenderId: "274124067625",
  appId: "1:274124067625:web:5b043631a016f5c672dd38"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Received background message ', payload);
  const data = payload.data || {};

  if (data.type === 'recurring') {
    const actions = [];
    if (data.actionConfirm) actions.push({ action: 'recurring-confirm', title: data.actionConfirm });
    if (data.actionSkip) actions.push({ action: 'recurring-skip', title: data.actionSkip });
    if (data.actionReject) actions.push({ action: 'recurring-reject', title: data.actionReject });

    self.registration.showNotification(payload.notification?.title || 'Cashhero', {
      body: payload.notification?.body || '',
      icon: '/cashhero-logo-192.png',
      badge: '/cashhero-logo-192.png',
      tag: 'recurring-' + (data.pendingId || Date.now()),
      data: { type: 'recurring', pendingId: data.pendingId, ruleId: data.ruleId, dueDate: data.dueDate, lang: data.lang, fcmToken: storedFcmToken },
      vibrate: [200, 100, 200],
      actions,
    });
    return;
  }

  if (data.type === 'recurring-summary') {
    self.registration.showNotification(payload.notification?.title || 'Cashhero', {
      body: payload.notification?.body || '',
      icon: '/cashhero-logo-192.png',
      badge: '/cashhero-logo-192.png',
      tag: 'recurring-pending',
      data: { type: 'recurring-batch', count: data.count, lang: data.lang, fcmToken: storedFcmToken },
    });
    return;
  }

  const notificationTitle = payload.notification?.title || 'Cashhero';
  const notificationOptions = {
    body: payload.notification?.body || 'Ada notifikasi baru dari Cashhero.',
    icon: '/cashhero-logo-192.png',
    badge: '/cashhero-logo-192.png',
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

const CACHE_NAME = 'cashhero-v1'
const NOTI_CACHE = 'cashhero-notifications'
const AUDIT_CACHE = 'cashhero-audit'

// ── Scheduled notification helper ──────────────────────────────────────────────
// Uses Cache API as persistent KV store (survives SW restarts)
async function getSentSlots() {
  const cache = await caches.open(NOTI_CACHE)
  const key = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const res = await cache.match(key)
  if (res) return res.json()
  return []
}
async function markSlot(slot) {
  const cache = await caches.open(NOTI_CACHE)
  const key = new Date().toISOString().slice(0, 10)
  const existing = await getSentSlots()
  if (!existing.includes(slot)) existing.push(slot)
  cache.put(key, new Response(JSON.stringify(existing)))
  // Clean stale keys (keep last 7 days)
  const keys = await cache.keys()
  const cutoff = Date.now() - 7 * 86400000
  for (const req of keys) {
    const d = new Date(req.url.slice(req.url.lastIndexOf('/') + 1))
    if (d.getTime() < cutoff) cache.delete(req)
  }
}
function currentSlot() {
  const h = new Date().getHours() + new Date().getMinutes() / 60
  if (h >= 9 && h < 9.5) return '09:00'
  if (h >= 23) return '23:00'
  return null
}
function slotMessage(slot) {
  const lang = storedLang || 'id'
  if (lang === 'id') {
    if (slot === '09:00') return 'Selamat pagi! \u2604\ufe0f Saatnya meninjau anggaran & mencatat pengeluaran hari ini.'
    return 'Selamat malam! \ud83c\udf19 Catat pengeluaran hari ini agar tetap sesuai anggaran.'
  }
  if (slot === '09:00') return 'Good morning! \u2604\ufe0f Review your budget & log today\'s expenses.'
  return 'Good evening! \ud83c\udf19 Log today\'s expenses to stay on budget.'
}
function getLastDayOfMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}
function isEndOfPeriod(filter) {
  const now = new Date()
  const dow = now.getDay()
  const date = now.getDate()
  const month = now.getMonth()
  const year = now.getFullYear()
  switch (filter) {
    case 'weekly': return dow === 0
    case 'monthly': return date === getLastDayOfMonth(year, month)
    case 'quarterly': {
      const ld = [getLastDayOfMonth(year, 2), getLastDayOfMonth(year, 5), getLastDayOfMonth(year, 8), getLastDayOfMonth(year, 11)]
      return ld.includes(date) && [2, 5, 8, 11].includes(month)
    }
    case 'yearly': return month === 11 && date === 31
    default: return false
  }
}
async function tryShowScheduled() {
  const slot = currentSlot()
  if (!slot) return

  // Check if today is end-of-period from cached audit data
  const auditCache = await caches.open(AUDIT_CACHE)
  const dataRes = await auditCache.match('end-of-period-data')
  let isPeriodEnd = false
  if (dataRes) {
    try {
      const data = await dataRes.json()
      if (data && data.filter && isEndOfPeriod(data.filter)) isPeriodEnd = true
    } catch {}
  }

  if (isPeriodEnd) {
    try { await tryShowAuditReport() } catch (err) { console.error('[SW] tryShowAuditReport failed', err) }
    return
  }

  // Normal day: regular slot notifications
  const sent = await getSentSlots()
  if (slot === '23:00') {
    try { await tryShowAuditReport() } catch (err) { console.error('[SW] tryShowAuditReport failed', err) }
  }
  if (sent.includes(slot)) return
  await markSlot(slot)
  self.registration.showNotification('Cashhero', {
    body: slotMessage(slot),
    icon: '/cashhero-logo-192.png',
    badge: '/cashhero-logo-192.png',
    tag: 'cashhero-scheduled',
    vibrate: [200, 100, 200]
  })
}
async function tryShowAuditReport() {
  const auditKey = 'cashhero-audit-sent-' + new Date().toISOString().slice(0, 10)
  // Check if already sent today via Cache API
  const notiCache = await caches.open(NOTI_CACHE)
  const sentRes = await notiCache.match(auditKey)
  if (sentRes) return
  // Read cached audit data from client
  const auditCache = await caches.open(AUDIT_CACHE)
  const dataRes = await auditCache.match('end-of-period-data')
  if (!dataRes) return
  let data
  try { data = await dataRes.json() } catch { return }
  if (!data || !data.filter) return
  if (!isEndOfPeriod(data.filter)) return
  const lang = data.language || storedLang || 'id'
  const title = lang === 'id' ? 'Laporan Audit Periode' : 'Period Audit Report'
  const body = lang === 'id'
    ? 'Skor keuangan Anda: ' + data.score + '/100. ' + (data.topSuggestion || 'Lihat rincian di halaman statistik.')
    : 'Your financial score: ' + data.score + '/100. ' + (data.topSuggestion || 'View details on the statistics page.')
  notiCache.put(auditKey, new Response('1'))
  self.registration.showNotification(title, {
    body: body,
    icon: '/cashhero-logo-192.png',
    badge: '/cashhero-logo-192.png',
    tag: 'cashhero-audit-report',
    vibrate: [200, 100, 200]
  })
}

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
          .filter((key) => key !== CACHE_NAME && key !== NOTI_CACHE && key !== AUDIT_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => {
      // Start scheduled notification checker while SW is alive
      tryShowScheduled()
      setInterval(tryShowScheduled, 30 * 60 * 1000) // every 30 min
      return self.clients.claim()
    })
  )
})

// ── Fetch (Stale-While-Revalidate for static assets) ──────────────────────────
self.addEventListener('fetch', (event) => {
  // Hanya cache GET request dari origin yang sama untuk menghindari caching API eksternal
  if (event.request.method !== 'GET') return
  if (!event.request.url.startsWith(self.location.origin)) return
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

// ── Periodic Background Sync ───────────────────────────────────────────────────
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cashhero-smart-reminder') {
    event.waitUntil(tryShowScheduled())
  }
})

// ── Menerima Pesan dari Client (Aplikasi Web) ──────────────────────────────────
let storedLang = null
let storedFcmToken = null

self.addEventListener('message', (event) => {
  const data = event.data
  if (!data) return

  if (data.type === 'SHOW_LOCAL_NOTIFICATION') {
    const { title, options } = data.payload
    self.registration.showNotification(title, {
      ...options,
      icon: '/cashhero-logo-192.png',
      badge: '/cashhero-logo-192.png'
    })
    return
  }

  if (data.type === 'SET_LANG') {
    storedLang = data.payload?.language || 'id'
    return
  }

  if (data.type === 'SET_FCM_TOKEN') {
    storedFcmToken = data.payload?.token || null
    return
  }

  if (data.type === 'SHOW_RECURRING_NOTIFICATION') {
    const items = data.payload?.items || []
    if (items.length === 0) return
    if (items.length === 1) {
      const item = items[0]
      const isId = storedLang === 'id'
      const prefix = item.type === 'in' ? '+' : '-'
      self.registration.showNotification(
        isId ? 'Konfirmasi Transaksi Berulang' : 'Confirm Recurring Transaction',
        {
          body: isId
            ? item.title + ' - ' + prefix + ' ' + item.amount.toLocaleString() + ' (' + item.category + ')'
            : item.title + ' - ' + prefix + ' ' + item.amount.toLocaleString() + ' (' + item.category + ')',
          icon: '/cashhero-logo-192.png',
          badge: '/cashhero-logo-192.png',
          tag: 'recurring-' + item.id,
          vibrate: [200, 100, 200],
          data: { type: 'recurring', pendingId: item.id, fcmToken: storedFcmToken },
          actions: [
            { action: 'recurring-confirm', title: storedLang === 'id' ? 'Konfirmasi' : 'Confirm' },
            { action: 'recurring-skip', title: storedLang === 'id' ? 'Lewati' : 'Skip' },
            { action: 'recurring-reject', title: storedLang === 'id' ? 'Hentikan' : 'Reject' },
          ]
        }
      )
    } else {
      self.registration.showNotification(
        storedLang === 'id' ? 'Transaksi Berulang' : 'Recurring Transactions',
        {
          body: storedLang === 'id'
            ? items.length + ' transaksi berulang menunggu konfirmasi. Buka aplikasi untuk merespon.'
            : items.length + ' recurring transactions pending confirmation. Open app to respond.',
          icon: '/cashhero-logo-192.png',
          badge: '/cashhero-logo-192.png',
          tag: 'recurring-pending',
          vibrate: [200, 100, 200],
          data: { type: 'recurring-batch', count: items.length },
        }
      )
    }
    return
  }
})

// ── Notification Click ─────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  const notifData = event.notification.data || {}
  const action = event.action
  event.notification.close()

  // Handle recurring notification actions
  if (action && action.startsWith('recurring-')) {
    const pendingId = notifData.pendingId
    const fcmToken = notifData.fcmToken
    if (!pendingId) return
    const actionType = action.replace('recurring-', '') // confirm, skip, or reject

    // Update server-side state (Firestore)
    if (fcmToken) {
      fetch('/api/fcm/recurring/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fcmToken, pendingId, action: actionType }),
      }).catch((err) => console.error('[SW] action fetch failed', err))
    }

    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        if (clients.length > 0) {
          clients[0].postMessage({
            type: 'RECURRING_ACTION',
            payload: { action: actionType, pendingId }
          })
          return clients[0].focus()
        }
        return self.clients.openWindow('/#recurring-action=' + actionType + '&pending-id=' + pendingId)
      })
    )
    return
  }

  // Default click: open or focus app
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
