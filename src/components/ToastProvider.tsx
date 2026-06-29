'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Bell, X } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
export type ToastVariant = 'success' | 'error' | 'info' | 'push'

export interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
  title?: string // For push notifications: bold title above message
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant, title?: string) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = React.createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

// ─── Single Toast Item ─────────────────────────────────────────────────────────
function ToastCard({
  toast,
  onClose,
}: {
  toast: ToastItem
  onClose: () => void
}) {
  const duration = toast.variant === 'push' ? 6000 : 3500

  React.useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  const Icon = toast.variant === 'push' ? Bell : Check

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex items-start gap-3 bg-foreground text-background dark:bg-card dark:text-foreground px-4 py-3 rounded-xl shadow-2xl border border-border/80 max-w-sm"
    >
      <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-xs font-extrabold leading-tight mb-0.5 truncate">{toast.title}</p>
        )}
        <p className="text-xs font-semibold leading-normal opacity-90">{toast.message}</p>
      </div>
      <button
        onClick={onClose}
        className="shrink-0 mt-0.5 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Tutup"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  )
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const showToast = React.useCallback(
    (message: string, variant: ToastVariant = 'success', title?: string) => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { id, message, variant, title }])
    },
    []
  )

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // ── Listen for foreground FCM push messages ──────────────────────────────────
  // usePushNotifications dispatches 'cashhero:push-notification' when a FCM
  // message arrives while the app is open. We show an in-app toast instead of
  // a native OS notification (industry-standard foreground behavior).
  React.useEffect(() => {
    const handlePush = (e: Event) => {
      const { title, body } = (e as CustomEvent).detail || {}
      if (!body) return
      showToast(body, 'push', title || 'Cashhero')
    }
    window.addEventListener('cashhero:push-notification', handlePush)
    return () => window.removeEventListener('cashhero:push-notification', handlePush)
  }, [showToast])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Portal — bottom-right */}
      <div className="fixed bottom-6 right-6 md:right-8 z-[10001] flex flex-col gap-2.5 items-end pointer-events-none no-print">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto w-full max-w-sm">
              <ToastCard
                toast={toast}
                onClose={() => removeToast(toast.id)}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
