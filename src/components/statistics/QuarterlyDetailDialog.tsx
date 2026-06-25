"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, BarChart3, ArrowDown, ArrowUp, FileSpreadsheet, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency, formatRelativeDate, getTranslation } from "@/lib/format"
import { exportToExcel, exportToPDF } from "@/lib/export"
import { CHART_DIMENSIONS, GRID_LINES } from "@/lib/statistics"
import type { Language } from "@/store/useLanguageStore"
import type { Transaction } from "@/store/useTransactionStore"

interface MonthDetail {
  monthIndex: number
  monthNameId: string
  monthNameEn: string
}

interface MonthDetailData {
  monthIn: number
  monthOut: number
  monthNet: number
  monthDailyFlow: { date: string; dateEn: string; income: number; expense: number }[]
  monthTransactions: Transaction[]
}

interface Props {
  selectedMonthDetail: MonthDetail | null
  onClose: () => void
  monthDetail: MonthDetailData | null
  language: Language
  modalActiveIdx: number | null
  setModalActiveIdx: (idx: number | null) => void
  modalChartRef: React.RefObject<HTMLDivElement | null>
  modalChart: {
    modalIncPath: string
    modalExpPath: string
    modalIncArea: string
    modalExpArea: string
    modalIncPts: { x: number; y: number }[]
    modalExpPts: { x: number; y: number }[]
    modalTooltipTransform: { x: number | string; y: number | string }
    modalTooltipStyle: React.CSSProperties
  }
}

