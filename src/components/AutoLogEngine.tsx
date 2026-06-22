'use client'

import React from 'react'
import { useAutoLogStore, type PendingRecurring, type AutoLogFrequency } from '@/store/useAutoLogStore'
import { useTransactionStore } from '@/store/useTransactionStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useLanguageStore } from '@/store/useLanguageStore'
import { savePendingItems, removePendingItem as removeCachedPending } from '@/lib/pendingRecurring'

function countMissedDates(
  frequency: AutoLogFrequency,
  startDate: Date,
  lastExecuted: Date | null,
  today: Date
): Date[] {
  const from = lastExecuted ?? startDate
  const dates: Date[] = []
  const cursor = new Date(from)

  switch (frequency) {
    case 'daily': cursor.setDate(cursor.getDate() + 1); break
    case 'weekly': cursor.setDate(cursor.getDate() + 7); break
    case 'monthly': cursor.setMonth(cursor.getMonth() + 1); break
    case 'yearly': cursor.setFullYear(cursor.getFullYear() + 1); break
  }

  while (cursor <= today) {
    dates.push(new Date(cursor))
    switch (frequency) {
      case 'daily': cursor.setDate(cursor.getDate() + 1); break
      case 'weekly': cursor.setDate(cursor.getDate() + 7); break
      case 'monthly': cursor.setMonth(cursor.getMonth() + 1); break
      case 'yearly': cursor.setFullYear(cursor.getFullYear() + 1); break
    }
  }
  return dates
}

function processRules() {
  const rules = useAutoLogStore.getState().rules
  const existingPending = useAutoLogStore.getState().pendingItems
  const setPendingItems = useAutoLogStore.getState().setPendingItems

  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const newPending: PendingRecurring[] = []

  for (const rule of rules) {
    if (!rule.isActive) continue
    const startDate = new Date(rule.startDate)
    if (startDate > today) continue

    const lastEx = rule.lastExecutedDate ? new Date(rule.lastExecutedDate) : null
    const dates = countMissedDates(rule.frequency, startDate, lastEx, today)
    if (dates.length === 0) continue

    for (const d of dates) {
      const dueDate = d.toISOString().slice(0, 10)
      const alreadyPending = existingPending.some(
        (p) => p.ruleId === rule.id && p.dueDate === dueDate
      )
      if (alreadyPending) continue

      const item: PendingRecurring = {
        id: `${rule.id}-${dueDate}`,
        ruleId: rule.id,
        title: rule.title,
        amount: rule.amount,
        type: rule.type,
        category: rule.category,
        frequency: rule.frequency,
        dueDate,
        createdAt: new Date().toISOString(),
      }
      newPending.push(item)
    }
  }

  if (newPending.length === 0) return newPending.length

  // Batch add all new pending items to store
  const allPending = [...existingPending, ...newPending]
  setPendingItems(allPending)

  // Sync to Cache API for SW notifications
  savePendingItems(allPending)

  return newPending.length
}

export function AutoLogEngine() {
  const autoLogging = useSettingsStore((s) => s.autoLogging)
  const fetchExchangeRates = useSettingsStore((s) => s.fetchExchangeRates)
  const language = useLanguageStore((s) => s.language)
  const rules = useAutoLogStore((s) => s.rules)
  const fcmToken = useSettingsStore((s) => s.fcmToken)

  // Sync rules to Firestore when they change
  React.useEffect(() => {
    if (!autoLogging || !fcmToken || typeof window === 'undefined') return
    fetch('/api/fcm/recurring/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fcmToken, rules }),
    }).catch(() => {})
  }, [autoLogging, fcmToken, rules])

  const syncRules = React.useCallback(() => {
    const token = useSettingsStore.getState().fcmToken
    const currentRules = useAutoLogStore.getState().rules
    if (!token) return
    fetch('/api/fcm/recurring/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fcmToken: token, rules: currentRules }),
    }).catch(() => {})
  }, [])

  React.useEffect(() => {
    fetchExchangeRates()
    if (!autoLogging) return

    // Register SW
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    // Process rules on mount
    processRules()

    // Periodic check every 30 min while app is open
    const interval = setInterval(() => {
      processRules()
    }, 30 * 60 * 1000)

    return () => clearInterval(interval)
  }, [autoLogging, fetchExchangeRates, language])

  // Listen for recurring action results from SW
  React.useEffect(() => {
    const handler = (event: MessageEvent) => {
      const data = event.data
      if (!data || data.type !== 'RECURRING_ACTION') return
      const { action, pendingId } = data.payload
      const store = useAutoLogStore.getState()
      const item = store.pendingItems.find(p => p.id === pendingId)
      if (!item) return

      if (action === 'confirm') {
        const result = store.confirmPending(pendingId)
        if (result) {
          store.updateLastExecuted(result.ruleId, result.dueDate)
          useTransactionStore.getState().addTransaction({
            amount: item.amount,
            type: item.type,
            category: item.category,
            note: item.title,
            date: new Date(item.dueDate + 'T12:00:00').toISOString(),
            isRecurring: true,
            ruleId: item.ruleId,
          })
          removeCachedPending(pendingId)
          syncRules()
        }
      } else if (action === 'skip') {
        const result = store.skipPending(pendingId)
        if (result) {
          store.updateLastExecuted(result.ruleId, result.dueDate)
          removeCachedPending(pendingId)
          syncRules()
        }
      } else if (action === 'reject') {
        store.rejectPending(pendingId)
        removeCachedPending(pendingId)
        syncRules()
      }
    }

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handler)
    }
    return () => {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handler)
      }
    }
  }, [])

  return null
}
