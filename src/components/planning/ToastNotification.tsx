"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Check } from "lucide-react"

interface Props {
  show: boolean
  message: string
}

export function ToastNotification({ show, message }: Props) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed bottom-6 right-6 md:right-8 z-[10001] flex items-center gap-3 bg-foreground text-background dark:bg-card dark:text-foreground px-4 py-3 rounded-xl shadow-2xl border border-border/80 max-w-sm"
        >
          <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 font-bold" />
          </div>
          <span className="text-xs font-bold leading-normal">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
