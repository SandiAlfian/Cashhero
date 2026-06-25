"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, ShieldAlert } from "lucide-react"

interface ConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  variant?: 'destructive' | 'warning' | 'info'
  icon?: 'alert' | 'shield'
  loading?: boolean
}

export function ConfirmModal({
  open, onOpenChange, onConfirm, title, message,
  confirmLabel, cancelLabel = 'Batal',
  variant = 'destructive', icon = 'alert', loading = false,
}: ConfirmModalProps) {
  const isDestructive = variant === 'destructive'
  const iconBg = isDestructive ? 'bg-red-500/10 border-red-500/20 text-red-500' : variant === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
  const btnClass = isDestructive
    ? 'bg-red-500 text-white hover:bg-red-600'
    : variant === 'warning'
      ? 'bg-amber-500 text-white hover:bg-amber-600'
      : 'bg-primary text-primary-foreground hover:bg-primary/90'

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { if (!loading) onOpenChange(false) }}
            className="absolute inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="relative bg-card text-card-foreground border border-border/60 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className={`w-11 h-11 rounded-full border flex items-center justify-center shrink-0 ${iconBg}`}>
                {icon === 'shield' ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-lg font-black tracking-tight text-foreground">{title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{message}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="w-full bg-muted/40 hover:bg-muted/70 border border-border text-foreground py-2 px-4 rounded-lg font-bold text-xs transition-all duration-200 cursor-pointer text-center select-none disabled:opacity-50"
              >{cancelLabel}</button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`w-full py-2 px-4 rounded-lg font-bold text-xs transition-all duration-200 cursor-pointer text-center shadow-md flex items-center justify-center gap-1.5 select-none disabled:opacity-55 ${btnClass}`}
              >
                {loading && (
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
