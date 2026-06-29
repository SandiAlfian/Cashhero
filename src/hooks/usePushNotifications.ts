"use client"

import { useState, useEffect, useRef } from "react"
import { getToken, deleteToken, onMessage } from "firebase/messaging"
import { getFirebaseMessaging } from "@/lib/firebase"
import { useSettingsStore } from "@/store/useSettingsStore"
import { useLanguageStore } from "@/store/useLanguageStore"

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "BH8k7LCG2K_wuiCDY0FfiwStzEbb0J-w2J9Blpf_munQ9-YenxM-HXJ6nGaVcgduNPTijUr8Dz1117uBaCWBAOw"

// ── Foreground Message Handler ────────────────────────────────────────────────
// When the app is OPEN, FCM delivers messages here via onMessage() instead of
// routing them through the service worker's onBackgroundMessage().
// Industry standard: show an in-app toast, NOT a native OS notification,
// so the user is not interrupted while actively using the app.
//
// This hook dispatches a custom DOM event that ToastProvider can listen to.
// Unsubscribe function stored in module scope to guarantee a single listener.
let foregroundUnsubscribe: (() => void) | null = null

function setupForegroundListener(language: string) {
  // Clean up any existing listener before registering a new one (idempotent)
  if (foregroundUnsubscribe) {
    foregroundUnsubscribe()
    foregroundUnsubscribe = null
  }

  const messaging = getFirebaseMessaging()
  if (!messaging) return

  foregroundUnsubscribe = onMessage(messaging, (payload) => {
    console.log('[usePushNotifications] Foreground message received:', payload)

    const title = payload.notification?.title || 'Cashhero'
    const body  = payload.notification?.body  || ''
    const data  = payload.data || {}

    // Dispatch a custom event so any component can display an in-app toast
    // without tightly coupling this hook to a specific UI component.
    window.dispatchEvent(new CustomEvent('cashhero:push-notification', {
      detail: {
        title,
        body,
        type: data.type || 'general',
        link: data.link || payload.fcmOptions?.link || null,
      },
    }))
  })
}

export function usePushNotifications() {
  const language = useLanguageStore((state) => state.language)
  const isBackgroundPushEnabled = useSettingsStore((state) => state.isBackgroundPushEnabled || false)
  const setBackgroundPushEnabled = useSettingsStore((state) => state.setBackgroundPushEnabled)
  const fcmToken = useSettingsStore((state) => state.fcmToken || "")
  const setFcmToken = useSettingsStore((state) => state.setFcmToken)

  const [isSupported, setIsSupported] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Support check ────────────────────────────────────────────────────────────
  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    setIsSupported(supported)
  }, [])

  // ── Foreground push listener ─────────────────────────────────────────────────
  // Activated only when the user has granted push permissions.
  // Uses module-level singleton to prevent duplicate listeners across re-renders.
  useEffect(() => {
    if (!isBackgroundPushEnabled || typeof window === "undefined") return
    if (Notification.permission !== "granted") return

    setupForegroundListener(language)

    return () => {
      // Keep the listener alive (it's a singleton), only clean up on unmount
      // of the last consumer — handled by module-level variable
    }
  }, [isBackgroundPushEnabled, language])

  // ── Token → SW sync ──────────────────────────────────────────────────────────
  // Forward FCM token to SW so notification-click recurring actions can call
  // the /api/fcm/recurring/action endpoint server-side.
  useEffect(() => {
    if (!fcmToken || typeof window === "undefined" || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.ready.then((reg) => {
      reg.active?.postMessage({ type: 'SET_FCM_TOKEN', payload: { token: fcmToken } })
    }).catch(() => { /* SW not ready */ })
  }, [fcmToken])

  // ── registerPush ─────────────────────────────────────────────────────────────
  const registerPush = async () => {
    if (!isSupported) {
      setError(language === "id"
        ? "Peramban ini tidak mendukung Notifikasi Push."
        : "This browser does not support Push Notifications.")
      return null
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Request OS-level notification permission
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        setError(language === "id"
          ? "Izin notifikasi ditolak oleh pengguna."
          : "Notification permission denied by user.")
        setBackgroundPushEnabled(false)
        setLoading(false)
        return null
      }

      // 2. Wait for Service Worker (firebase-messaging-sw.js) to be ready
      const registration = await navigator.serviceWorker.ready

      // 3. Get FCM token bound to the VAPID key and the active SW registration
      const token = await getToken(getFirebaseMessaging()!, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      })

      if (token) {
        setFcmToken(token)
        setBackgroundPushEnabled(true)
        setLoading(false)

        // 4. Register token + preferences on server
        fetch('/api/fcm/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, lang: language, filter: 'monthly' }),
        }).catch((err) => console.error('[PushNotifications] register failed', err))

        // 5. Activate foreground listener now that permission is granted
        setupForegroundListener(language)

        return token
      } else {
        setError(language === "id"
          ? "Gagal memperoleh token FCM dari Google."
          : "Failed to retrieve FCM token from Google.")
        setLoading(false)
        return null
      }
    } catch (err: unknown) {
      console.error("FCM Registration Error:", err)
      const errorMsg = err instanceof Error ? err.message : String(err)

      let friendlyMsg: string
      if (errorMsg.includes("applicationServerKey") || errorMsg.includes("VAPID")) {
        friendlyMsg = language === "id"
          ? "Kunci server notifikasi (VAPID Key) tidak valid. Salin Key Pair ke .env.local sebagai NEXT_PUBLIC_FIREBASE_VAPID_KEY."
          : "VAPID Key invalid. Copy the Key Pair from Firebase Console into .env.local as NEXT_PUBLIC_FIREBASE_VAPID_KEY."
      } else if (errorMsg.includes("messaging/unsupported-browser") || errorMsg.includes("unable to subscribe")) {
        friendlyMsg = language === "id"
          ? "Browser ini tidak mendukung push subscription. Coba Chrome atau Edge terbaru."
          : "This browser doesn't support push subscription. Try latest Chrome or Edge."
      } else {
        friendlyMsg = language === "id"
          ? `Gagal mendaftarkan notifikasi: ${errorMsg}`
          : `Failed to register notifications: ${errorMsg}`
      }

      setError(friendlyMsg)
      setLoading(false)
      return null
    }
  }

  // ── unregisterPush ───────────────────────────────────────────────────────────
  const unregisterPush = async () => {
    setLoading(true)
    setError(null)

    // Tear down foreground listener first
    if (foregroundUnsubscribe) {
      foregroundUnsubscribe()
      foregroundUnsubscribe = null
    }

    const currentToken = useSettingsStore.getState().fcmToken
    try {
      await deleteToken(getFirebaseMessaging()!)
    } catch (err: unknown) {
      console.error("FCM De-registration Error:", err)
    } finally {
      setFcmToken("")
      setBackgroundPushEnabled(false)
      setLoading(false)

      // Notify backend to remove token from push list
      if (currentToken) {
        fetch('/api/fcm/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: currentToken, lang: '', filter: '', remove: true }),
        }).catch((err) => console.error('[PushNotifications] unregister failed', err))
      }
    }
  }

  return {
    isSupported,
    isBackgroundPushEnabled,
    fcmToken,
    loading,
    error,
    registerPush,
    unregisterPush,
  }
}
