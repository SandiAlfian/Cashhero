"use client"

import { useState, useEffect } from "react"
import { initializeApp } from "firebase/app"
import { getMessaging, getToken, deleteToken } from "firebase/messaging"
import { useSettingsStore } from "@/store/useSettingsStore"
import { useLanguageStore } from "@/store/useLanguageStore"

const firebaseConfig = {
  apiKey: "AIzaSyBTBuTd-ddbCjebkhcXlwhi8wBD5A9IX4Q",
  authDomain: "cashhero-1ccbc.firebaseapp.com",
  projectId: "cashhero-1ccbc",
  storageBucket: "cashhero-1ccbc.firebasestorage.app",
  messagingSenderId: "274124067625",
  appId: "1:274124067625:web:5b043631a016f5c672dd38"
}

const VAPID_KEY = "BH8k7LCG2K_wuiCDY0FfiwStzEbb0J-w2J9Blpf_munQ9-YenxM-HXJ6nGaVcgduNPTijUr8Dz1117uBaCWBAOw"

export function usePushNotifications() {
  const language = useLanguageStore((state) => state.language)
  const isBackgroundPushEnabled = useSettingsStore((state) => state.isBackgroundPushEnabled || false)
  const setBackgroundPushEnabled = useSettingsStore((state) => state.setBackgroundPushEnabled)
  const fcmToken = useSettingsStore((state) => state.fcmToken || "")
  const setFcmToken = useSettingsStore((state) => state.setFcmToken)

  const [isSupported, setIsSupported] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkSupport = () => {
      const supported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window
      setIsSupported(supported)
    }
    checkSupport()
  }, [])

  const registerPush = async () => {
    if (!isSupported) {
      const msg =
        language === "id"
          ? "Peramban ini tidak mendukung Notifikasi Push."
          : "This browser does not support Push Notifications."
      setError(msg)
      return null
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Request Notification Permission
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        const msg =
          language === "id"
            ? "Izin notifikasi ditolak oleh pengguna."
            : "Notification permission denied by user."
        setError(msg)
        setBackgroundPushEnabled(false)
        setLoading(false)
        return null
      }

      // 2. Wait for Service Worker to be ready
      const registration = await navigator.serviceWorker.ready

      // 3. Initialize Firebase App
      const app = initializeApp(firebaseConfig)
      const messaging = getMessaging(app)

      // 4. Get FCM token passing the VAPID key and custom SW registration
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      })

      if (token) {
        setFcmToken(token)
        setBackgroundPushEnabled(true)
        setLoading(false)
        // Send token to backend for server-side FCM push
        fetch('/api/fcm/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, lang: language, filter: 'monthly' }),
        }).catch(() => {})
        return token
      } else {
        const msg =
          language === "id"
            ? "Gagal memperoleh token FCM dari Google."
            : "Failed to retrieve FCM token from Google."
        setError(msg)
        setLoading(false)
        return null
      }
    } catch (err: unknown) {
      console.error("FCM Registration Error:", err)
      const errorMsg = err instanceof Error ? err.message : String(err)
      
      let friendlyMsg
      if (errorMsg.includes("applicationServerKey") || errorMsg.includes("VAPID") || errorMsg.includes("applicationServerKey is not valid")) {
        friendlyMsg = language === "id"
          ? "Kunci server notifikasi (VAPID Key) tidak valid. Buka Firebase Console → Project Settings → Cloud Messaging → Web Push certificates, salin Key Pair ke usePushNotifications.ts baris 18."
          : "VAPID Key invalid. Go to Firebase Console → Project Settings → Cloud Messaging → Web Push certificates, copy the Key Pair into usePushNotifications.ts line 18."
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

  const unregisterPush = async () => {
    setLoading(true)
    setError(null)
    const currentToken = useSettingsStore.getState().fcmToken
    try {
      const app = initializeApp(firebaseConfig)
      const messaging = getMessaging(app)
      await deleteToken(messaging)
      setFcmToken("")
      setBackgroundPushEnabled(false)
    } catch (err: unknown) {
      console.error("FCM De-registration Error:", err)
      setFcmToken("")
      setBackgroundPushEnabled(false)
    } finally {
      setLoading(false)
      // Notify backend to remove token
      if (currentToken) {
        fetch('/api/fcm/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: currentToken, lang: '', filter: '', remove: true }),
        }).catch(() => {})
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
