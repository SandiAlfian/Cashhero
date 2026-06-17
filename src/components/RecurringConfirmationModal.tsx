"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAutoLogStore } from "@/store/useAutoLogStore"
import { useTransactionStore } from "@/store/useTransactionStore"
import { useLanguageStore } from "@/store/useLanguageStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { formatCurrency } from "@/lib/format"
import { removePendingItem } from "@/lib/pendingRecurring"

const frequencyLabel = (f: string, lang: string) => {
  if (f === 'daily') return lang === 'id' ? 'Harian' : 'Daily'
  if (f === 'weekly') return lang === 'id' ? 'Mingguan' : 'Weekly'
  if (f === 'monthly') return lang === 'id' ? 'Bulanan' : 'Monthly'
  return lang === 'id' ? 'Tahunan' : 'Yearly'
}

export function RecurringConfirmationModal() {
  const pendingItems = useAutoLogStore((s) => s.pendingItems)
  const confirmPending = useAutoLogStore((s) => s.confirmPending)
  const skipPending = useAutoLogStore((s) => s.skipPending)
  const rejectPending = useAutoLogStore((s) => s.rejectPending)
  const updateLastExecuted = useAutoLogStore((s) => s.updateLastExecuted)
  const language = useLanguageStore((s) => s.language)
  const securityPIN = useSettingsStore((s) => s.securityPIN)
  const biometricsRegistered = useSettingsStore((s) => s.biometricsRegistered)

  const [isVisible, setIsVisible] = React.useState(false)
  const [currentIdx, setCurrentIdx] = React.useState(0)
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)

  // Show modal if there are pending items AND security is either not set or user has had time to unlock
  React.useEffect(() => {
    if (pendingItems.length === 0) {
      setIsVisible(false)
      setCurrentIdx(0)
      return
    }
    // If security is active, give lock screen time to process (1.5s delay)
    if (securityPIN || biometricsRegistered) {
      const t = setTimeout(() => setIsVisible(true), 1500)
      return () => clearTimeout(t)
    }
    setIsVisible(true)
  }, [pendingItems.length, securityPIN, biometricsRegistered])

  const currentItem = pendingItems[currentIdx]
  const isId = language === 'id'

  const handleAction = async (action: 'confirm' | 'skip' | 'reject') => {
    if (!currentItem || actionLoading) return
    setActionLoading(action)

    if (action === 'confirm') {
      const result = confirmPending(currentItem.id)
      if (result) {
        updateLastExecuted(result.ruleId, result.dueDate)
        useTransactionStore.getState().addTransaction({
          amount: currentItem.amount,
          type: currentItem.type,
          category: currentItem.category,
          note: currentItem.title,
          date: new Date(currentItem.dueDate + 'T12:00:00').toISOString(),
          isRecurring: true,
          ruleId: currentItem.ruleId,
        })
        await removePendingItem(currentItem.id)
      }
    } else if (action === 'skip') {
      const result = skipPending(currentItem.id)
      if (result) {
        updateLastExecuted(result.ruleId, result.dueDate)
        await removePendingItem(currentItem.id)
      }
    } else if (action === 'reject') {
      rejectPending(currentItem.id)
      await removePendingItem(currentItem.id)
    }

    setActionLoading(null)
    // Move to next or close
    if (currentIdx < pendingItems.length - 1) {
      setCurrentIdx((i) => i + 1)
    } else {
      setIsVisible(false)
      setCurrentIdx(0)
    }
  }

  const remaining = pendingItems.length - currentIdx - 1

  if (!isVisible || !currentItem) return null

  return (
    <AnimatePresence>
      <motion.div
        key="recurring-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">
                {isId ? 'Konfirmasi Transaksi Berulang' : 'Confirm Recurring Transaction'}
              </h2>
              {pendingItems.length > 1 && (
                <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                  {currentIdx + 1}/{pendingItems.length}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isId
                ? 'Konfirmasi transaksi berulang berikut:'
                : 'Confirm the following recurring transaction:'}
            </p>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            {/* Title + Amount */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{currentItem.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {currentItem.category} &middot; {frequencyLabel(currentItem.frequency, language)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${currentItem.type === 'in' ? 'text-green-500' : 'text-red-500'}`}>
                  {currentItem.type === 'in' ? '+' : '-'}{formatCurrency(currentItem.amount, language as 'id' | 'en')}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {isId ? 'Jatuh tempo' : 'Due'}: {new Date(currentItem.dueDate + 'T12:00:00').toLocaleDateString(isId ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => handleAction('confirm')}
                disabled={actionLoading !== null}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary/90 active:scale-[0.97] transition-all duration-150 cursor-pointer disabled:opacity-50"
              >
                {actionLoading === 'confirm' ? (isId ? 'Memproses...' : 'Processing...') : isId ? 'Konfirmasi & Catat' : 'Confirm & Record'}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => handleAction('skip')}
                  disabled={actionLoading !== null}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-foreground bg-muted hover:bg-muted/80 active:scale-[0.97] transition-all duration-150 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading === 'skip' ? (isId ? '...' : '...') : isId ? 'Lewati' : 'Skip'}
                </button>

                <button
                  onClick={() => handleAction('reject')}
                  disabled={actionLoading !== null}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-destructive bg-destructive/10 hover:bg-destructive/20 active:scale-[0.97] transition-all duration-150 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading === 'reject' ? (isId ? '...' : '...') : isId ? 'Hentikan' : 'Reject'}
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-border/50 bg-muted/30">
            <p className="text-[10px] text-muted-foreground text-center">
              {remaining > 0
                ? isId
                  ? `${remaining + 1} transaksi tersisa setelah ini`
                  : `${remaining + 1} more transaction${remaining > 0 ? 's' : ''} remaining`
                : isId
                  ? 'Semua transaksi berulang telah diproses'
                  : 'All recurring transactions processed'}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
