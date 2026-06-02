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
      
      let friendlyMsg = errorMsg
      if (errorMsg.includes("applicationServerKey") || errorMsg.includes("VAPID") || errorMsg.includes("applicationServerKey is not valid")) {
        friendlyMsg = language === "id"
          ? "Kunci server notifikasi (VAPID Key) tidak valid. Kunci Publik (Public Key) resmi dari Firebase biasanya sepanjang 87 karakter. Harap periksa kembali dan pastikan Anda menyalin Kunci Publik secara lengkap dari Firebase Console."
          : "The notification server key (VAPID Key) is invalid. A standard Firebase Public Key is exactly 87 characters long. Please check and make sure you copied the full Public Key from your Firebase Console."
      } else {
        friendlyMsg = language === "id"
          ? `Gagal mengaktifkan notifikasi latar belakang: ${errorMsg}`
          : `Failed to enable background notifications: ${errorMsg}`
      }

      setError(friendlyMsg)
      setLoading(false)
      return null
    }
  }

  const unregisterPush = async () => {
    setLoading(true)
    setError(null)
    try {
      const app = initializeApp(firebaseConfig)
      const messaging = getMessaging(app)
      await deleteToken(messaging)
      setFcmToken("")
      setBackgroundPushEnabled(false)
    } catch (err: unknown) {
      console.error("FCM De-registration Error:", err)
      // Offload anyway to ensure user can retry
      setFcmToken("")
      setBackgroundPushEnabled(false)
    } finally {
      setLoading(false)
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