export default function QuarterlyDetailDialog({
  selectedMonthDetail, onClose, monthDetail, language,
  modalActiveIdx, setModalActiveIdx, modalChartRef, modalChart,
}: Props) {
  const t = (key: string) => getTranslation(language, key)

  if (!selectedMonthDetail || !monthDetail) return null

  return (
    <Dialog open={selectedMonthDetail !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto scrollbar-none bg-background/95 border-border text-foreground backdrop-blur-xl p-6 shadow-2xl rounded-xl">
        <DialogHeader className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-3">
            <div>
              <DialogTitle className="text-foreground text-xl font-bold flex items-center gap-2 tracking-tight">
                <Calendar className="w-5 h-5 text-primary dark:text-rose-400" />
                <span>{language === 'id' ? `Detail Arus Kas - ${selectedMonthDetail.monthNameId}` : `Cash Flow Details - ${selectedMonthDetail.monthNameEn}`}</span>
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs mt-1">
                {language === 'id' ? `Laporan lengkap arus harian dan daftar transaksi pada bulan ${selectedMonthDetail.monthNameId}.` : `Comprehensive daily flow report and transactions for ${selectedMonthDetail.monthNameEn}.`}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => { exportToExcel(monthDetail.monthTransactions, language === 'id' ? selectedMonthDetail.monthNameId : selectedMonthDetail.monthNameEn, { income: monthDetail.monthIn, expense: monthDetail.monthOut, balance: monthDetail.monthNet }, language) }}
                className="p-2 bg-muted/40 hover:bg-muted/70 text-foreground border border-border rounded-lg transition-all cursor-pointer"
                title={language === 'id' ? 'Ekspor Excel Bulan Ini' : 'Export Excel This Month'}>
                <FileSpreadsheet className="w-4 h-4 text-green-600 dark:text-green-400" />
              </button>
              <button onClick={() => { exportToPDF(monthDetail.monthTransactions, language === 'id' ? selectedMonthDetail.monthNameId : selectedMonthDetail.monthNameEn, { income: monthDetail.monthIn, expense: monthDetail.monthOut, balance: monthDetail.monthNet }, language) }}
                className="p-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all cursor-pointer"
                title={language === 'id' ? 'Cetak PDF Laporan' : 'Print PDF Report'}>
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 bg-muted/20 border border-border/60 p-3 rounded-xl text-xs mb-4">
          <div>
            <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider mb-0.5">{t('income')}</span>
            <span className="font-bold text-green-600 dark:text-green-400 text-sm">{formatCurrency(monthDetail.monthIn, language)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider mb-0.5">{t('expense')}</span>
            <span className="font-bold text-primary text-sm">{formatCurrency(monthDetail.monthOut, language)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider mb-0.5">{language === 'id' ? 'Saldo Bersih' : 'Net Flow'}</span>
            <span className={`font-extrabold text-sm ${monthDetail.monthNet >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {monthDetail.monthNet >= 0 ? "+" : ""}{formatCurrency(monthDetail.monthNet, language)}
            </span>
          </div>
        </div>

        <div ref={modalChartRef} className="relative w-full border border-border/65 bg-muted/5 rounded-xl p-3 mb-6">
          <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
            <BarChart3 className="w-3.5 h-3.5 text-primary" />
            {language === 'id' ? 'Grafik Harian Bulan Ini' : 'Daily Trend Chart This Month'}
          </h4>
          {monthDetail.monthDailyFlow.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">{language === 'id' ? 'Tidak ada transaksi harian.' : 'No daily transactions recorded.'}</div>
          ) : (
            <div className="w-full relative overflow-visible select-none">
              <svg viewBox={`0 0 ${CHART_DIMENSIONS.svgWidth} ${CHART_DIMENSIONS.svgHeight}`} className="w-full h-auto overflow-visible">
                <defs>
                  <linearGradient id="modalIncGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="modalExpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#810B38" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#810B38" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {GRID_LINES.map((r, idx) => (
                  <line key={idx} x1={CHART_DIMENSIONS.paddingX} y1={CHART_DIMENSIONS.paddingY + r * CHART_DIMENSIONS.chartHeight}
                    x2={CHART_DIMENSIONS.svgWidth - CHART_DIMENSIONS.paddingX} y2={CHART_DIMENSIONS.paddingY + r * CHART_DIMENSIONS.chartHeight}
                    className="stroke-border/40" strokeDasharray="3 3" />
                ))}
                <path d={modalChart.modalIncArea} fill="url(#modalIncGrad)" />
                <path d={modalChart.modalExpArea} fill="url(#modalExpGrad)" />
                <path d={modalChart.modalIncPath} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
                <path d={modalChart.modalExpPath} fill="none" stroke="#810B38" strokeWidth="2.5" strokeLinecap="round" />
                {modalActiveIdx !== null && modalChart.modalIncPts[modalActiveIdx] && (
                  <line x1={modalChart.modalIncPts[modalActiveIdx].x} y1={CHART_DIMENSIONS.paddingY}
                    x2={modalChart.modalIncPts[modalActiveIdx].x} y2={CHART_DIMENSIONS.paddingY + CHART_DIMENSIONS.chartHeight}
                    className="stroke-primary/40" strokeWidth="1" strokeDasharray="2 2" />
                )}
                {monthDetail.monthDailyFlow.map((d, i) => {
                  const incP = modalChart.modalIncPts[i]; const expP = modalChart.modalExpPts[i]
                  const isActive = modalActiveIdx === i
                  if (!incP || !expP) return null
                  return (
                    <g key={i}>
                      <circle cx={incP.x} cy={incP.y} r={isActive ? 6 : 3} fill="#10B981" stroke="#FFF" strokeWidth={isActive ? 1.5 : 0.5} />
                      <circle cx={expP.x} cy={expP.y} r={isActive ? 6 : 3} fill="#810B38" stroke="#FFF" strokeWidth={isActive ? 1.5 : 0.5} />
                    </g>
                  )
                })}
                {monthDetail.monthDailyFlow.map((d, i) => {
                  const p = modalChart.modalIncPts[i]
                  if (!p) return null
                  if ((i + 1) % 5 !== 0 && i !== 0 && i !== monthDetail.monthDailyFlow.length - 1) return null
                  return (
                    <text key={`label-${i}`} x={p.x} y={CHART_DIMENSIONS.svgHeight - 10} textAnchor="middle"
                      className="fill-muted-foreground font-semibold text-[9px] uppercase tracking-wider">{d.date}</text>
                  )
                })}
                {monthDetail.monthDailyFlow.map((d, i) => {
                  const width = CHART_DIMENSIONS.chartWidth / Math.max(1, monthDetail.monthDailyFlow.length - 1)
                  const x = CHART_DIMENSIONS.paddingX + i * width - width / 2
                  return (
                    <rect key={`hit-${i}`} x={x} y={CHART_DIMENSIONS.paddingY} width={width} height={CHART_DIMENSIONS.chartHeight}
                      fill="transparent" className="cursor-pointer"
                      onMouseEnter={() => setModalActiveIdx(i)}
                      onMouseLeave={() => setModalActiveIdx(null)}
                      onClick={(e) => { e.stopPropagation(); setModalActiveIdx(i === modalActiveIdx ? null : i) }} />
                  )
                })}
              </svg>
              <AnimatePresence>
                {modalActiveIdx !== null && monthDetail.monthDailyFlow[modalActiveIdx] && modalChart.modalIncPts[modalActiveIdx] && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, x: modalChart.modalTooltipTransform.x, y: `calc(${modalChart.modalTooltipTransform.y} + 8px)` }}
                    animate={{ opacity: 1, scale: 1, x: modalChart.modalTooltipTransform.x, y: modalChart.modalTooltipTransform.y }}
                    exit={{ opacity: 0, scale: 0.95, x: modalChart.modalTooltipTransform.x, y: `calc(${modalChart.modalTooltipTransform.y} + 8px)` }}
                    transition={{ duration: 0.12 }}
                    className="absolute z-50 bg-background/95 border border-border/80 p-2.5 rounded-lg shadow-xl backdrop-blur-md text-[10px] flex flex-col gap-1 pointer-events-none min-w-[120px]"
                    style={modalChart.modalTooltipStyle}
                  >
                    <div className="font-bold text-foreground border-b border-border/50 pb-0.5">
                      <span>{language === 'id' ? monthDetail.monthDailyFlow[modalActiveIdx].date : monthDetail.monthDailyFlow[modalActiveIdx].dateEn}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 font-semibold mt-0.5">
                      <div className="flex items-center justify-between gap-4 text-green-600 dark:text-green-400">
                        <span>{t('income')}:</span>
                        <span>{formatCurrency(monthDetail.monthDailyFlow[modalActiveIdx].income, language)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-primary">
                        <span>{t('expense')}:</span>
                        <span>{formatCurrency(monthDetail.monthDailyFlow[modalActiveIdx].expense, language)}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            {language === 'id' ? 'Daftar Transaksi Bulan Ini' : 'Transactions List This Month'}
          </h4>
          <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2">
            {monthDetail.monthTransactions.length > 0 ? (
              monthDetail.monthTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/10 text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-full ${tx.type === 'in' ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                      {tx.type === 'in' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <span className="font-bold text-foreground block leading-tight">{tx.note === 'Modal awal' ? t('initialNote') : tx.note}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">
                        {tx.category === 'Saldo Awal' ? t('initialBalance') : tx.category} &bull; {formatRelativeDate(tx.date, language)}
                      </span>
                    </div>
                  </div>
                  <span className={`font-bold ${tx.type === 'in' ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                    {tx.type === 'in' ? '+' : '-'}{formatCurrency(tx.amount, language)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">{t('noTransactions')}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-border/40">
          <Button onClick={onClose}
            className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold rounded-lg px-5 py-2 cursor-pointer shadow-sm">
            {language === 'id' ? 'Tutup' : 'Close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
