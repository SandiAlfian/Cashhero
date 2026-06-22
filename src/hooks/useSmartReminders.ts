"use client"

import { useEffect, useRef } from "react"
import { useSettingsStore } from "@/store/useSettingsStore"
import { useLanguageStore } from "@/store/useLanguageStore"
import { usePlanningStore } from "@/store/usePlanningStore"
import { useAutoLogStore } from "@/store/useAutoLogStore"
import { isEndOfPeriod, readAuditData, type PeriodFilter } from "@/lib/periodUtils"

function todaySlot(): string | null {
  const h = new Date().getHours() + new Date().getMinutes() / 60
  if (h >= 9 && h < 9.5) return '09:00'
  if (h >= 23) return '23:00'
  return null
}

function getSlotKey() {
  return `cashhero-slot-${new Date().toISOString().slice(0, 10)}`
}

function isSlotSent(slot: string): boolean {
  const raw = localStorage.getItem(getSlotKey())
  if (!raw) return false
  try {
    const sent: string[] = JSON.parse(raw)
    return sent.includes(slot)
  } catch {
    return false
  }
}

function markSlotSent(slot: string) {
  const key = getSlotKey()
  const raw = localStorage.getItem(key)
  let sent: string[] = []
  try { sent = raw ? JSON.parse(raw) : [] } catch { sent = [] }
  if (!sent.includes(slot)) sent.push(slot)
  localStorage.setItem(key, JSON.stringify(sent))
}

function getAuditKey() {
  return `cashhero-audit-sent-${new Date().toISOString().slice(0, 10)}`
}

async function isPeriodEndToday(): Promise<boolean> {
  try {
    const data = await readAuditData()
    return !!(data && data.filter && isEndOfPeriod(data.filter as PeriodFilter))
  } catch {
    return false
  }
}

async function checkRecurringPending() {
  try {
    const pending = useAutoLogStore.getState().pendingItems
    if (pending.length === 0) return
    const lang = useLanguageStore.getState().language as 'id' | 'en'

    // Dedup: skip if already notified today
    const today = new Date().toISOString().slice(0, 10)
    const dedupKey = `cashhero-recurring-notified-${today}`
    const raw = localStorage.getItem(dedupKey)
    const notified: string[] = raw ? JSON.parse(raw) : []
    const unseen = pending.filter(p => !notified.includes(p.id))
    if (unseen.length === 0) return

    // Mark all current pending as notified
    const allIds = pending.map(p => p.id)
    localStorage.setItem(dedupKey, JSON.stringify(allIds))

    const reg = await navigator.serviceWorker.ready
    if (unseen.length === 1) {
      reg.active?.postMessage({
        type: 'SHOW_RECURRING_NOTIFICATION',
        payload: { items: unseen.map(p => ({ ...p, amount: p.amount })) }
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
            vibrate: [200, 100, 200]
          }
        }
      })
    }
  } catch { /* ignore */ }
}

async function checkAuditNotification() {
  const sentKey = getAuditKey()
  if (localStorage.getItem(sentKey)) return

  const data = await readAuditData()
  if (!data) return
  if (!isEndOfPeriod(data.filter as PeriodFilter)) return

  const lang = data.language as 'id' | 'en'
  const title = lang === 'id' ? 'Laporan Audit Periode' : 'Period Audit Report'
  const body = lang === 'id'
    ? `Skor keuangan Anda: ${data.score}/100. ${data.topSuggestion || 'Lihat rincian di halaman statistik.'}`
    : `Your financial score: ${data.score}/100. ${data.topSuggestion || 'View details on the statistics page.'}`

  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.ready
  registration.active?.postMessage({
    type: 'SHOW_LOCAL_NOTIFICATION',
    payload: { title, options: { body, tag: 'cashhero-audit-report' } }
  })
  localStorage.setItem(sentKey, '1')
}

async function sendSlotNotification(slot: string, language: string) {
  if (await isPeriodEndToday()) return // period end: audit is priority, skip regular reminder

  markSlotSent(slot)
  let body = slot === '09:00'
    ? (language === 'id' ? 'Selamat pagi! 🌤️ Saatnya meninjau anggaran & mencatat pengeluaran hari ini.' : 'Good morning! 🌤️ Review your budget & log today\'s expenses.')
    : (language === 'id' ? 'Selamat malam! 🌙 Catat pengeluaran hari ini agar tetap sesuai anggaran.' : 'Good evening! 🌙 Log today\'s expenses to stay on budget.')

  const goals = usePlanningStore.getState().goals
  const activeGoals = goals.filter(g => g.collected < g.target)
  if (activeGoals.length > 0) {
    body += language === 'id'
      ? ` Target menabung: ${activeGoals.length} aktif.`
      : ` Saving goals: ${activeGoals.length} active.`
  }

  const registration = await navigator.serviceWorker.ready
  registration.active?.postMessage({
    type: 'SHOW_LOCAL_NOTIFICATION',
    payload: { title: 'Cashhero', options: { body, tag: 'cashhero-scheduled' } }
  })
}

export function useSmartReminders() {
  const isNotificationEnabled = useSettingsStore((state) => state.isNotificationEnabled)
  const language = useLanguageStore((state) => state.language)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isNotificationEnabled || typeof window === "undefined" || !('serviceWorker' in navigator)) return

    navigator.serviceWorker.ready.then(async (registration) => {
      // 1. Send language preference to SW
      registration.active?.postMessage({ type: 'SET_LANG', payload: { language } })

      // 2. Register Periodic Background Sync (6h)
      try {
        if ('periodicSync' in registration) {
          const status = await navigator.permissions.query({
            name: 'periodic-background-sync' as PermissionName,
          })
          if (status.state === 'granted') {
            const periodicSync = (registration as unknown as { periodicSync: { register(tag: string, opts?: { minInterval: number }): Promise<void> } }).periodicSync
            await periodicSync.register('cashhero-smart-reminder', {
              minInterval: 6 * 60 * 60 * 1000,
            })
          }
        }
      } catch (e) {
        console.warn('Periodic Sync not supported or restricted:', e)
      }
    })

    // 3. Immediate fire: regular slot or audit
    const slot = todaySlot()
    if (slot && !isSlotSent(slot)) {
      sendSlotNotification(slot, language)
    }
    checkAuditNotification()
    checkRecurringPending()

    // 4. Periodic check every 5 min while app is open
    intervalRef.current = setInterval(() => {
      const s = todaySlot()
      if (s && !isSlotSent(s)) {
        sendSlotNotification(s, language)
      }
      checkAuditNotification()
      checkRecurringPending()
    }, 5 * 60 * 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isNotificationEnabled, language])
}
