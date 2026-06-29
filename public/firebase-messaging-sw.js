// ── Firebase Cloud Messaging Service Worker ──────────────────────────────────
// Standalone FCM SW — handles ONLY background push messages from Firebase.
// sw.js handles PWA caching, sync, and local scheduled notifications.
// These two SWs are independent; do NOT importScripts between them.

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

// ── Background Message Handler ────────────────────────────────────────────────
// Called ONLY when the app is in the background or closed.
// When the app is in the foreground, the onMessage handler in the app handles it.
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);

  // Always close existing notifications with the same tag before showing a new one.
  // This prevents accumulation if the SW is woken up multiple times.
  const data = payload.data || {};
  const notifTitle = payload.notification?.title || 'Cashhero';
  const notifBody = payload.notification?.body || 'Ada notifikasi baru dari Cashhero.';

  // ── Recurring transaction notification ──
  if (data.type === 'recurring') {
    const actions = [];
    if (data.actionConfirm) actions.push({ action: 'recurring-confirm', title: data.actionConfirm });
    if (data.actionSkip)    actions.push({ action: 'recurring-skip',    title: data.actionSkip });
    if (data.actionReject)  actions.push({ action: 'recurring-reject',  title: data.actionReject });

    return self.registration.showNotification(notifTitle, {
      body: notifBody,
      icon: '/cashhero-logo-192.png',
      badge: '/cashhero-logo-192.png',
      // Stable tag → replaces any previous notification of the same recurring item
      tag: 'recurring-' + (data.pendingId || 'item'),
      renotify: false,
      data: {
        type: 'recurring',
        pendingId: data.pendingId,
        ruleId: data.ruleId,
        dueDate: data.dueDate,
        lang: data.lang,
        fcmToken: data.fcmToken || null,
        link: payload.fcmOptions?.link || '/',
      },
      vibrate: [200, 100, 200],
      actions,
    });
  }

  // ── Recurring summary (batch) ──
  if (data.type === 'recurring-summary') {
    return self.registration.showNotification(notifTitle, {
      body: notifBody,
      icon: '/cashhero-logo-192.png',
      badge: '/cashhero-logo-192.png',
      tag: 'recurring-pending',
      renotify: false,
      data: {
        type: 'recurring-batch',
        count: data.count,
        lang: data.lang,
        link: payload.fcmOptions?.link || '/',
      },
    });
  }

  // ── Morning reminder ──
  if (data.type === 'morning') {
    return self.registration.showNotification(notifTitle, {
      body: notifBody,
      icon: '/cashhero-logo-192.png',
      badge: '/cashhero-logo-192.png',
      tag: 'cashhero-morning',
      renotify: false,
      data: { link: payload.fcmOptions?.link || '/' },
    });
  }

  // ── Evening reminder ──
  if (data.type === 'evening') {
    return self.registration.showNotification(notifTitle, {
      body: notifBody,
      icon: '/cashhero-logo-192.png',
      badge: '/cashhero-logo-192.png',
      tag: 'cashhero-evening',
      renotify: false,
      data: { link: payload.fcmOptions?.link || '/' },
    });
  }

  // ── Audit report ──
  if (data.type === 'audit') {
    return self.registration.showNotification(notifTitle, {
      body: notifBody,
      icon: '/cashhero-logo-192.png',
      badge: '/cashhero-logo-192.png',
      tag: 'cashhero-audit-report',
      renotify: false,
      data: { link: payload.fcmOptions?.link || '/statistics' },
    });
  }

  // ── Generic / fallback ──
  return self.registration.showNotification(notifTitle, {
    body: notifBody,
    icon: '/cashhero-logo-192.png',
    badge: '/cashhero-logo-192.png',
    tag: 'cashhero-general',
    renotify: false,
    data: { link: payload.fcmOptions?.link || '/' },
  });
});

// ── Notification Click Handler ────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  const notifData = event.notification.data || {};
  const action = event.action;
  event.notification.close();

  // Handle recurring action buttons (confirm / skip / reject)
  if (action && action.startsWith('recurring-')) {
    const pendingId = notifData.pendingId;
    const fcmToken = notifData.fcmToken;
    if (!pendingId) return;
    const actionType = action.replace('recurring-', '');

    // Optimistically update server state
    if (fcmToken) {
      fetch('/api/fcm/recurring/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fcmToken, pendingId, action: actionType }),
      }).catch((err) => console.error('[FCM SW] recurring action failed', err));
    }

    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        const focused = clients.find((c) => c.focused) || clients[0];
        if (focused) {
          focused.postMessage({ type: 'RECURRING_ACTION', payload: { action: actionType, pendingId } });
          return focused.focus();
        }
        return self.clients.openWindow('/#recurring-action=' + actionType + '&pending-id=' + pendingId);
      })
    );
    return;
  }

  // Default: open or focus the app at the specified link
  const targetUrl = notifData.link || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const appClient = clients.find((c) => new URL(c.url).origin === self.location.origin);
      if (appClient) {
        appClient.postMessage({ type: 'NOTIFICATION_CLICK', payload: { link: targetUrl } });
        return appClient.focus();
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
