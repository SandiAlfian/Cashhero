"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguageStore, translations } from "@/store/useLanguageStore"
import { usePlanningStore } from "@/store/usePlanningStore"
import { formatCurrency } from "@/lib/format"
import { isEndOfPeriod, saveAuditData } from "@/lib/periodUtils"
import { motion, AnimatePresence } from "framer-motion"
import type { Transaction } from "@/store/useTransactionStore"
import { TrendingUp, PiggyBank, Target, AlertTriangle, CheckCircle, ShieldCheck, BarChart3, Wallet, Activity, DollarSign, ChevronDown, PieChart } from "lucide-react"

interface CategoryMonthData {
  category: string
  limit: number
  periodBudget: number
  periodActual: number
  variance: number
  usagePercent: number
  status: 'optimal' | 'frugal' | 'overbudget' | 'critical'
}

interface UnbudgetedCategoryData {
  category: string
  txCount: number
  avgPerTransaction: number
  totalSpent: number
}

interface AuditResult {
  score: number
  savingsRateScore: number
  budgetComplianceScore: number
  volatilityScore: number
  savingsRate: number
  complianceRate: number
  volatility: number
  hasBudgets: boolean
  dataQuality: number
}

interface AuditSuggestion {
  icon: React.ElementType
  color: string
  text: string
}

interface Props {
  filter: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'customPeriod'
  filteredTransactions: Transaction[]
  startDate: string
  endDate: string
  periodSubLabel: string
}

function getDaysInPeriod(filter: Props['filter'], startDate: string, endDate: string): number {
  const today = new Date()
  switch (filter) {
    case 'weekly': return 7
    case 'monthly': return new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    case 'quarterly': {
      const q = Math.floor(today.getMonth() / 3)
      let days = 0
      for (let m = q * 3; m < q * 3 + 3; m++) {
        days += new Date(today.getFullYear(), m + 1, 0).getDate()
      }
      return days
    }
    case 'yearly': {
      const y = today.getFullYear()
      return (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)) ? 366 : 365
    }
    case 'customPeriod': {
      const s = new Date(startDate)
      const e = new Date(endDate)
      return Math.max(1, Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    }
    default: return 30
  }
}

