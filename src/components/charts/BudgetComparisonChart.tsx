"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BarChart3 } from "lucide-react"
import { formatCurrency } from "@/lib/format"
import { GRID_LINES, type CategoryMonthData } from "@/lib/statistics"

interface Props {
  data: CategoryMonthData[]
  language: string
  t: (k: string) => string
}

export function BudgetComparisonChart({ data, language, t }: Props) {
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null)
  const chartRef = React.useRef<HTMLDivElement>(null)
  const [tooltipPos, setTooltipPos] = React.useState({ x: 0, y: 0 })

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
        <BarChart3 className="w-10 h-10 opacity-30" />
        <p className="text-sm font-medium">{t('noBudgetData')}</p>
      </div>
    )
  }

  const paddingX = 90, paddingY = 24, svgW = 700, svgH = 300
  const chartW = svgW - paddingX * 2, chartH = svgH - paddingY * 2
  const maxVal = Math.max(...data.map((d) => Math.max(d.periodBudget, d.periodActual, 1)))
  const groups = data.length
  const groupGap = Math.max(8, Math.min(20, 80 / groups))
  const totalGroupW = (chartW - groupGap * (groups - 1)) / groups
  const barGap = 5, barW = (totalGroupW - barGap) / 2

  const getBarColor = (usage: number) => {
    if (usage > 100) return { fill: '#EF4444', stop: 'rgba(239,68,68,0.8)' }
    if (usage > 85) return { fill: '#F59E0B', stop: 'rgba(245,158,11,0.8)' }
    return { fill: '#10B981', stop: 'rgba(16,185,129,0.8)' }
  }

  return (
    <div className="w-full relative overflow-visible select-none" ref={chartRef}>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="budgetBarAvgGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#810B38" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#810B38" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        {GRID_LINES.map((r) => {
          const y = paddingY + r * chartH
          return <line key={r} x1={paddingX} y1={y} x2={svgW - paddingX} y2={y} className="stroke-border/40" strokeDasharray="4 4" />
        })}
        {GRID_LINES.map((r) => {
          const y = paddingY + r * chartH
          const val = maxVal - r * maxVal
          return <text key={r} x={paddingX - 10} y={val === maxVal ? y - 2 : y + 4} textAnchor="end" className="fill-muted-foreground font-semibold text-[9px]">{formatCurrency(val, language as 'id' | 'en')}</text>
        })}
        {hoveredIdx !== null && data[hoveredIdx] && (
          <line x1={paddingX + hoveredIdx * (totalGroupW + groupGap) + totalGroupW / 2} y1={paddingY}
            x2={paddingX + hoveredIdx * (totalGroupW + groupGap) + totalGroupW / 2} y2={paddingY + chartH}
            className="stroke-primary/50" strokeWidth="1.5" strokeDasharray="3 3" />
        )}
        {data.map((d, i) => {
          const xCenter = paddingX + i * (totalGroupW + groupGap) + totalGroupW / 2
          const actualH = (d.periodActual / maxVal) * chartH
          const actualY = paddingY + chartH - actualH
          const isHovered = hoveredIdx === i
          const barColor = getBarColor(d.usagePercent)
          const barOpacity = isHovered ? 1 : hoveredIdx !== null ? 0.45 : 0.85
          return (
            <g key={i} className="transition-all duration-200">
              <rect x={xCenter - barW - barGap / 2} y={paddingY + chartH - (d.periodBudget / maxVal) * chartH}
                width={barW} height={Math.max(2, (d.periodBudget / maxVal) * chartH)}
                fill="url(#budgetBarAvgGrad)" rx={3} opacity={barOpacity} />
              <rect x={xCenter + barGap / 2} y={actualY} width={barW} height={Math.max(2, actualH)}
                fill={barColor.fill} rx={3} opacity={barOpacity} />
              <text x={xCenter} y={svgH - 8} textAnchor="middle" className="fill-muted-foreground font-semibold text-[9px] uppercase tracking-wider">{d.category}</text>
              <rect x={xCenter - totalGroupW / 2} y={paddingY} width={totalGroupW} height={chartH} fill="transparent" className="cursor-pointer"
                onMouseEnter={(e) => { setHoveredIdx(i); const sr = e.currentTarget.closest('svg')?.getBoundingClientRect(); if (sr) setTooltipPos({ x: e.clientX - sr.left, y: e.clientY - sr.top }) }}
                onMouseLeave={() => setHoveredIdx(null)}
                onMouseMove={(e) => { const sr = e.currentTarget.closest('svg')?.getBoundingClientRect(); if (sr) setTooltipPos({ x: e.clientX - sr.left, y: e.clientY - sr.top }) }} />
            </g>
          )
        })}
      </svg>
      <AnimatePresence>
        {hoveredIdx !== null && data[hoveredIdx] && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 bg-background/95 border border-border/80 p-3 rounded-lg shadow-xl backdrop-blur-md text-xs flex flex-col gap-1.5 pointer-events-none min-w-[160px]"
            style={{ left: Math.min(tooltipPos.x, (chartRef.current?.offsetWidth || 300) - 180), top: Math.max(10, tooltipPos.y - 120), transform: 'translateX(8px)' }}
          >
            <div className="font-bold text-foreground border-b border-border/50 pb-1 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-primary" />
              <span>{data[hoveredIdx].category}</span>
            </div>
            <div className="flex flex-col gap-1 font-semibold text-[11px] mt-0.5">
              <div className="flex items-center justify-between gap-6 text-primary">
                <span>{t('periodBudget')}:</span>
                <span className="font-number">{formatCurrency(data[hoveredIdx].periodBudget, language as 'id' | 'en')}</span>
              </div>
              <div className="flex items-center justify-between gap-6 text-green-600 dark:text-green-400">
                <span>{t('periodActual')}:</span>
                <span className="font-number">{formatCurrency(data[hoveredIdx].periodActual, language as 'id' | 'en')}</span>
              </div>
              <div className="flex items-center justify-between gap-6 text-muted-foreground">
                <span>{t('usage')}:</span>
                <span className="font-number">{data[hoveredIdx].usagePercent.toFixed(1)}%</span>
              </div>
              <div className={`flex items-center justify-between gap-6 border-t border-border/40 pt-1 mt-1 font-bold ${data[hoveredIdx].variance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                <span>{t('netVariance')}:</span>
                <span className="font-number">{data[hoveredIdx].variance >= 0 ? '+' : ''}{formatCurrency(data[hoveredIdx].variance, language as 'id' | 'en')}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center justify-center gap-6 mt-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(180deg, #810B38, rgba(129,11,56,0.35))' }} />
          <span className="text-[10px] font-semibold text-muted-foreground">{t('periodBudget')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-green-500" />
          <span className="text-[10px] font-semibold text-muted-foreground">{t('periodActual')}</span>
        </div>
      </div>
    </div>
  )
}
