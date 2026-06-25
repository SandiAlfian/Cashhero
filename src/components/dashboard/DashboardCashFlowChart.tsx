"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Calendar, TrendingUp } from "lucide-react"
import {
  getCoordinates,
  createLinePath,
  createAreaPath,
  buildTooltipTransform as buildTooltipTransformFn,
  buildTooltipStyle as buildTooltipStyleFn,
  CHART_DIMENSIONS,
  GRID_LINES,
} from "@/lib/statistics"
import {
  type DashboardPeriodFilter,
  buildCashFlowData,
  PERIOD_FILTERS,
} from "@/lib/dashboard"
import type { Transaction } from "@/store/useTransactionStore"
import type { translations } from "@/store/useLanguageStore"

interface Props {
  language: 'id' | 'en'
  mounted: boolean
  t: (k: keyof typeof translations['id']) => string
  formatCurrency: (amount: number, lang: 'id' | 'en') => string
  filter: DashboardPeriodFilter
  setFilter: (p: DashboardPeriodFilter) => void
  startDate: string
  setStartDate: (s: string) => void
  endDate: string
  setEndDate: (s: string) => void
  filteredTransactions: Transaction[]
}

export function DashboardCashFlowChart({
  language,
  mounted,
  t,
  formatCurrency: fc,
  filter,
  setFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  filteredTransactions,
}: Props) {
  const [activeIdx, setActiveIdx] = React.useState<number | null>(null)
  const [clickedIdx, setClickedIdx] = React.useState<number | null>(null)
  const chartRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chartRef.current && !chartRef.current.contains(event.target as Node)) {
        setClickedIdx(null)
        setActiveIdx(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const displayData = React.useMemo(
    () => buildCashFlowData(filteredTransactions, filter, language),
    [filteredTransactions, filter, language]
  )

  const dims = CHART_DIMENSIONS
  const maxVal = Math.max(...displayData.flatMap((d) => [d.income, d.expense]), 1) * 1.15

  const incPts = displayData.map((d, i) => getCoordinates(i, d.income, maxVal, displayData.length, dims))
  const expPts = displayData.map((d, i) => getCoordinates(i, d.expense, maxVal, displayData.length, dims))

  const activeMinY = React.useMemo(() => {
    if (activeIdx === null || !incPts[activeIdx] || !expPts[activeIdx]) return 0
    return Math.min(incPts[activeIdx].y, expPts[activeIdx].y)
  }, [activeIdx, incPts, expPts])

  const tooltipTransform = React.useMemo(
    () => buildTooltipTransformFn(activeIdx, displayData, incPts, expPts, activeMinY),
    [activeIdx, displayData, incPts, expPts, activeMinY]
  )

  const tooltipStyle = React.useMemo(
    () => buildTooltipStyleFn(activeIdx, displayData, incPts, expPts, dims.svgWidth, dims.svgHeight, activeMinY),
    [activeIdx, displayData, incPts, expPts, dims.svgWidth, dims.svgHeight, activeMinY]
  )

  return (
    <Card
      ref={chartRef}
      className={`md:col-span-4 bg-card border-border shadow-sm relative transition-all duration-300 overflow-visible ${activeIdx !== null ? 'z-40' : 'z-10 hover:z-20'}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-card-foreground text-base font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            {t('cashFlow')}
          </CardTitle>
          <div className="flex items-center gap-3 text-xs shrink-0">
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
              {t('income')}
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
              {t('expense')}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-1 pb-2 flex flex-col gap-3">
        <div className="flex flex-col gap-2 border-b border-border/30 pb-2 no-print">
          <div className="flex flex-wrap items-center gap-1">
            {PERIOD_FILTERS.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setFilter(p)
                  setClickedIdx(null)
                  setActiveIdx(null)
                }}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all duration-200 cursor-pointer ${
                  filter === p
                    ? "bg-primary text-primary-foreground shadow-xs scale-[1.02]"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-transparent"
                }`}
              >
                {t(p)}
              </button>
            ))}
          </div>
          {filter === 'customPeriod' && (
            <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 text-[10px] pt-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-muted-foreground uppercase">{t('startDate')}:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-muted/30 border border-border rounded px-1.5 py-0.5 text-[10px] font-semibold text-foreground outline-none focus:border-primary"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-muted-foreground uppercase">{t('endDate')}:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-muted/30 border border-border rounded px-1.5 py-0.5 text-[10px] font-semibold text-foreground outline-none focus:border-primary"
                />
              </div>
            </div>
          )}
        </div>

        {displayData.length === 0 ? (
          <div className="h-[260px] w-full rounded-md border border-dashed border-border/60 bg-muted/5 flex flex-col items-center justify-center gap-3 text-center p-6">
            <TrendingUp className="w-8 h-8 text-primary/40 animate-pulse" />
            <p className="text-xs text-muted-foreground">
              {language === 'id' ? 'Belum ada data transaksi.' : 'No transaction data yet.'}
            </p>
          </div>
        ) : (
          <div className="w-full relative overflow-visible">
            <svg viewBox={`0 0 ${dims.svgWidth} ${dims.svgHeight}`} className="w-full h-auto overflow-visible" aria-label="Cash Flow Chart">
              <defs>
                <linearGradient id="dashIncGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="dashExpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#810B38" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#810B38" stopOpacity="0" />
                </linearGradient>
              </defs>

              {GRID_LINES.map((r, i) => (
                <line key={i} x1={dims.paddingX} y1={dims.paddingY + r * dims.chartHeight}
                  x2={dims.svgWidth - dims.paddingX} y2={dims.paddingY + r * dims.chartHeight}
                  className="stroke-border/40" strokeDasharray="4 4" />
              ))}

              <path d={createAreaPath(incPts, dims)} fill="url(#dashIncGrad)" />
              <path d={createAreaPath(expPts, dims)} fill="url(#dashExpGrad)" />

              <path d={createLinePath(incPts)} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
              <path d={createLinePath(expPts)} fill="none" stroke="#810B38" strokeWidth="2.5" strokeLinecap="round" />

              {activeIdx !== null && incPts[activeIdx] && (
                <line x1={incPts[activeIdx].x} y1={dims.paddingY}
                  x2={incPts[activeIdx].x} y2={dims.paddingY + dims.chartHeight}
                  className="stroke-primary/40" strokeWidth="1.5" strokeDasharray="3 3" />
              )}

              {displayData.map((_, i) => {
                const ip = incPts[i]
                const ep = expPts[i]
                const active = activeIdx === i
                if (!ip || !ep) return null
                return (
                  <g key={i}>
                    <circle cx={ip.x} cy={ip.y} r={active ? 6 : 3.5} fill="#10B981"
                      stroke="#fff" strokeWidth={active ? 2 : 1} className="transition-all duration-200" />
                    <circle cx={ep.x} cy={ep.y} r={active ? 6 : 3.5} fill="#810B38"
                      stroke="#fff" strokeWidth={active ? 2 : 1} className="transition-all duration-200" />
                  </g>
                )
              })}

              {displayData.map((d, i) => {
                const p = incPts[i]
                if (!p) return null
                if (filter === 'daily' && i % 4 !== 0 && i !== 23) return null
                if (filter === 'monthly' && (i + 1) % 5 !== 0 && i !== 0 && i !== displayData.length - 1) return null
                return (
                  <text key={i} x={p.x} y={dims.svgHeight - 10} textAnchor="middle"
                    className="fill-muted-foreground font-semibold text-[10px] uppercase tracking-wider">
                    {language === 'id' ? d.date : d.dateEn}
                  </text>
                )
              })}

              {displayData.map((_, i) => {
                const bw = dims.chartWidth / Math.max(1, displayData.length - 1)
                return (
                  <rect key={i} x={dims.paddingX + i * bw - bw / 2} y={dims.paddingY} width={bw} height={dims.chartHeight}
                    fill="transparent" className="cursor-pointer"
                    onMouseEnter={() => { if (clickedIdx === null) setActiveIdx(i) }}
                    onMouseLeave={() => { if (clickedIdx === null) setActiveIdx(null) }}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (clickedIdx === i) { setClickedIdx(null); setActiveIdx(null) }
                      else { setClickedIdx(i); setActiveIdx(i) }
                    }} />
                )
              })}
            </svg>

            <AnimatePresence>
              {activeIdx !== null && displayData[activeIdx] && incPts[activeIdx] && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, x: tooltipTransform.x, y: `calc(${tooltipTransform.y} + 8px)` }}
                  animate={{ opacity: 1, scale: 1, x: tooltipTransform.x, y: tooltipTransform.y }}
                  exit={{ opacity: 0, scale: 0.95, x: tooltipTransform.x, y: `calc(${tooltipTransform.y} + 8px)` }}
                  transition={{ duration: 0.12 }}
                  className="absolute z-50 bg-background/95 border border-border/80 p-3 rounded-lg shadow-xl backdrop-blur-md text-xs flex flex-col gap-1.5 pointer-events-none min-w-[140px]"
                  style={tooltipStyle}
                >
                  <div className="font-bold text-foreground border-b border-border/50 pb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>{language === 'id' ? displayData[activeIdx].date : displayData[activeIdx].dateEn}</span>
                  </div>
                  <div className="flex flex-col gap-1 font-semibold text-[11px] mt-0.5">
                    <div className="flex items-center justify-between gap-6 text-green-600 dark:text-green-400">
                      <span>{t('income')}:</span>
                      <span>{mounted ? fc(displayData[activeIdx].income, language) : 'Rp 0'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-6 text-primary">
                      <span>{t('expense')}:</span>
                      <span>{mounted ? fc(displayData[activeIdx].expense, language) : 'Rp 0'}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