function InfoMetricCard({ title, value, icon: Icon, colorClass, secondaryValue, secondaryLabel, description, trend }: {
  title: string; value: string; icon: React.ElementType; colorClass: string;
  secondaryValue?: string; secondaryLabel?: string; description?: string; trend?: 'up' | 'down' | 'neutral'
}) {
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'
  const trendColor = trend === 'up' ? 'text-green-600 dark:text-green-400' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
  return (
    <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      <CardHeader className="flex flex-row items-start justify-between pb-2 gap-2">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {description && <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-relaxed">{description}</p>}
        </div>
        <div className={`p-2 rounded-full shrink-0 ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-card-foreground font-number leading-tight">{value}</div>
        {(secondaryValue || secondaryLabel) && (
          <div className="flex items-baseline gap-1.5 mt-1.5 flex-wrap">
            {secondaryValue && <span className="text-sm font-bold text-card-foreground font-number">{secondaryValue}</span>}
            {secondaryLabel && <span className="text-[10px] text-muted-foreground/70">{secondaryLabel}</span>}
            {trend && (
              <span className={`text-[10px] font-bold ${trendColor} ml-auto`}>
                {trendIcon}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AuditGauge({ score }: { score: number }) {
  const r = 54, circ = 2 * Math.PI * r
  const pct = Math.min(100, Math.max(0, score))
  const offset = circ - (pct / 100) * circ
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : score >= 40 ? '#F97316' : '#EF4444'
  return (
    <div className="relative flex items-center justify-center w-32 h-32 shrink-0">
      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="8" />
        <circle cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold font-number" style={{ color }}>{score}</span>
        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">/100</span>
      </div>
    </div>
  )
}

function BudgetComparisonChart({ data, language, t }: { data: CategoryMonthData[]; language: string; t: (k: string) => string }) {
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
        {[0, 0.25, 0.5, 0.75, 1].map((r) => {
          const y = paddingY + r * chartH
          return <line key={r} x1={paddingX} y1={y} x2={svgW - paddingX} y2={y} className="stroke-border/40" strokeDasharray="4 4" />
        })}
        {[0, 0.25, 0.5, 0.75, 1].map((r) => {
          const y = paddingY + r * chartH
          const val = maxVal - r * maxVal
          return <text key={r} x={paddingX - 10} y={val === maxVal ? y - 2 : y + 4} textAnchor="end" className="fill-muted-foreground font-semibold text-[9px]">{formatCurrency(val, language as 'id' | 'en')}</text>
        })}
        {hoveredIdx !== null && data[hoveredIdx] && (
          <line x1={paddingX + hoveredIdx * (totalGroupW + groupGap) + totalGroupW / 2} y1={paddingY} x2={paddingX + hoveredIdx * (totalGroupW + groupGap) + totalGroupW / 2} y2={paddingY + chartH} className="stroke-primary/50" strokeWidth="1.5" strokeDasharray="3 3" />
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
              <rect x={xCenter - barW - barGap / 2} y={paddingY + chartH - (d.periodBudget / maxVal) * chartH} width={barW} height={Math.max(2, (d.periodBudget / maxVal) * chartH)} fill="url(#budgetBarAvgGrad)" rx={3} opacity={barOpacity} className="transition-all duration-200" />
              <rect x={xCenter + barGap / 2} y={actualY} width={barW} height={Math.max(2, actualH)} fill={barColor.fill} rx={3} opacity={barOpacity} className="transition-all duration-200" />
              <text x={xCenter} y={svgH - 8} textAnchor="middle" className="fill-muted-foreground font-semibold text-[9px] uppercase tracking-wider">{d.category}</text>
              <rect x={xCenter - totalGroupW / 2} y={paddingY} width={totalGroupW} height={chartH} fill="transparent" className="cursor-pointer"
                onMouseEnter={(e) => { setHoveredIdx(i); const svgEl = e.currentTarget.closest('svg'); if (svgEl) { const sr = svgEl.getBoundingClientRect(); setTooltipPos({ x: e.clientX - sr.left, y: e.clientY - sr.top }) } }}
                onMouseLeave={() => setHoveredIdx(null)}
                onMouseMove={(e) => { const svgEl = e.currentTarget.closest('svg'); if (svgEl) { const sr = svgEl.getBoundingClientRect(); setTooltipPos({ x: e.clientX - sr.left, y: e.clientY - sr.top }) } }}
              />
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

function PieComparisonChart({ data, language, t }: { data: CategoryMonthData[]; language: string; t: (k: string) => string }) {
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

  const budgetRingColor = '#810B38'
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

  const usageColor = (pct: number) => {
    if (pct > 100) return '#EF4444'
    if (pct > 85) return '#F59E0B'
    return '#10B981'
  }

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
                <circle cx={cx} cy={cy} r={midR} fill="none" stroke={budgetRingColor}
                  strokeWidth={strokeW} strokeLinecap="butt"
                  strokeDasharray={`${s.segLen} ${circ - s.segLen}`}
                  strokeDashoffset={s.offset}
                  opacity={hoveredIdx === null || hoveredIdx === i ? 0.2 : 0.08}
                  className="transition-all duration-200"
                />
                <circle cx={cx} cy={cy} r={midR} fill="none" stroke={s.color}
                  strokeWidth={strokeW} strokeLinecap="butt"
                  strokeDasharray={`${s.usageLen} ${circ - s.usageLen}`}
                  strokeDashoffset={s.offset}
                  opacity={hoveredIdx === null || hoveredIdx === i ? 0.9 : 0.4}
                  className="transition-all duration-200"
                />
                {/* invisible hit area */}
                <circle cx={cx} cy={cy} r={midR} fill="none" stroke="transparent"
                  strokeWidth={strokeW + 4}
                  strokeDasharray={`${s.segLen} ${circ - s.segLen}`}
                  strokeDashoffset={s.offset}
                />
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

function VarianceDataTable({ data, language, t }: { data: CategoryMonthData[]; language: string; t: (k: string) => string }) {
  if (data.length === 0) return null
  return (
    <div className="w-full overflow-x-auto scrollbar-none">
      <table className="w-full min-w-[500px] text-xs">
        <thead>
          <tr className="border-b border-border/60">
            <th className="text-left py-3 px-3 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t('category')}</th>
            <th className="text-right py-3 px-3 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t('periodBudget')}</th>
            <th className="text-right py-3 px-3 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t('periodActual')}</th>
            <th className="text-right py-3 px-3 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t('netVariance')}</th>
            <th className="text-right py-3 px-3 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t('usage')}</th>
            <th className="text-center py-3 px-3 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t('status')}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
              <td className="py-2.5 px-3 font-bold text-foreground">{d.category}</td>
              <td className="py-2.5 px-3 text-right font-number font-semibold text-foreground">{formatCurrency(d.periodBudget, language as 'id' | 'en')}</td>
              <td className="py-2.5 px-3 text-right font-number font-semibold text-foreground">{formatCurrency(d.periodActual, language as 'id' | 'en')}</td>
              <td className={`py-2.5 px-3 text-right font-number font-bold ${d.variance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                {d.variance >= 0 ? '+' : ''}{formatCurrency(d.variance, language as 'id' | 'en')}
              </td>
              <td className="py-2.5 px-3 text-right font-number font-semibold text-foreground">{`${d.usagePercent.toFixed(1)}%`}</td>
              <td className="py-2.5 px-3 text-center">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  d.status === 'optimal' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                  d.status === 'frugal' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                  d.status === 'overbudget' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                  'bg-destructive/10 text-destructive'
                }`}>
                  {d.status === 'optimal' && <CheckCircle className="w-2.5 h-2.5" />}
                  {d.status === 'frugal' && <Target className="w-2.5 h-2.5" />}
                  {d.status === 'overbudget' && <AlertTriangle className="w-2.5 h-2.5" />}
                  {d.status === 'critical' && <AlertTriangle className="w-2.5 h-2.5" />}
                  {t(d.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function UnbudgetedCategoryTable({ data, language, t }: { data: UnbudgetedCategoryData[]; language: string; t: (k: string) => string }) {
  if (data.length === 0) return null
  return (
    <div className="w-full overflow-x-auto scrollbar-none">
      <table className="w-full min-w-[400px] text-xs">
        <thead>
          <tr className="border-b border-border/60">
            <th className="text-left py-3 px-3 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t('category')}</th>
            <th className="text-right py-3 px-3 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t('transactionFrequency')}</th>
            <th className="text-right py-3 px-3 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t('avgPerTx')}</th>
            <th className="text-right py-3 px-3 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t('amount')}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
              <td className="py-2.5 px-3 font-bold text-foreground">{d.category}</td>
              <td className="py-2.5 px-3 text-right font-number font-semibold text-foreground">{d.txCount}x</td>
              <td className="py-2.5 px-3 text-right font-number font-semibold text-foreground">{formatCurrency(d.avgPerTransaction, language as 'id' | 'en')}</td>
              <td className="py-2.5 px-3 text-right font-number font-semibold text-foreground">{formatCurrency(d.totalSpent, language as 'id' | 'en')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AuditScorecard({ audit, language, t, suggestions }: { audit: AuditResult; language: string; t: (k: string) => string; suggestions: AuditSuggestion[] }) {
  const getHealthLabel = () => {
    if (audit.score >= 80) return t('healthExcellent')
    if (audit.score >= 60) return t('healthGood')
    if (audit.score >= 40) return t('healthFair')
    if (audit.score >= 20) return t('healthPoor')
    return t('healthCritical')
  }
  const getHealthColor = () => {
    if (audit.score >= 80) return 'text-green-600 dark:text-green-400'
    if (audit.score >= 60) return 'text-amber-500 dark:text-amber-400'
    if (audit.score >= 40) return 'text-orange-500 dark:text-orange-400'
    return 'text-destructive'
  }
  const getAuditComment = () => {
    const lang = language as 'id' | 'en'
    const weakPoints: string[] = []
    if (audit.savingsRateScore < 20) weakPoints.push(lang === 'id' ? 'rasio tabungan rendah' : 'low savings rate')
    if (audit.budgetComplianceScore < 17) weakPoints.push(lang === 'id' ? 'kepatuhan anggaran perlu ditingkatkan' : 'budget compliance needs improvement')
    if (audit.volatilityScore < 12) weakPoints.push(lang === 'id' ? 'arus kas fluktuatif' : 'unstable cash flow')
    if (weakPoints.length > 0) {
      const list = weakPoints.join(lang === 'id' ? ', ' : ', ')
      if (audit.score >= 60) return lang === 'id' ? `Kondisi cukup baik tetapi ${list}. Fokus perbaiki area ini untuk skor lebih optimal.` : `Fairly good condition but ${list}. Focus on these areas for a better score.`
      if (audit.score >= 40) return lang === 'id' ? `Perlu perhatian: ${list}. Buat rencana aksi bertahap untuk setiap area.` : `Needs attention: ${list}. Create a gradual action plan for each area.`
      if (audit.score >= 20) return lang === 'id' ? `Kondisi mengkhawatirkan: ${list}. Segera evaluasi pengeluaran dan buat prioritas pemulihan keuangan.` : `Concerning: ${list}. Immediately review expenses and set financial recovery priorities.`
      return lang === 'id' ? `Kritis: ${list}. Diperlukan restrukturisasi keuangan segera.` : `Critical: ${list}. Immediate financial restructuring needed.`
    }
    if (audit.score >= 80) return lang === 'id' ? 'Kinerja keuangan sangat baik di semua aspek. Pertahankan disiplin ini dan eksplorasi peluang investasi jangka panjang.' : 'Excellent financial performance across all aspects. Maintain this discipline and explore long-term investment opportunities.'
    if (audit.score >= 60) return lang === 'id' ? 'Kondisi keuangan cukup baik dengan keseimbangan yang stabil. Tingkatkan sedikit lagi untuk capai skor optimal.' : 'Fairly good financial condition with stable balance. Improve slightly to reach optimal score.'
    return lang === 'id' ? 'Evaluasi ulang strategi keuangan secara menyeluruh. Pertimbangkan konsultasi dengan perencana keuangan.' : 'Thoroughly re-evaluate your financial strategy. Consider consulting a financial planner.'
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      <div className="flex flex-col items-center gap-1 shrink-0">
        <AuditGauge score={audit.score} />
        <span className={`text-sm font-bold ${getHealthColor()}`}>{getHealthLabel()}</span>
        {audit.dataQuality < 1 && (
          <span className="text-[8px] text-muted-foreground/60 italic mt-0.5">
            {(language as 'id' | 'en') === 'id' ? `*skor berdasarkan ${(audit.dataQuality * 100).toFixed(0)}% data periode` : `*score based on ${(audit.dataQuality * 100).toFixed(0)}% period data`}
          </span>
        )}
        {!audit.hasBudgets && (
          <span className="text-[8px] text-amber-500/70 italic">
            {(language as 'id' | 'en') === 'id' ? '*tidak ada anggaran — kepatuhan dinilai netral' : '*no budgets set — compliance scored neutral'}
          </span>
        )}
      </div>
      <div className="flex-1 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-muted/20 rounded-lg p-3 border border-border/40">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1"><TrendingUp className="w-3 h-3 text-primary" />{t('savingsRate')}</div>
            <span className="text-lg font-extrabold text-foreground font-number">{audit.savingsRate.toFixed(1)}%</span>
            <div className="mt-1.5 w-full bg-muted/40 rounded-full h-1.5"><div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, audit.savingsRate * 4))}%`, background: 'linear-gradient(90deg, #10B981, #059669)' }} /></div>
            <span className="text-[9px] text-muted-foreground mt-1 block">{audit.savingsRateScore}/40</span>
            <p className="text-[9px] text-muted-foreground/70 leading-relaxed mt-1.5 border-t border-border/30 pt-1.5">{t('savingsRateDesc')}</p>
          </div>
          <div className="bg-muted/20 rounded-lg p-3 border border-border/40">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1"><ShieldCheck className="w-3 h-3 text-blue-500" />{t('budgetCompliance')}</div>
            <span className="text-lg font-extrabold text-foreground font-number">{(audit.complianceRate * 100).toFixed(0)}%</span>
            <div className="mt-1.5 w-full bg-muted/40 rounded-full h-1.5"><div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${audit.complianceRate * 100}%`, background: 'linear-gradient(90deg, #3B82F6, #2563EB)' }} /></div>
            <span className="text-[9px] text-muted-foreground mt-1 block">{audit.budgetComplianceScore}/35</span>
            <p className="text-[9px] text-muted-foreground/70 leading-relaxed mt-1.5 border-t border-border/30 pt-1.5">{t('budgetComplianceDesc')}</p>
          </div>
          <div className="bg-muted/20 rounded-lg p-3 border border-border/40 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1"><Activity className="w-3 h-3 text-purple-500" />{t('cashFlowVolatility')}</div>
            <span className="text-lg font-extrabold text-foreground font-number">{(audit.volatility * 100).toFixed(1)}%</span>
            <div className="mt-1.5 w-full bg-muted/40 rounded-full h-1.5"><div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, (1 - audit.volatility) * 100))}%`, background: 'linear-gradient(90deg, #8B5CF6, #7C3AED)' }} /></div>
            <span className="text-[9px] text-muted-foreground mt-1 block">{audit.volatilityScore}/25</span>
            <p className="text-[9px] text-muted-foreground/70 leading-relaxed mt-1.5 border-t border-border/30 pt-1.5">{t('cashFlowVolatilityDesc')}</p>
          </div>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><ShieldCheck className="w-4 h-4 text-primary" /><h4 className="text-xs font-bold text-foreground uppercase tracking-wider">{t('auditorReviewTitle')}</h4></div>
          <p className="text-xs text-muted-foreground leading-relaxed">{getAuditComment()}</p>
        </div>
        {suggestions.length > 0 && (
          <div className="bg-card border border-border/60 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2"><Target className="w-4 h-4 text-primary" /><h4 className="text-xs font-bold text-foreground uppercase tracking-wider">{language === 'id' ? 'Rekomendasi' : 'Recommendations'}</h4></div>
            <ul className="flex flex-col gap-2">
              {suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <s.icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${s.color}`} />
                  <span className="leading-relaxed">{s.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AverageAnalysisTab({ filter, filteredTransactions, startDate, endDate, periodSubLabel: _periodSubLabel }: Props) {
  const language = useLanguageStore((s) => s.language)
  const budgets = usePlanningStore((s) => s.budgets)
  const t = (key: string) => (translations[language] as Record<string, string>)[key] || key
  const [chartStyle, setChartStyle] = React.useState<'bar' | 'pie'>('bar')
  const [isChartStyleOpen, setIsChartStyleOpen] = React.useState(false)
  const chartDropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chartDropdownRef.current && !chartDropdownRef.current.contains(event.target as Node)) {
        setIsChartStyleOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const endOfPeriod = React.useMemo(() => isEndOfPeriod(filter), [filter])

  const daysInPeriod = React.useMemo(() => getDaysInPeriod(filter, startDate, endDate), [filter, startDate, endDate])

  const computed = React.useMemo(() => {
    let totalIncome = 0, totalExpense = 0, totalTxCount = 0, totalAbsAmount = 0
    const expenseByCategory = new Map<string, number>()
    const expenseTxCountByCategory = new Map<string, number>()
    const dailyTotals = new Map<string, { income: number; expense: number }>()

    for (const tx of filteredTransactions) {
      if (tx.type === 'in') totalIncome += tx.amount
      else {
        totalExpense += tx.amount
        expenseByCategory.set(tx.category, (expenseByCategory.get(tx.category) || 0) + tx.amount)
        expenseTxCountByCategory.set(tx.category, (expenseTxCountByCategory.get(tx.category) || 0) + 1)
      }
      totalTxCount++
      totalAbsAmount += Math.abs(tx.amount)

      const day = tx.date.slice(0, 10)
      if (!dailyTotals.has(day)) dailyTotals.set(day, { income: 0, expense: 0 })
      const d = dailyTotals.get(day)!
      if (tx.type === 'in') d.income += tx.amount
      else d.expense += tx.amount
    }

    const dayCount = Math.max(1, daysInPeriod)
    const periodFactor = dayCount / 30
    const avgTxValue = totalTxCount > 0 ? totalAbsAmount / totalTxCount : 0
    const savingsRate = totalIncome > 0 ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100) : 0

    // Category data: period-proportional budget vs actual
    const allExpenseCategories = Array.from(expenseByCategory.keys())
    const budgetMap = new Map(budgets.map((b) => [b.category, b.limit]))
    const categoryData: CategoryMonthData[] = allExpenseCategories.map((cat) => {
      const periodActual = expenseByCategory.get(cat) || 0
      const budgetLimit = budgetMap.get(cat) || 0
      const periodBudget = budgetLimit * periodFactor
      const variance = periodBudget - periodActual
      const usagePercent = periodBudget > 0 ? (periodActual / periodBudget) * 100 : 0
      let status: CategoryMonthData['status'] = 'optimal'
      if (budgetLimit === 0) status = 'frugal'
      else if (usagePercent > 100) status = 'critical'
      else if (usagePercent > 85) status = 'overbudget'
      else if (usagePercent > 50) status = 'frugal'
      if (budgetLimit === 0 && periodActual === 0) status = 'optimal'
      return { category: cat, limit: budgetLimit, periodBudget, periodActual, variance, usagePercent, status }
    }).sort((a, b) => b.periodActual - a.periodActual)

    // Financial Health Score
    const benchmarkRate = 25
    const savingsRateScore = Math.min(40, Math.max(0, (savingsRate / benchmarkRate) * 40))

    const budgetedCategoriesOnly = categoryData.filter((cd) => cd.limit > 0)
    const hasBudgets = budgetedCategoriesOnly.length > 0
    const compliantCategories = budgetedCategoriesOnly.filter((c) => c.status !== 'critical' && c.status !== 'overbudget').length
    const complianceRate = hasBudgets ? compliantCategories / budgetedCategoriesOnly.length : 0.5
    const budgetComplianceScore = hasBudgets ? complianceRate * 35 : 17.5

    // Volatility based on Mean Absolute Difference across ALL calendar days
    const pStart = (() => {
      const d = new Date()
      switch (filter) {
        case 'weekly': { const day = d.getDay(); const s = new Date(d); s.setDate(d.getDate() - day + (day === 0 ? -6 : 1)); s.setHours(0, 0, 0, 0); return s }
        case 'monthly': return new Date(d.getFullYear(), d.getMonth(), 1)
        case 'quarterly': return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1)
        case 'yearly': return new Date(d.getFullYear(), 0, 1)
        case 'customPeriod': return new Date(startDate)
        default: return new Date(d.getFullYear(), d.getMonth(), 1)
      }
    })()
    const pEnd = filter === 'customPeriod' ? new Date(endDate) : new Date()
    const fullDailyExpense: number[] = []
    const padN = (n: number) => String(n).padStart(2, '0')
    const cursor = new Date(pStart)
    cursor.setHours(0, 0, 0, 0)
    const end = new Date(pEnd)
    end.setHours(23, 59, 59, 999)
    while (cursor <= end) {
      const key = `${cursor.getFullYear()}-${padN(cursor.getMonth() + 1)}-${padN(cursor.getDate())}`
      fullDailyExpense.push(dailyTotals.get(key)?.expense || 0)
      cursor.setDate(cursor.getDate() + 1)
    }
    let totalDiff = 0
    for (let i = 1; i < fullDailyExpense.length; i++) {
      totalDiff += Math.abs(fullDailyExpense[i] - fullDailyExpense[i - 1])
    }
    const mad = fullDailyExpense.length > 1 ? totalDiff / (fullDailyExpense.length - 1) : 0
    const meanExp = fullDailyExpense.reduce((a, b) => a + b, 0) / Math.max(1, fullDailyExpense.length)
    const cv = meanExp > 0 ? mad / (mad + meanExp) : 0
    const volatilityScore = Math.min(25, Math.max(0, (1 - Math.min(1, cv)) * 25))

    const unbudgetedCategories: UnbudgetedCategoryData[] = categoryData
      .filter((cd) => cd.limit === 0)
      .map((cd) => {
        const totalCatExpense = expenseByCategory.get(cd.category) || 0
        const txCount = expenseTxCountByCategory.get(cd.category) || 0
        return {
          category: cd.category,
          txCount,
          avgPerTransaction: txCount > 0 ? totalCatExpense / txCount : 0,
          totalSpent: totalCatExpense,
        }
      })

    const budgetedCategories = categoryData.filter((cd) => cd.limit > 0)

    const totalScore = Math.min(100, Math.round(savingsRateScore + budgetComplianceScore + volatilityScore))

    const dailyAvgIncome = dayCount > 0 ? totalIncome / dayCount : 0
    const dailyAvgExpense = dayCount > 0 ? totalExpense / dayCount : 0
    const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0

    return {
      avgTxValue,
      savingsRate,
      totalTxCount,
      dayCount,
      totalIncome,
      totalExpense,
      dailyAvgIncome,
      dailyAvgExpense,
      expenseRatio,
      categoryData: budgetedCategories,
      unbudgetedCategories,
      auditResult: {
        score: totalScore,
        savingsRateScore: Math.round(savingsRateScore),
        budgetComplianceScore: Math.round(budgetComplianceScore),
        volatilityScore: Math.round(volatilityScore),
        savingsRate,
        complianceRate,
        volatility: cv,
        hasBudgets,
        dataQuality: Math.min(1, dayCount / 7),
      } as AuditResult,
    }
  }, [filteredTransactions, budgets, daysInPeriod, filter, startDate, endDate])

  const suggestions = React.useMemo((): AuditSuggestion[] => {
    const result: AuditSuggestion[] = []
    const lang = language as 'id' | 'en'
    const isId = lang === 'id'
    const a = computed.auditResult

    // 1. Urgent: Negatif cash flow (debt warning)
    if (computed.totalExpense > computed.totalIncome && computed.totalIncome > 0) {
      const deficit = computed.totalExpense - computed.totalIncome
      const dailyDeficit = deficit / Math.max(1, computed.dayCount)
      result.push({
        icon: AlertTriangle, color: 'text-destructive',
        text: isId
          ? `Defisit ${formatCurrency(deficit, lang)} (${formatCurrency(dailyDeficit, lang)}/hari). Pengeluaran melebihi pemasukan — risiko utang. Segera tekan pengeluaran tidak perlu.`
          : `Deficit ${formatCurrency(deficit, lang)} (${formatCurrency(dailyDeficit, lang)}/day). Spending exceeds income — debt risk. Cut unnecessary expenses immediately.`
      })
    }

    // 2. Budget critical: kategori overspent > 100%
    const criticalOver = computed.categoryData.filter((c) => c.status === 'critical')
    if (criticalOver.length > 0) {
      const worst = criticalOver.sort((a, b) => a.variance - b.variance)[0]
      result.push({
        icon: Target, color: 'text-destructive',
        text: isId
          ? `"${worst.category}" melebihi anggaran ${worst.usagePercent.toFixed(0)}% (${formatCurrency(Math.abs(worst.variance), lang)}). Evaluasi ulang alokasi anggaran kategori ini.`
          : `"${worst.category}" exceeds budget by ${worst.usagePercent.toFixed(0)}% (${formatCurrency(Math.abs(worst.variance), lang)}). Re-evaluate this category budget.`
      })
    }

    // 3. Savings opportunity from income-expense gap
    if (computed.savingsRate > 0 && computed.savingsRate < 25) {
      const gapTarget = 25 - computed.savingsRate
      const dailyIncome = computed.totalIncome / Math.max(1, computed.dayCount)
      const extraSavePerDay = dailyIncome * (gapTarget / 100)
      const monthlyExtra = extraSavePerDay * 30
      const yearlyExtra = extraSavePerDay * 365
      result.push({
        icon: PiggyBank, color: 'text-green-500',
        text: isId
          ? `Rasio tabungan ${computed.savingsRate.toFixed(1)}% (target ideal ≥25%). Tambah ${formatCurrency(extraSavePerDay, lang)}/hari → ~${formatCurrency(monthlyExtra, lang)}/bulan → ~${formatCurrency(yearlyExtra, lang)}/tahun.`
          : `Savings rate ${computed.savingsRate.toFixed(1)}% (ideal target ≥25%). Save ${formatCurrency(extraSavePerDay, lang)}/day → ~${formatCurrency(monthlyExtra, lang)}/month → ~${formatCurrency(yearlyExtra, lang)}/year.`
      })
    } else if (computed.savingsRate >= 25) {
      result.push({
        icon: CheckCircle, color: 'text-green-500',
        text: isId
          ? `Rasio tabungan ${computed.savingsRate.toFixed(1)}% — sangat baik! Pertahankan konsistensi ini dan pertimbangkan investasi jangka panjang.`
          : `Savings rate ${computed.savingsRate.toFixed(1)}% — excellent! Maintain consistency and consider long-term investments.`
      })
    }

    // 4. Under-budget categories (surplus)
    const underBudget = computed.categoryData.filter((c) => c.variance > 0 && c.usagePercent < 50)
    if (underBudget.length > 0 && result.length < 3) {
      const best = underBudget.sort((a, b) => b.variance - a.variance)[0]
      result.push({
        icon: CheckCircle, color: 'text-green-500',
        text: isId
          ? `"${best.category}" hemat ${formatCurrency(best.variance, lang)} (${best.usagePercent.toFixed(0)}% terpakai). Alokasikan surplus ke dana darurat atau investasi.`
          : `"${best.category}" saved ${formatCurrency(best.variance, lang)} (${best.usagePercent.toFixed(0)}% used). Allocate surplus to emergency fund or investments.`
      })
    }

    // 5. Volatility insight
    if (result.length < 3) {
      if (a.volatility > 0.5) {
        result.push({
          icon: Activity, color: 'text-purple-500',
          text: isId
            ? `Pengeluaran harian sangat fluktuatif (${(a.volatility * 100).toFixed(0)}%). Buat jadwal belanja rutin untuk menstabilkan arus kas.`
            : `Daily expenses are highly volatile (${(a.volatility * 100).toFixed(0)}%). Create a regular spending schedule to stabilize cash flow.`
        })
      } else if (a.volatility < 0.2 && computed.totalExpense > 0) {
        result.push({
          icon: Activity, color: 'text-green-500',
          text: isId
            ? `Pengeluaran harian stabil (${(a.volatility * 100).toFixed(0)}%). Pola konsisten — tanda manajemen keuangan yang disiplin!`
            : `Daily expenses are stable (${(a.volatility * 100).toFixed(0)}%). Consistent pattern — a sign of disciplined financial management!`
        })
      }
    }

    // 6. No budgets set
    if (!a.hasBudgets && computed.totalExpense > 0 && result.length < 3) {
      result.push({
        icon: BarChart3, color: 'text-blue-500',
        text: isId
          ? `Anda belum memiliki anggaran kategori. Tetapkan batas anggaran di menu Perencanaan untuk kontrol pengeluaran lebih baik.`
          : `You haven't set any category budgets. Set budget limits in the Planning menu for better spending control.`
      })
    }

    return result.slice(0, 3)
  }, [computed, language])

  React.useEffect(() => {
    if (!endOfPeriod || suggestions.length === 0 || typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    const lastSent = localStorage.getItem('cashhero-audit-notification-sent')
    const today = new Date().toISOString().slice(0, 10)
    if (lastSent === today) return
    const lang = language as 'id' | 'en'
    const title = lang === 'id' ? 'Laporan Audit Periode' : 'Period Audit Report'
    const topSuggestion = suggestions[0]
    const body = lang === 'id'
      ? `Skor keuangan Anda: ${computed.auditResult.score}/100. ${topSuggestion ? topSuggestion.text.replace(/<[^>]*>/g, '') : 'Lihat rincian di halaman statistik.'}`
      : `Your financial score: ${computed.auditResult.score}/100. ${topSuggestion ? topSuggestion.text.replace(/<[^>]*>/g, '') : 'View details on the statistics page.'}`
    navigator.serviceWorker.ready.then((registration) => {
      registration.active?.postMessage({
        type: 'SHOW_LOCAL_NOTIFICATION',
        payload: { title, options: { body, tag: 'cashhero-audit-report' } }
      })
    })
    localStorage.setItem('cashhero-audit-notification-sent', today)
    saveAuditData({
      score: computed.auditResult.score,
      topSuggestion: topSuggestion.text.replace(/<[^>]*>/g, ''),
      language: lang,
      filter
    })
  }, [endOfPeriod, suggestions, computed.auditResult.score, language, filter])

  if (computed.totalTxCount === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-4">
        <BarChart3 className="w-12 h-12 opacity-20" />
        <p className="text-sm font-medium">{t('emptyStats')}</p>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-8">
      {/* Premium Metric Cards — enriched with context */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoMetricCard
          title={t('averageMonthlyIncome')}
          value={formatCurrency(computed.totalIncome, language as 'id' | 'en')}
          icon={TrendingUp}
          colorClass="bg-green-500/10 text-green-600 dark:text-green-400"
          secondaryValue={formatCurrency(computed.dailyAvgIncome, language as 'id' | 'en')}
          secondaryLabel={language === 'id' ? '/hari rata-rata' : '/day avg'}
          description={language === 'id'
            ? 'Total pemasukan dari semua transaksi masuk periode ini'
            : 'Total income from all incoming transactions this period'}
          trend={computed.totalIncome > 0 ? 'up' : 'neutral'}
        />
        <InfoMetricCard
          title={t('averageMonthlyExpense')}
          value={formatCurrency(computed.totalExpense, language as 'id' | 'en')}
          icon={Wallet}
          colorClass="bg-destructive/10 text-destructive"
          secondaryValue={formatCurrency(computed.dailyAvgExpense, language as 'id' | 'en')}
          secondaryLabel={language === 'id'
            ? `/hari · ${computed.expenseRatio.toFixed(0)}% dr pemasukan`
            : `/day · ${computed.expenseRatio.toFixed(0)}% of income`}
          description={language === 'id'
            ? 'Total pengeluaran dari semua transaksi keluar periode ini'
            : 'Total expenses from all outgoing transactions this period'}
          trend={computed.expenseRatio > 80 ? 'down' : computed.expenseRatio > 50 ? 'neutral' : 'up'}
        />
        <InfoMetricCard
          title={t('averageTransactionValue')}
          value={formatCurrency(computed.avgTxValue, language as 'id' | 'en')}
          icon={DollarSign}
          colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          secondaryValue={`${computed.totalTxCount}×`}
          secondaryLabel={language === 'id' ? 'total transaksi dicatat' : 'total transactions recorded'}
          description={language === 'id'
            ? 'Rata-rata nominal per transaksi (pemasukan & pengeluaran)'
            : 'Average amount per transaction (income & expenses)'}
        />
        <InfoMetricCard
          title={t('avgMonthlySavings')}
          value={`${(computed.totalIncome - computed.totalExpense) >= 0 ? '+' : ''}${formatCurrency(computed.totalIncome - computed.totalExpense, language as 'id' | 'en')}`}
          icon={PiggyBank}
          colorClass="bg-purple-500/10 text-purple-600 dark:text-purple-400"
          secondaryValue={`${computed.savingsRate.toFixed(1)}%`}
          secondaryLabel={language === 'id' ? 'rasio tabungan' : 'savings rate'}
          description={language === 'id'
            ? 'Sisa pemasukan setelah dikurangi pengeluaran periode ini'
            : 'Remaining income after deducting expenses this period'}
          trend={computed.savingsRate >= 25 ? 'up' : computed.savingsRate > 0 ? 'neutral' : 'down'}
        />
      </div>

      {/* Budget vs Actual Comparison Chart */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-foreground text-lg font-bold flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" />{t('categoryComparison')}</CardTitle>
            <div className="relative no-print" ref={chartDropdownRef}>
              <button onClick={() => setIsChartStyleOpen(!isChartStyleOpen)}
                className="px-3.5 py-2 bg-muted/40 hover:bg-muted/70 text-foreground border border-border/80 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-sm hover:shadow active:scale-95"
              >
                {chartStyle === 'bar' ? <BarChart3 className="w-4 h-4 text-primary" /> : <PieChart className="w-4 h-4 text-primary" />}
                <span>{chartStyle === 'bar' ? t('chartBar') : t('chartPie')}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isChartStyleOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isChartStyleOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-[175px] bg-background/95 border border-border rounded-xl shadow-xl backdrop-blur-md z-50 p-1 flex flex-col gap-0.5"
                  >
                    {(['bar', 'pie'] as const).map((m) => {
                      const isActive = chartStyle === m
                      const Icon = m === 'bar' ? BarChart3 : PieChart
                      return (
                        <button key={m} onClick={() => { setChartStyle(m); setIsChartStyleOpen(false) }}
                          className={`w-full px-3 py-2 rounded-lg text-left text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-2 ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'}`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{m === 'bar' ? t('chartBar') : t('chartPie')}</span>
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {computed.categoryData.length > 0 ? (
            chartStyle === 'bar'
              ? <BudgetComparisonChart data={computed.categoryData} language={language} t={t} />
              : <PieComparisonChart data={computed.categoryData} language={language} t={t} />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
              <BarChart3 className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">{t('noBudgetData')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Variance Data Table */}
      {computed.categoryData.length > 0 && (
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground text-lg font-bold flex items-center gap-2"><Target className="w-5 h-5 text-primary" />{t('budgetDetail')}</CardTitle>
          </CardHeader>
          <CardContent>
            <VarianceDataTable data={computed.categoryData} language={language} t={t} />
          </CardContent>
        </Card>
      )}

      {/* Unbudgeted Categories Table */}
      {computed.unbudgetedCategories.length > 0 && (
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground text-lg font-bold flex items-center gap-2"><Wallet className="w-5 h-5 text-primary" />{t('unbudgetedCategories')}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{t('noBudgetData')}</p>
          </CardHeader>
          <CardContent>
            <UnbudgetedCategoryTable data={computed.unbudgetedCategories} language={language} t={t} />
          </CardContent>
        </Card>
      )}

      {/* Financial Health Audit Scorecard */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground text-lg font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />{t('auditorScoreCard')}
            {endOfPeriod && <span className="text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">{language === 'id' ? 'Akhir Periode' : 'Period End'}</span>}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">{t('auditScoreDesc')}</p>
        </CardHeader>
        <CardContent>
          <AuditScorecard audit={computed.auditResult} language={language} t={t} suggestions={endOfPeriod ? suggestions : []} />
        </CardContent>
      </Card>
    </motion.div>
  )
}
