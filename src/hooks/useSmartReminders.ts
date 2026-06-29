"use client"

import { useEffect, useRef } from "react"
import { useSettingsStore } from "@/store/useSettingsStore"
import { useLanguageStore } from "@/store/useLanguageStore"
import { useAutoLogStore } from "@/store/useAutoLogStore"

// ── Recurring Pending Deduplication ──────────────────────────────────────────
// Shows a local notification for recurring items that are pending confirmation.
// Uses localStorage to avoid notifying about the same items twice per day.
async function checkRecurringPending(lang: string) {
  try {
    if (!('serviceWorker' in navigator)) return
    const pending = useAutoLogStore.getState().pendingItems
    if (pending.length === 0) return

    // Dedup: skip if all pending items were already notified today
    const today = new Date().toISOString().slice(0, 10)
    const dedupKey = `cashhero-recurring-notified-${today}`
    const raw = localStorage.getItem(dedupKey)
    const notified: string[] = raw ? JSON.parse(raw) : []
    const unseen = pending.filter((p) => !notified.includes(p.id))
    if (unseen.length === 0) return

    // Mark all currently unseen as notified before showing
    const allIds = [...new Set([...notified, ...pending.map((p) => p.id)])]
    localStorage.setItem(dedupKey, JSON.stringify(allIds))

    const reg = await navigator.serviceWorker.ready
    if (unseen.length === 1) {
      const item = unseen[0]
      const prefix = item.type === 'in' ? '+' : '-'
      reg.active?.postMessage({
        type: 'SHOW_RECURRING_NOTIFICATION',
        payload: {
          items: [{
            ...item,
            amount: item.amount,
            title: item.title,
            category: item.category,
          }],
        },
      })
    } else {
      reg.active?.postMessage({
        type: 'SHOW_LOCAL_NOTIFICATION',
        payload: {
          title: lang === 'id' ? 'Transaksi Berulang' : 'Recurring Transactions',
          options: {
            body: lang === 'id'
              ? `${unseen.length} transaksi berulang menunggu konfirmasi. Buka aplikasi untuk merespon.`
              : `${unseen.length} recurring transactions pending confirmation. Open app to respond.`,
            tag: 'recurring-pending',
            renotify: false,
            vibrate: [200, 100, 200],
          },
        },
      })
    }
  } catch { /* ignore — SW not ready or permission denied */ }
}

// ── useSmartReminders ─────────────────────────────────────────────────────────
// Responsibilities:
//   1. Send language preference to SW so local notifications use the right locale
//   2. Register Periodic Background Sync (fallback for when FCM is unavailable)
//   3. Fire checkRecurringPending() once on mount + when pendingItems changes
//
// What this hook does NOT do (moved to server-side FCM cron + firebase-messaging-sw.js):
//   - Scheduling morning/evening reminders
//   - setInterval polling for slot notifications
//   - Showing audit report notifications
export function useSmartReminders() {
  const isNotificationEnabled = useSettingsStore((state) => state.isNotificationEnabled)
  const language = useLanguageStore((state) => state.language)
  const pendingItems = useAutoLogStore((state) => state.pendingItems)
  const prevPendingRef = useRef<string[]>([])

  // ── Effect 1: Setup SW language sync & Periodic Background Sync ─────────────
  useEffect(() => {
    if (!isNotificationEnabled || typeof window === "undefined" || !('serviceWorker' in navigator)) return

    navigator.serviceWorker.ready.then(async (registration) => {
      // Always keep SW in sync with current language preference
      registration.active?.postMessage({ type: 'SET_LANG', payload: { language } })

      // Register Periodic Background Sync (Chrome Android only, best-effort)
      // This allows the SW to wake up and call tryShowScheduled() without the app open.
      try {
        if ('periodicSync' in registration) {
          const status = await navigator.permissions.query({
            name: 'periodic-background-sync' as PermissionName,
          })
          if (status.state === 'granted') {
            const periodicSync = (registration as unknown as {
              periodicSync: { register(tag: string, opts?: { minInterval: number }): Promise<void> }
            }).periodicSync
            await periodicSync.register('cashhero-smart-reminder', {
              minInterval: 6 * 60 * 60 * 1000, // 6 hours minimum
            })
          }
        }
      } catch (e) {
        console.warn('[SmartReminders] Periodic Sync not supported:', e)
      }
    })
  }, [isNotificationEnabled, language])

  // ── Effect 2: Check recurring pending notifications ──────────────────────────
  // Fires on mount and whenever pendingItems changes (new recurring items added).
  // No setInterval needed — the AutoLogEngine drives pendingItems changes.
  useEffect(() => {
    if (!isNotificationEnabled || typeof window === "undefined") return
    if (Notification.permission !== 'granted') return

    const currentIds = pendingItems.map((p) => p.id)
    const prevIds = prevPendingRef.current

    // Only notify if there are genuinely new items since last check
    const hasNewItems = currentIds.some((id) => !prevIds.includes(id))
    prevPendingRef.current = currentIds

    if (hasNewItems && pendingItems.length > 0) {
      checkRecurringPending(language)
    }
  }, [isNotificationEnabled, language, pendingItems])
}
