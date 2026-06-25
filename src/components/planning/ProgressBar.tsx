"use client"

import { motion } from "framer-motion"

interface Props {
  percentage: number
  isCritical?: boolean
  className?: string
}

export function ProgressBar({ percentage, isCritical = false, className = "h-2.5" }: Props) {
  return (
    <div className={`w-full ${className} rounded-full bg-muted/70 relative overflow-hidden border border-border/20`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`h-full rounded-full transition-all duration-300 ${
          isCritical ? "bg-primary shadow-[0_0_8px_rgba(129,11,56,0.3)]" : "bg-green-500"
        }`}
      />
    </div>
  )
}
