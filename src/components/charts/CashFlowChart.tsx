"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BarChart3, Calendar, TrendingUp,
  LineChart, AreaChart,
} from "lucide-react"
import { formatCurrency } from "@/lib/format"
import {
  GRID_LINES,
  type CashFlowDataPoint,
  type ChartDimensions,
  type NetFlowData,
} from "@/lib/statistics"
import { useCashFlowChart, useChartInteraction } from "@/hooks/useChartMath"

interface Props {
  displayCashFlow: CashFlowDataPoint[]
  chartMode: 'line' | 'bar' | 'stacked' | 'netFlow'
  activeLineIndex: number | null
  setActiveLineIndex: (v: number | null) => void
  language: string
  filter: string
  handleQuarterlyClick?: (index: number) => void
  svgRef?: React.RefObject<SVGSVGElement | null>
  labels?: { income: string; expense: string }
}

export const CHART_MODE_ICONS = {
  line: LineChart,
  bar: BarChart3,
  stacked: AreaChart,
  netFlow: TrendingUp,
} as const

export function CashFlowChart({
  displayCashFlow,
  chartMode,
  activeLineIndex,
  setActiveLineIndex,
  language,
  filter,
  handleQuarterlyClick,
  svgRef,
  labels,
}: Props) {
  const { dims, maxVal, netFlowData, incomePoints, expensePoints, incomePath, expensePath, incomeArea, expenseArea } =
    useCashFlowChart(displayCashFlow, chartMode)
  const { tooltipTransform, tooltipStyle } = useChartInteraction(
    activeLineIndex, displayCashFlow, incomePoints, expensePoints,
    chartMode, maxVal, dims.chartHeight, dims.paddingY, netFlowData, dims.svgWidth, dims.svgHeight
  )

  if (displayCashFlow.length === 0) {
    return (
      <div className="h-[260px] w-full rounded-md border border-dashed border-border/60 bg-muted/5 flex flex-col items-center justify-center gap-3.5 p-6 text-center">
        <div className="p-3 bg-primary/10 rounded-full">
          <BarChart3 className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <div>
          <p className="text-foreground font-bold text-sm">
            {language === 'id' ? 'Arus Kas Kosong' : 'No Cash Flow Data'}
          </p>
          <p className="text-xs text-muted-foreground max-w-xs mt-1.5 leading-relaxed">
            {language === 'id'
              ? "Belum ada riwayat arus kas. Catat transaksi baru di Dashboard untuk mulai menganalisis tren."
              : "No cash flow records. Record new transactions on the Dashboard to start analyzing trends."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full relative overflow-visible">
      <svg viewBox={`0 0 ${dims.svgWidth} ${dims.svgHeight}`} className="w-full h-auto overflow-visible" ref={svgRef}>
        {renderDefs()}
        {renderGridLines(dims)}
        {chartMode === 'line' && renderLineMode(incomeArea, expenseArea, incomePath, expensePath)}
        {chartMode === 'bar' && renderBarMode(displayCashFlow, maxVal, dims, activeLineIndex)}
        {chartMode === 'stacked' && renderStackedMode(displayCashFlow, maxVal, dims, activeLineIndex)}
        {chartMode === 'netFlow' && renderNetFlowMode(displayCashFlow, dims, netFlowData, activeLineIndex)}
        {renderHoverLine(activeLineIndex, incomePoints, dims)}
        {chartMode === 'line' && renderDots(displayCashFlow, incomePoints, expensePoints, activeLineIndex)}
        {renderXLabels(displayCashFlow, incomePoints, dims, language, filter)}
        {renderHitZones(displayCashFlow, dims, activeLineIndex, setActiveLineIndex, filter, handleQuarterlyClick)}
      </svg>

      <AnimatePresence>
        {activeLineIndex !== null && activeLineIndex < displayCashFlow.length && incomePoints[activeLineIndex] && (
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
              <span>{language === 'id' ? displayCashFlow[activeLineIndex].date : displayCashFlow[activeLineIndex].dateEn}</span>
            </div>
            <div className="flex flex-col gap-1 font-semibold text-[11px] mt-0.5">
              <div className="flex items-center justify-between gap-6 text-green-600 dark:text-green-400">
                <span>{labels?.income || (language === 'id' ? 'Pemasukan:' : 'Income:')}</span>
                <span>{formatCurrency(displayCashFlow[activeLineIndex].income, language as 'id' | 'en')}</span>
              </div>
              <div className="flex items-center justify-between gap-6 text-primary">
                <span>{labels?.expense || (language === 'id' ? 'Pengeluaran:' : 'Expense:')}</span>
                <span>{formatCurrency(displayCashFlow[activeLineIndex].expense, language as 'id' | 'en')}</span>
              </div>
              <div className={`flex items-center justify-between gap-6 border-t border-border/40 pt-1 mt-1 font-bold ${(displayCashFlow[activeLineIndex].income - displayCashFlow[activeLineIndex].expense) >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`}>
                <span>{language === 'id' ? 'Selisih:' : 'Net:'}</span>
                <span>
                  {((displayCashFlow[activeLineIndex].income - displayCashFlow[activeLineIndex].expense) >= 0 ? "+" : "") +
                    formatCurrency(displayCashFlow[activeLineIndex].income - displayCashFlow[activeLineIndex].expense, language as 'id' | 'en')}
                </span>
              </div>
              {filter === 'quarterly' && (
                <div className="text-[9px] text-primary/80 dark:text-rose-400 font-bold border-t border-border/40 dark:border-zinc-700/60 pt-1 mt-1 flex items-center gap-1 animate-pulse">
                  <TrendingUp className="w-2.5 h-2.5 text-primary dark:text-rose-400" />
                  <span>{language === 'id' ? 'Klik untuk rincian harian' : 'Click for daily details'}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function renderDefs() {
  return (
    <defs>
      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
      </linearGradient>
      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#810B38" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#810B38" stopOpacity="0.0" />
      </linearGradient>
    </defs>
  )
}

function renderGridLines(dims: ChartDimensions) {
  return GRID_LINES.map((r, idx) => {
    const y = dims.paddingY + r * dims.chartHeight
    return (
      <line
        key={idx}
        x1={dims.paddingX} y1={y}
        x2={dims.svgWidth - dims.paddingX} y2={y}
        className="stroke-border/40" strokeDasharray="4 4"
      />
    )
  })
}

function renderLineMode(incomeArea: string, expenseArea: string, incomePath: string, expensePath: string) {
  return (
    <>
      <path d={incomeArea} fill="url(#incomeGrad)" className="transition-all duration-300" />
      <path d={expenseArea} fill="url(#expenseGrad)" className="transition-all duration-300" />
      <path d={incomePath} fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" className="transition-all duration-300" />
      <path d={expensePath} fill="none" stroke="#810B38" strokeWidth="3" strokeLinecap="round" className="transition-all duration-300" />
    </>
  )
}

function renderBarMode(data: CashFlowDataPoint[], maxVal: number, dims: ChartDimensions, activeIdx: number | null) {
  return (
    <g className="transition-all duration-300">
      {data.map((d, i) => {
        const xCenter = dims.paddingX + (i / Math.max(1, data.length - 1)) * dims.chartWidth
        const barWidth = Math.max(4, Math.min(14, dims.chartWidth / (data.length * 3.5)))
        const gap = 1.5
        const incH = (d.income / maxVal) * dims.chartHeight
        const incY = dims.paddingY + dims.chartHeight - incH
        const expH = (d.expense / maxVal) * dims.chartHeight
        const expY = dims.paddingY + dims.chartHeight - expH
        const isActive = activeIdx === i
        return (
          <g key={i} className="transition-all duration-200">
            <rect x={xCenter - barWidth - gap} y={incY} width={barWidth} height={Math.max(1, incH)}
              fill="#10B981" rx="2" opacity={isActive ? 1 : activeIdx !== null ? 0.45 : 0.85} />
            <rect x={xCenter + gap} y={expY} width={barWidth} height={Math.max(1, expH)}
              fill="#810B38" rx="2" opacity={isActive ? 1 : activeIdx !== null ? 0.45 : 0.85} />
          </g>
        )
      })}
    </g>
  )
}

function renderStackedMode(data: CashFlowDataPoint[], maxVal: number, dims: ChartDimensions, activeIdx: number | null) {
  return (
    <g className="transition-all duration-300">
      {data.map((d, i) => {
        const xCenter = dims.paddingX + (i / Math.max(1, data.length - 1)) * dims.chartWidth
        const barWidth = Math.max(6, Math.min(20, dims.chartWidth / (data.length * 2.2)))
        const incH = (d.income / maxVal) * dims.chartHeight
        const incY = dims.paddingY + dims.chartHeight - incH
        const expH = (d.expense / maxVal) * dims.chartHeight
        const expY = incY - expH
        const isActive = activeIdx === i
        return (
          <g key={i} className="transition-all duration-200">
            <rect x={xCenter - barWidth / 2} y={incY} width={barWidth} height={Math.max(1, incH)}
              fill="#10B981" rx={d.expense === 0 ? "3" : "0"}
              opacity={isActive ? 1 : activeIdx !== null ? 0.45 : 0.85} />
            <rect x={xCenter - barWidth / 2} y={expY} width={barWidth} height={Math.max(1, expH)}
              fill="#810B38" rx={d.income === 0 ? "3" : "0"}
              opacity={isActive ? 1 : activeIdx !== null ? 0.45 : 0.85} />
          </g>
        )
      })}
    </g>
  )
}

function renderNetFlowMode(data: CashFlowDataPoint[], dims: ChartDimensions, netFlowData: NetFlowData, activeIdx: number | null) {
  return (
    <g className="transition-all duration-300">
      <line x1={dims.paddingX} y1={netFlowData.yZero} x2={dims.svgWidth - dims.paddingX} y2={netFlowData.yZero}
        stroke="#64748B" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" />
      <text x={dims.paddingX - 10} y={netFlowData.yZero + 4} textAnchor="end"
        className="fill-muted-foreground font-bold text-[9px]">0</text>
      {data.map((d, i) => {
        const xCenter = dims.paddingX + (i / Math.max(1, data.length - 1)) * dims.chartWidth
        const barWidth = Math.max(6, Math.min(22, dims.chartWidth / (data.length * 2)))
        const netVal = d.income - d.expense
        const yVal = netFlowData.yZero - (netVal / netFlowData.scaleMax) * (dims.chartHeight / 2)
        const isPositive = netVal >= 0
        const yPos = isPositive ? yVal : netFlowData.yZero
        const barH = Math.max(2, Math.abs(netFlowData.yZero - yVal))
        const isActive = activeIdx === i
        return (
          <g key={i} className="transition-all duration-200">
            <rect x={xCenter - barWidth / 2} y={yPos} width={barWidth} height={barH}
              fill={isPositive ? "#10B981" : "#810B38"} rx="3"
              opacity={isActive ? 1 : activeIdx !== null ? 0.45 : 0.85} />
          </g>
        )
      })}
    </g>
  )
}

function renderHoverLine(activeIdx: number | null, points: { x: number; y: number }[], dims: ChartDimensions) {
  if (activeIdx === null || activeIdx >= points.length) return null
  return (
    <line x1={points[activeIdx].x} y1={dims.paddingY} x2={points[activeIdx].x} y2={dims.paddingY + dims.chartHeight}
      className="stroke-primary/50" strokeWidth="1.5" strokeDasharray="3 3" />
  )
}

function renderDots(data: CashFlowDataPoint[], incomePts: { x: number; y: number }[], expensePts: { x: number; y: number }[], activeIdx: number | null) {
  return data.map((d, i) => {
    const incP = incomePts[i]
    const expP = expensePts[i]
    if (!incP || !expP) return null
    const isActive = activeIdx === i
    return (
      <g key={i} className="cursor-pointer">
        <circle cx={incP.x} cy={incP.y} r={isActive ? 7 : 4} fill="#10B981"
          className="transition-all duration-200" stroke="#FFF" strokeWidth={isActive ? 2 : 1} />
        <circle cx={expP.x} cy={expP.y} r={isActive ? 7 : 4} fill="#810B38"
          className="transition-all duration-200" stroke="#FFF" strokeWidth={isActive ? 2 : 1} />
      </g>
    )
  })
}

function renderXLabels(data: CashFlowDataPoint[], points: { x: number; y: number }[], dims: ChartDimensions, language: string, filter: string) {
  return data.map((d, i) => {
    const p = points[i]
    if (!p) return null
    if (filter === 'monthly' && (i + 1) % 5 !== 0 && i !== 0 && i !== data.length - 1) return null
    const label = language === 'id' ? d.date : d.dateEn
    return (
      <text key={i} x={p.x} y={dims.svgHeight - 10} textAnchor="middle"
        className="fill-muted-foreground font-semibold text-[10px] uppercase tracking-wider">
        {label}
      </text>
    )
  })
}

function renderHitZones(
  data: CashFlowDataPoint[], dims: ChartDimensions,
  activeIdx: number | null,
  setActiveIdx: (v: number | null) => void,
  filter: string,
  handleQuarterlyClick?: (index: number) => void
) {
  return data.map((d, i) => {
    const width = dims.chartWidth / Math.max(1, data.length - 1)
    const x = dims.paddingX + i * width - width / 2
    return (
      <rect
        key={i}
        x={x} y={dims.paddingY} width={width} height={dims.chartHeight}
        fill="transparent" className="cursor-pointer"
        onMouseEnter={() => setActiveIdx(i)}
        onMouseLeave={() => setActiveIdx(null)}
        onClick={(e) => {
          e.stopPropagation()
          if (filter === 'quarterly' && handleQuarterlyClick) {
            handleQuarterlyClick(i)
            return
          }
          setActiveIdx(i === activeIdx ? null : i)
        }}
      />
    )
  })
}
