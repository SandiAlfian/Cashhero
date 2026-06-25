"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { formatCurrency } from "@/lib/format"
import type { CategoryMonthData } from "@/lib/statistics"

interface Props {
  data: CategoryMonthData[]
  language: string
  t: (k: string) => string
}

export function PieComparisonChart({ data, language, t }: Props) {
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null)
  const chartRef = React.useRef<HTMLDivElement>(null)
  const [tooltipPos, setTooltipPos] = React.useState({ x: 0, y: 0 })

  if (data.length === 0) return null

  const totalBudget = data.reduce((sum, d) => sum + d.periodBudget, 0)
  const totalActual = data.reduce((sum, d) => sum + d.periodActual, 0)
  const overallUsage = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0

  const cx = 140, cy = 140, outerR = 115, innerR = 70
  const midR = (outerR + innerR) / 2
  const circ = 2 * Math.PI * midR
  const strokeW = outerR - innerR
  const sorted = [...data].sort((a, b) => b.limit - a.limit)

  let cumulativeSeg = 0
  const slices = sorted.map((d) => {
    const budgetPct = totalBudget > 0 ? d.limit / totalBudget : 0
    const usageRatio = d.periodBudget > 0 ? Math.min(1, d.periodActual / d.periodBudget) : 0
    const segLen = circ * budgetPct
    const usageLen = segLen * usageRatio
    const offset = -cumulativeSeg
    cumulativeSeg += segLen
    const usagePct = d.periodBudget > 0 ? (d.periodActual / d.periodBudget) * 100 : 0
    const color = usagePct > 100 ? '#EF4444' : usagePct > 85 ? '#F59E0B' : '#10B981'
    return { ...d, budgetPct, usageRatio, segLen, usageLen, offset, color, usagePct }
  })

  return (
    <div className="w-full flex flex-col lg:flex-row items-center gap-8 py-4" ref={chartRef}>
      <div className="relative shrink-0" style={{ width: 280, height: 280 }}>
        <svg viewBox="0 0 280 280" className="w-full h-full">
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            {slices.map((s, i) => (
              <g key={i} className="cursor-pointer"
                onMouseEnter={(e) => { setHoveredIdx(i); const r = e.currentTarget.closest('svg')?.getBoundingClientRect(); if (r) setTooltipPos({ x: e.clientX - r.left, y: e.clientY - r.top }) }}
                onMouseLeave={() => setHoveredIdx(null)}
                onMouseMove={(e) => { const r = e.currentTarget.closest('svg')?.getBoundingClientRect(); if (r) setTooltipPos({ x: e.clientX - r.left, y: e.clientY - r.top }) }}
              >
                <circle cx={cx} cy={cy} r={midR} fill="none" stroke="#810B38"
                  strokeWidth={strokeW} strokeLinecap="butt"
                  strokeDasharray={`${s.segLen} ${circ - s.segLen}`}
                  strokeDashoffset={s.offset}
                  opacity={hoveredIdx === null || hoveredIdx === i ? 0.2 : 0.08}
                  className="transition-all duration-200" />
                <circle cx={cx} cy={cy} r={midR} fill="none" stroke={s.color}
                  strokeWidth={strokeW} strokeLinecap="butt"
                  strokeDasharray={`${s.usageLen} ${circ - s.usageLen}`}
                  strokeDashoffset={s.offset}
                  opacity={hoveredIdx === null || hoveredIdx === i ? 0.9 : 0.4}
                  className="transition-all duration-200" />
                <circle cx={cx} cy={cy} r={midR} fill="none" stroke="transparent"
                  strokeWidth={strokeW + 4}
                  strokeDasharray={`${s.segLen} ${circ - s.segLen}`}
                  strokeDashoffset={s.offset} />
              </g>
            ))}
          </g>
          <circle cx={cx} cy={cy} r={innerR} className="fill-background" />
          <text x={cx} y={cy - 14} textAnchor="middle" className="fill-muted-foreground text-[9px] font-semibold uppercase tracking-wider">{t('usage')}</text>
          <text x={cx} y={cy + 6} textAnchor="middle" className="fill-foreground font-extrabold text-xl font-number">{overallUsage.toFixed(1)}%</text>
          <text x={cx} y={cy + 22} textAnchor="middle" className="fill-muted-foreground text-[8px]">{t('periodBudget')}: {formatCurrency(totalBudget, language as 'id' | 'en')}</text>
        </svg>
        <AnimatePresence>
          {hoveredIdx !== null && slices[hoveredIdx] && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className="absolute z-50 bg-background/95 border border-border/80 p-3 rounded-lg shadow-xl backdrop-blur-md text-xs flex flex-col gap-1.5 pointer-events-none min-w-[160px]"
              style={{ left: Math.min(tooltipPos.x, 220), top: Math.max(10, tooltipPos.y - 120), transform: 'translateX(8px)' }}
            >
              <div className="font-bold text-foreground border-b border-border/50 pb-1.5 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slices[hoveredIdx].color }} />
                <span>{slices[hoveredIdx].category}</span>
              </div>
              <div className="flex flex-col gap-1 font-semibold text-[11px]">
                <div className="flex items-center justify-between gap-4 text-primary">
                  <span>{t('periodBudget')}:</span>
                  <span className="font-number">{formatCurrency(slices[hoveredIdx].periodBudget, language as 'id' | 'en')}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-green-600 dark:text-green-400">
                  <span>{t('periodActual')}:</span>
                  <span className="font-number">{formatCurrency(slices[hoveredIdx].periodActual, language as 'id' | 'en')}</span>
                </div>
                <div className={`flex items-center justify-between gap-4 border-t border-border/40 pt-1 mt-0.5 font-bold ${slices[hoveredIdx].variance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                  <span>{t('netVariance')}:</span>
                  <span className="font-number">{slices[hoveredIdx].variance >= 0 ? '+' : ''}{formatCurrency(slices[hoveredIdx].variance, language as 'id' | 'en')}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex flex-col gap-1.5 w-full lg:min-w-[220px] lg:max-w-[280px]">
        {slices.map((s, i) => (
          <div key={i} className={`flex items-center gap-2.5 text-xs p-2 rounded-lg transition-all duration-200 cursor-pointer ${hoveredIdx === i ? 'bg-muted/30' : ''}`}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <div className="flex flex-col flex-1 min-w-0 gap-0.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground truncate">{s.category}</span>
                <span className={`font-number ml-2 text-[10px] font-bold ${s.variance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                  {s.usagePct.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-muted/40 rounded-full h-1.5 relative overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, s.usagePct)}%`, backgroundColor: usageColor(s.usagePct) }} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground/70">
                <span>{formatCurrency(s.periodActual, language as 'id' | 'en')} / {formatCurrency(s.periodBudget, language as 'id' | 'en')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function usageColor(pct: number) {
  if (pct > 100) return '#EF4444'
  if (pct > 85) return '#F59E0B'
  return '#10B981'
}
