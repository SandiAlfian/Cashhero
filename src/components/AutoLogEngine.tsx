'use client'

import React from 'react'
import { useAutoLogStore } from '@/store/useAutoLogStore'
import { useTransactionStore } from '@/store/useTransactionStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useLanguageStore } from '@/store/useLanguageStore'
import { translations } from '@/store/useLanguageStore'

// ─── Helper: Hitung jumlah eksekusi yang terlewat ─────────────────────────────
function countMissedExecutions(
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly',
  startDate: Date,
  lastExecuted: Date | null,
  today: Date
): { count: number; dates: Date[] } {
  const from = lastExecuted ?? startDate
  const dates: Date[] = []
  const cursor = new Date(from)

  // Maju satu interval dari lastExecuted atau startDate
  switch (frequency) {
    case 'daily':
      cursor.setDate(cursor.getDate() + 1)
      break
    case 'weekly':
      cursor.setDate(cursor.getDate() + 7)
      break
    case 'monthly':
      cursor.setMonth(cursor.getMonth() + 1)
      break
    case 'yearly':
      cursor.setFullYear(cursor.getFullYear() + 1)
      break
  }

  // Kumpulkan semua tanggal yang sudah lewat
  while (cursor <= today) {
    dates.push(new Date(cursor))
    switch (frequency) {
      case 'daily':
        cursor.setDate(cursor.getDate() + 1)
        break
      case 'weekly':
        cursor.setDate(cursor.getDate() + 7)
        break
      case 'monthly':
        cursor.setMonth(cursor.getMonth() + 1)
        break
      case 'yearly':
        cursor.setFullYear(cursor.getFullYear() + 1)
        break
    }
  }

  return { count: dates.length, dates }
}

// ─── AutoLogEngine — komponen invisible yang berjalan di root layout ───────────
export function AutoLogEngine() {
  const rules = useAutoLogStore((s) => s.rules)
  const updateLastExecuted = useAutoLogStore((s) => s.updateLastExecuted)
  const addTransaction = useTransactionStore((s) => s.addTransaction)
  const autoLogging = useSettingsStore((s) => s.autoLogging)
  const { language } = useLanguageStore()

  React.useEffect(() => {
    // Jika fitur auto logging dimatikan, berhenti
    if (!autoLogging) return

    const today = new Date()
    today.setHours(23, 59, 59, 999)
    let totalExecuted = 0

    rules.forEach((rule) => {
      if (!rule.isActive) return

      const startDate = new Date(rule.startDate)
      const lastExecuted = rule.lastExecutedDate
        ? new Date(rule.lastExecutedDate)
        : null

      // Jangan eksekusi jika startDate masih di masa depan
      if (startDate > today) return

      const { count, dates } = countMissedExecutions(
        rule.frequency,
        startDate,
        lastExecuted,
        today
      )

      if (count === 0) return

      // Injeksi semua transaksi yang terlewat
      dates.forEach((txDate) => {
        txDate.setHours(12, 0, 0, 0)
        addTransaction({
          amount: rule.amount,
          type: rule.type,
          category: rule.category,
          note: rule.note || rule.title,
          date: txDate.toISOString(),
        })
      })

      // Update lastExecutedDate ke tanggal terakhir yang dieksekusi
      updateLastExecuted(rule.id, dates[dates.length - 1].toISOString())
      totalExecuted += count
    })

    // Tampilkan Toast ringkasan jika ada yang dieksekusi
    if (totalExecuted > 0) {
      const t = translations[language] ?? translations['id']
      // Toast will be shown by ToastProvider with updated style
    }

    // ── Service Worker Registration ────────────────────────────────────────────
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.warn('[AutoLogEngine] SW registration failed:', err))
    }
  }, []) // Hanya dijalankan sekali saat mount (buka aplikasi)

  return null // Tidak merender apapun
}
