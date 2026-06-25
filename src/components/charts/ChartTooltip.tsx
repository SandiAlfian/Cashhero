"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { TooltipPosition } from "@/lib/statistics"

interface ChartTooltipProps {
  children: React.ReactNode
  show: boolean
  transform: TooltipPosition
  style: React.CSSProperties
}

export function ChartTooltip({ children, show, transform, style }: ChartTooltipProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, x: transform.x, y: `calc(${transform.y} + 8px)` }}
          animate={{ opacity: 1, scale: 1, x: transform.x, y: transform.y }}
          exit={{ opacity: 0, scale: 0.95, x: transform.x, y: `calc(${transform.y} + 8px)` }}
          transition={{ duration: 0.12 }}
          className="absolute z-50 bg-background/95 border border-border/80 p-3 rounded-lg shadow-xl backdrop-blur-md text-xs flex flex-col gap-1.5 pointer-events-none min-w-[140px]"
          style={style}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
