"use client"

import { useEffect } from "react"
import { useSettingsStore } from "@/store/useSettingsStore"
import { useLanguageStore } from "@/store/useLanguageStore"
import { usePlanningStore } from "@/store/usePlanningStore"
import { usePortfolioStore } from "@/store/usePortfolioStore"
import { isSameMonth, differenceInDays } from "date-fns"

interface PeriodicSyncManager {
  register(tag: string, options?: { minInterval: number }): Promise<void>
}

export function useSmartReminders() {
  const isNotificationEnabled = useSettingsStore((state) => state.isNotificationEnabled)
  const language = useLanguageStore((state) => state.language)

  useEffect(() => {
    if (!isNotificationEnabled || typeof window === "undefined" || !('serviceWorker' in navigator)) return

    // 1. Try to register Periodic Background Sync
    navigator.serviceWorker.ready.then(async (registration) => {
      try {
        if ('periodicSync' in registration) {
          const status = await navigator.permissions.query({
            name: 'periodic-background-sync' as PermissionName,
          })

          if (status.state === 'granted') {
            // Register daily background sync (24 hours = 24 * 60 * 60 * 1000)
            const periodicSync = (registration as unknown as { periodicSync: PeriodicSyncManager }).periodicSync
            await periodicSync.register('cashhero-smart-reminder', {
              minInterval: 24 * 60 * 60 * 1000,
            })
          }
        }
      } catch (e) {
        console.warn('Periodic Sync not supported or restricted:', e)
      }
    })

    // 2. Perform Active Catch-up Notification Check (When app is opened)
    const checkAndNotify = async () => {
      if (Notification.permission !== "granted") return

      let hasNotificationToSend = false
      let title = "Cashhero Reminder"
      let body = ""

      // Check 1: Saving Goals / Planning
      const goals = usePlanningStore.getState().goals
      const activeGoals = goals.filter(g => g.collected < g.target)
      if (activeGoals.length > 0) {
        hasNotificationToSend = true
        title = language === 'id' ? 'Progres Tabungan Anda' : 'Saving Goals Progress'
        body = language === 'id' 
          ? `Anda memiliki ${activeGoals.length} target tabungan yang masih berjalan. Jangan lupa menabung!`
          : `You have ${activeGoals.length} active saving goals. Don't forget to save up!`
      }

      // Check 2: Portfolio Update Reminder (Monthly)
      if (!hasNotificationToSend) {
        const assets = usePortfolioStore.getState().assets
        const lastUpdatedStr = localStorage.getItem("cashhero-last-portfolio-update")
        if (assets.length > 0) {
          const lastUpdated = lastUpdatedStr ? new Date(lastUpdatedStr) : new Date(0)
          const today = new Date()
          
          if (!isSameMonth(today, lastUpdated) || differenceInDays(today, lastUpdated) > 14) {
            hasNotificationToSend = true
            title = language === 'id' ? 'Perbarui Portofolio Anda' : 'Update Your Portfolio'
            body = language === 'id'
              ? 'Waktunya memperbarui nilai aset Anda untuk bulan ini.'
              : 'It is time to update your asset valuations for this month.'
          }
        }
      }

      // Prevent spamming notification on every load. Only send once every 12 hours max.
      const lastSentStr = localStorage.getItem("cashhero-last-notification-sent")
      const lastSent = lastSentStr ? new Date(lastSentStr) : new Date(0)
      const hoursSinceLast = (new Date().getTime() - lastSent.getTime()) / (1000 * 60 * 60)

      if (hasNotificationToSend && hoursSinceLast > 12) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.active?.postMessage({
            type: 'SHOW_LOCAL_NOTIFICATION',
            payload: {
              title,
              options: { body }
            }
          })
          localStorage.setItem("cashhero-last-notification-sent", new Date().toISOString())
        })
      }
    }

    // Delay check slightly to ensure stores are loaded from persistence
    const timeout = setTimeout(checkAndNotify, 3000)
    return () => clearTimeout(timeout)

  }, [isNotificationEnabled, language])
}
