"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useLanguageStore } from "@/store/useLanguageStore"
import { useTransactionStore } from "@/store/useTransactionStore"
import { getTranslation } from "@/lib/format"
import { motion, AnimatePresence } from "framer-motion"
import {
  BarChart3, ChevronDown, PieChart, Filter,
  LineChart,
  FileSpreadsheet, FileText, Image as FileImage,
} from "lucide-react"
import { exportToExcel, exportToPDF } from "@/lib/export"
import AverageAnalysisTab from "@/components/statistics/AverageAnalysisTab"
import QuarterlyDetailDialog from "@/components/statistics/QuarterlyDetailDialog"
import StatSummaryCards from "@/components/statistics/StatSummaryCards"
import { useStatisticsCore, useQuarterlyDetail } from "@/hooks/useStatisticsData"
import { useCashFlowChart, useChartInteraction, useModalChartMath } from "@/hooks/useChartMath"
import { CashFlowChart, CHART_MODE_ICONS } from "@/components/charts/CashFlowChart"
import { DonutChart } from "@/components/charts/DonutChart"
import { getQuarterMonthDetail } from "@/lib/statistics"
import { svgToCanvas, formatCurrencyExport } from "@/lib/chartExport"

export default function StatisticsPage() {
  const { language } = useLanguageStore()
  const transactions = useTransactionStore((state) => state.transactions)
  const [mounted, setMounted] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<'trend' | 'average'>('trend')
  const [activeLineIndex, setActiveLineIndex] = React.useState<number | null>(null)
  const [activeDonutIndex, setActiveDonutIndex] = React.useState<number | null>(null)
  const [chartMode, setChartMode] = React.useState<'line' | 'bar' | 'stacked' | 'netFlow'>('line')
  const [isChartModeDropdownOpen, setIsChartModeDropdownOpen] = React.useState(false)
  const [isMobileFilterDropdownOpen, setIsMobileFilterDropdownOpen] = React.useState(false)
  const chartRef = React.useRef<HTMLDivElement>(null)
  const svgRef = React.useRef<SVGSVGElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const [filter, setFilter] = React.useState<'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'customPeriod'>('weekly')
  const [startDate, setStartDate] = React.useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = React.useState(() => new Date().toISOString().split('T')[0])

  const [selectedMonthDetail, setSelectedMonthDetail] = React.useState<{
    monthIndex: number
    monthNameId: string
    monthNameEn: string
  } | null>(null)

  const [modalActiveIdx, setModalActiveIdx] = React.useState<number | null>(null)
  const modalChartRef = React.useRef<HTMLDivElement>(null)

  const { periodSubLabel, filteredTransactions, totals, displayCashFlow, donutData, totalSpent } =
    useStatisticsCore(transactions, filter, startDate, endDate, language)
  const { totalIn, totalOut, netFlow } = totals

  const { dims, maxVal, netFlowData, incomePoints, expensePoints } = useCashFlowChart(displayCashFlow, chartMode)
  useChartInteraction(
    activeLineIndex, displayCashFlow, incomePoints, expensePoints,
    chartMode, maxVal, dims.chartHeight, dims.paddingY, netFlowData, dims.svgWidth, dims.svgHeight
  )

  const handleExportChartImage = async () => {
    if (svgRef.current) {
      const isId = language === 'id'
      const canvas = await svgToCanvas(svgRef.current, 1200, 820)
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.strokeStyle = "#E2E8F0"; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(40, 535); ctx.lineTo(1160, 535); ctx.stroke()
      ctx.fillStyle = "#1E293B"; ctx.font = "bold 16px Arial, sans-serif"
      ctx.fillText(isId ? "RINGKASAN DATA ARUS KAS" : "CASH FLOW DATA SUMMARY", 50, 565)
      ctx.fillStyle = "#1E293B"; ctx.fillRect(40, 580, 1120, 36)
      ctx.fillStyle = "#ffffff"; ctx.font = "bold 12px Arial, sans-serif"
      const colHeaders = isId ? ["Periode", "Total Pemasukan", "Total Pengeluaran", "Selisih Arus Kas"] : ["Period", "Total Income", "Total Expense", "Net Flow"]
      ctx.textAlign = "left"; ctx.fillText(colHeaders[0], 60, 602)
      ctx.textAlign = "right"; ctx.fillText(colHeaders[1], 500, 602); ctx.fillText(colHeaders[2], 820, 602); ctx.fillText(colHeaders[3], 1140, 602)
      ctx.font = "bold 12px Arial, sans-serif"
      const maxRows = Math.min(6, displayCashFlow.length)
      const locale = isId ? 'id-ID' : 'en-US'
      for (let idx = 0; idx < maxRows; idx++) {
        const d = displayCashFlow[idx]; const period = isId ? d.date : d.dateEn; const net = d.income - d.expense; const yRow = 635 + idx * 28
        if (idx % 2 === 1) { ctx.fillStyle = "#F8FAFC"; ctx.fillRect(40, yRow - 18, 1120, 24) }
        ctx.fillStyle = "#1E293B"; ctx.textAlign = "left"; ctx.fillText(period, 60, yRow)
        ctx.fillStyle = "#16A34A"; ctx.textAlign = "right"; ctx.fillText(formatCurrencyExport(d.income, locale), 500, yRow)
        ctx.fillStyle = "#DC2626"; ctx.fillText(formatCurrencyExport(d.expense, locale), 820, yRow)
        ctx.fillStyle = net >= 0 ? "#1D4ED8" : "#B91C1C"; ctx.fillText((net >= 0 ? "+" : "") + formatCurrencyExport(net, locale), 1140, yRow)
      }
      if (displayCashFlow.length > 6) {
        ctx.fillStyle = "#64748B"; ctx.textAlign = "center"; ctx.font = "italic 11px Arial, sans-serif"
        ctx.fillText(isId ? `... dan ${displayCashFlow.length - 6} data lainnya ...` : `... and ${displayCashFlow.length - 6} more periods ...`, 600, 635 + 6 * 28)
      }
      const pngURL = canvas.toDataURL("image/png")
      const downloadLink = document.createElement("a"); downloadLink.href = pngURL; downloadLink.download = `Cashhero_Chart_${filter}_${new Date().toISOString().split('T')[0]}.png`
      document.body.appendChild(downloadLink); downloadLink.click(); document.body.removeChild(downloadLink)
    }
  }

  const handleExportChartExcel = async () => {
    if (svgRef.current) {
      const isId = language === 'id'
      const canvas = await svgToCanvas(svgRef.current)
      const pngURL = canvas.toDataURL("image/png")
      const chartHeaders = isId ? ["Periode", "Total Pemasukan", "Total Pengeluaran", "Selisih Bersih"] : ["Period", "Total Income", "Total Expense", "Net Flow"]
      const locale = isId ? 'id-ID' : 'en-US'
      const rows = displayCashFlow.map((d, idx) => {
        const periodLabel = isId ? d.date : d.dateEn; const net = d.income - d.expense; const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'
        return `<tr style="background-color: ${rowBg};"><td style="border: 1px solid #CBD5E1; padding: 10px; font-size: 10pt; font-weight: bold; color: #1E293B; font-family: Arial, sans-serif;">${periodLabel}</td><td style="border: 1px solid #CBD5E1; padding: 10px; font-size: 10pt; text-align: right; color: #16A34A; font-weight: bold; font-family: Arial, sans-serif;">${formatCurrencyExport(d.income, locale)}</td><td style="border: 1px solid #CBD5E1; padding: 10px; font-size: 10pt; text-align: right; color: #DC2626; font-weight: bold; font-family: Arial, sans-serif;">${formatCurrencyExport(d.expense, locale)}</td><td style="border: 1px solid #CBD5E1; padding: 10px; font-size: 10pt; text-align: right; color: ${net >= 0 ? '#1D4ED8' : '#B91C1C'}; font-weight: bold; font-family: Arial, sans-serif;">${formatCurrencyExport(net, locale)}</td></tr>`
      }).join("")
      const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8" /><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Data Grafik Cashhero</x:Name><x:WorksheetOptions><x:DisplayGridlines /></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body style="font-family: Arial, sans-serif; padding: 20px;"><table style="border-collapse: collapse; width: 100%;"><colgroup><col width="200" /><col width="180" /><col width="180" /><col width="180" /></colgroup><tr><td colspan="4" style="background-color: #810B38; color: #FFFFFF; font-size: 14pt; font-weight: bold; text-align: center; padding: 12px;">${isId ? "RINGKASAN DATA GRAFIK CASHHERO" : "CASHHERO CHART DATA SUMMARY"}</td></tr><tr><td colspan="4" style="font-size: 10pt; padding: 8px 0; color: #475569;"><strong>${isId ? "Filter Periode" : "Period Filter"}:</strong> ${periodSubLabel}</td></tr><tr><td colspan="4" style="text-align: center; padding: 20px 0; border: 1px solid #CBD5E1;"><img src="${pngURL}" width="600" height="260" style="display: block; margin: 0 auto;" /></td></tr><tr><td colspan="4" style="height: 20px;"></td></tr><tr style="background-color: #1E293B;"><th style="border: 1px solid #475569; color: #FFFFFF; padding: 10px; text-align: left;">${chartHeaders[0]}</th><th style="border: 1px solid #475569; color: #FFFFFF; padding: 10px; text-align: right;">${chartHeaders[1]}</th><th style="border: 1px solid #475569; color: #FFFFFF; padding: 10px; text-align: right;">${chartHeaders[2]}</th><th style="border: 1px solid #475569; color: #FFFFFF; padding: 10px; text-align: right;">${chartHeaders[3]}</th></tr>${rows}</table></body></html>`
      const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" })
      const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Cashhero_Chart_Data_${new Date().toISOString().split('T')[0]}.xls`
      document.body.appendChild(link); link.click(); document.body.removeChild(link)
    }
  }

  const handleExportChartPDF = async () => {
    if (svgRef.current) {
      const isId = language === 'id'
      const canvas = await svgToCanvas(svgRef.current)
      const pngURL = canvas.toDataURL("image/png")

      const chartModeLabels: Record<string, string> = {
      line: isId ? "Tren Garis Arus Kas" : "Line Cash Flow Trend",
      bar: isId ? "Batang Sisi-ke-Sisi" : "Side-by-Side Bar",
      stacked: isId ? "Batang Bertumpuk" : "Stacked Bar",
      netFlow: isId ? "Aliran Selisih Bersih" : "Net Savings Flow"
      }
      const chartModeLabel = chartModeLabels[chartMode] || chartMode
      const locale = isId ? 'id-ID' : 'en-US'
      const headers = isId ? ["Periode", "Total Pemasukan", "Total Pengeluaran", "Selisih Bersih"] : ["Period", "Total Income", "Total Expense", "Net Flow"]
      const rowsHtml = displayCashFlow.map((d, idx) => {
        const periodLabel = isId ? d.date : d.dateEn; const net = d.income - d.expense; const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'
        return `<tr style="background-color: ${rowBg}; page-break-inside: avoid;"><td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-size: 11px; font-weight: bold; color: #1E293B; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">${periodLabel}</td><td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-size: 11px; text-align: right; color: #16A34A; font-weight: bold; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">${formatCurrencyExport(d.income, locale)}</td><td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-size: 11px; text-align: right; color: #DC2626; font-weight: bold; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">${formatCurrencyExport(d.expense, locale)}</td><td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-size: 11px; text-align: right; color: ${net >= 0 ? '#1D4ED8' : '#B91C1C'}; font-weight: bold; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">${net >= 0 ? '+' : ''}${formatCurrencyExport(net, locale)}</td></tr>`
      }).join("")

      const sanitizedFilter = filter.replace(/[^a-zA-Z0-9]/g, "_")
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, "_")
      const docTitle = isId ? `Cashhero_Laporan_Grafik_${sanitizedFilter}_${dateStr}` : `Cashhero_Chart_Report_${sanitizedFilter}_${dateStr}`
      const iframe = document.createElement("iframe")
      iframe.style.position = "fixed"; iframe.style.right = "0"; iframe.style.bottom = "0"; iframe.style.width = "0"; iframe.style.height = "0"; iframe.style.border = "0"
      document.body.appendChild(iframe)
      const doc = iframe.contentWindow?.document || iframe.contentDocument
      if (doc) {
        doc.write(`<html><head><title>${docTitle}</title><style>@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');@page{size:A4 portrait;margin:15mm;}body{font-family:'Plus Jakarta Sans',Arial,sans-serif;color:#1E293B;margin:0;padding:0;background:#FFFFFF;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-size:11px;line-height:1.4;}.header{background-color:#810B38;padding:20px;border-radius:12px;color:#FFFFFF;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;}.title{font-size:16px;font-weight:800;letter-spacing:-0.5px;margin:0;text-transform:uppercase;}.brand{font-size:12px;font-weight:700;opacity:0.9;}.meta-info{display:flex;justify-content:space-between;font-size:11px;color:#64748B;padding-bottom:10px;border-bottom:2px solid #F1F5F9;margin-bottom:20px;}.meta-info strong{color:#1E293B;}.chart-container{text-align:center;margin-bottom:30px;border:1px solid #E2E8F0;border-radius:12px;padding:15px;background:#FFFFFF;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);}.chart-image{width:100%;max-width:700px;height:auto;border-radius:6px;}table{width:100%;border-collapse:collapse;margin-top:10px;}th{padding:10px;text-align:left;background:#1E293B;color:#FFFFFF;font-weight:700;font-size:10px;text-transform:uppercase;border-bottom:3px solid #CBD5E1;}.th-right{text-align:right;}.footer{margin-top:40px;padding-top:15px;border-top:1px solid #E2E8F0;text-align:center;font-size:10px;color:#64748B;}</style></head><body><div class="header"><div class="title">${isId ? "LAPORAN GRAFIK KEUANGAN" : "FINANCIAL CHART REPORT"}</div><div class="brand">Cashhero</div></div><div class="meta-info"><div><strong>${isId ? "Filter Periode" : "Period Filter"}:</strong> ${periodSubLabel} &bull; <strong>${isId ? "Mode Grafik" : "Chart Mode"}:</strong> ${chartModeLabel}</div><div><strong>${isId ? "Tanggal Cetak" : "Print Date"}:</strong> ${new Date().toLocaleDateString(isId ? 'id-ID' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div></div><div class="chart-container"><img src="${pngURL}" class="chart-image" alt="Chart" /></div><table><thead><tr><th>${headers[0]}</th><th class="th-right">${headers[1]}</th><th class="th-right">${headers[2]}</th><th class="th-right">${headers[3]}</th></tr></thead><tbody>${rowsHtml}</tbody></table><div class="footer">${isId ? "Dibuat menggunakan Cashhero" : "Generated using Cashhero"} &bull; ${new Date().toISOString().split('T')[0]}</div></body></html>`)
        doc.close()
        setTimeout(() => { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); setTimeout(() => { document.body.removeChild(iframe) }, 1000) }, 500)
      }
    }
  }

  React.useEffect(() => { setMounted(true) }, [])

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chartRef.current && !chartRef.current.contains(event.target as Node)) setActiveLineIndex(null)
      if (modalChartRef.current && !modalChartRef.current.contains(event.target as Node)) setModalActiveIdx(null)
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsChartModeDropdownOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const chartLabels = React.useMemo(() => ({
    income: getTranslation(language, 'income') + ':',
    expense: getTranslation(language, 'expense') + ':',
  }), [language])

  const t = (key: string) => getTranslation(language, key)

  const handleQuarterlyClick = React.useCallback((index: number) => {
    const detail = getQuarterMonthDetail(index, language)
    setSelectedMonthDetail(detail)
    setModalActiveIdx(null)
  }, [language])

  const monthDetail = useQuarterlyDetail(transactions, selectedMonthDetail?.monthIndex ?? null)
  const modalChart = useModalChartMath(monthDetail?.monthDailyFlow ?? [], modalActiveIdx)

  return (
    <motion.div
      className="flex flex-col gap-8 pb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-sm">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{t('statistics')}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{t('statisticsSubtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center no-print">
          <button onClick={() => { exportToExcel(filteredTransactions, periodSubLabel, { income: totalIn, expense: totalOut, balance: netFlow }, language) }}
            className="px-4 py-2.5 bg-muted/40 hover:bg-muted/70 text-foreground border border-border font-semibold text-sm rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer duration-200">
            <FileSpreadsheet className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span>{language === 'id' ? 'Ekspor Excel' : 'Export Excel'}</span>
          </button>
          <button onClick={() => { exportToPDF(filteredTransactions, periodSubLabel, { income: totalIn, expense: totalOut, balance: netFlow }, language) }}
            className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer duration-200">
            <FileText className="w-4 h-4" />
            <span>{language === 'id' ? 'Ekspor PDF' : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-card border border-border p-1 rounded-xl shadow-sm w-fit">
        <button onClick={() => setActiveTab('trend')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 ${activeTab === 'trend' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
          <LineChart className="w-4 h-4" />{t('trendAnalysis')}
        </button>
        <button onClick={() => setActiveTab('average')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 ${activeTab === 'average' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
          <BarChart3 className="w-4 h-4" />{t('averageAnalysis')}
        </button>
      </div>

      <div className="flex flex-col gap-4 bg-card border border-border p-4 rounded-xl shadow-sm no-print">
        <div className="hidden md:flex flex-row items-center gap-1.5 flex-nowrap overflow-x-auto scrollbar-none w-full max-w-full py-1">
          <span className="text-xs font-semibold text-muted-foreground mr-1.5 flex items-center gap-1 uppercase tracking-wider shrink-0 select-none">
            <Filter className="w-3.5 h-3.5" />{t('filterPeriod')}:
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {(['weekly', 'monthly', 'quarterly', 'yearly', 'customPeriod'] as const).map((p) => (
              <button key={p} onClick={() => { setFilter(p); setActiveLineIndex(null) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 ${filter === p ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]" : "bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-transparent hover:border-border"}`}>
                {t(p)}
              </button>
            ))}
          </div>
          {filter === 'customPeriod' && (
            <div className="flex flex-row items-center gap-3 shrink-0 animate-in fade-in slide-in-from-left-1 duration-200 border-l border-border/60 dark:border-zinc-700/60 pl-3.5 ml-2 font-number">
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase whitespace-nowrap">{t('startDate')}:</span>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="bg-muted/30 dark:bg-zinc-800/30 border border-border dark:border-zinc-700/80 rounded-lg px-2.5 py-1 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary shrink-0" />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase whitespace-nowrap">{t('endDate')}:</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="bg-muted/30 dark:bg-zinc-800/30 border border-border dark:border-zinc-700/80 rounded-lg px-2.5 py-1 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary shrink-0" />
              </div>
            </div>
          )}
        </div>

        <div className="flex md:hidden flex-col gap-3.5 w-full">
          <div className="flex items-center justify-between gap-3 w-full relative">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider select-none">
              <Filter className="w-4 h-4" />{t('filterPeriod')}
            </span>
            <div className="relative flex-1 max-w-[200px]">
              <button onClick={() => setIsMobileFilterDropdownOpen(!isMobileFilterDropdownOpen)}
                className="w-full px-3.5 py-2 bg-muted/40 hover:bg-muted/70 text-foreground border border-border/80 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-between gap-2 shadow-sm active:scale-95">
                <span className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-primary" />
                  <span>{t(filter)}</span>
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isMobileFilterDropdownOpen ? 'transform rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isMobileFilterDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-[180px] bg-background/95 border border-border rounded-xl shadow-xl backdrop-blur-md z-50 p-1 flex flex-col gap-0.5"
                  >
                    {(['weekly', 'monthly', 'quarterly', 'yearly', 'customPeriod'] as const).map((p) => (
                      <button key={p} onClick={() => { setFilter(p); setActiveLineIndex(null); setIsMobileFilterDropdownOpen(false) }}
                        className={`w-full px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-2 ${filter === p ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"}`}>
                        <span>{t(p)}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          {filter === 'customPeriod' && (
            <div className="flex flex-row items-center justify-between gap-3 w-full animate-in fade-in slide-in-from-top-1 duration-200 bg-muted/20 border border-border/60 dark:border-zinc-700/60 p-3 rounded-xl font-number">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase whitespace-nowrap">{t('startDate')}:</span>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="bg-background border border-border dark:border-zinc-700/80 rounded-lg px-2 py-1.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full" />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase whitespace-nowrap">{t('endDate')}:</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="bg-background border border-border dark:border-zinc-700/80 rounded-lg px-2 py-1.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full" />
              </div>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'trend' && (
        <>
          <StatSummaryCards
            totalIn={totalIn}
            totalOut={totalOut}
            netFlow={netFlow}
            periodSubLabel={periodSubLabel}
            language={language}
            mounted={mounted}
          />

          <div className="grid gap-6 lg:grid-cols-7">
            <Card ref={chartRef} className={`lg:col-span-4 bg-card border-border shadow-sm flex flex-col justify-between relative transition-all duration-300 overflow-visible ${activeLineIndex !== null ? 'z-40' : 'z-10 hover:z-20'}`}>
              <CardHeader className="flex flex-col gap-4 border-b border-border/50 pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-foreground text-lg font-bold flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />{t('cashFlowTrend')}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {filter === 'quarterly'
                        ? (language === 'id' ? "Klik titik bulan untuk melihat rincian tren harian & daftar transaksi!" : "Click month points to open daily detailed trends & transaction lists!")
                        : (language === 'id' ? "Uraian tren pemasukan dan pengeluaran Anda pada periode terpilih." : "Income vs expense breakdown trends for the selected period.")}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1.5 self-start md:self-center bg-muted/30 p-1 rounded-lg border border-border/50 no-print">
                    <button onClick={handleExportChartExcel}
                      className="p-2 hover:bg-muted/70 text-green-600 dark:text-green-400 rounded-md transition-all cursor-pointer hover:scale-105"
                      title={language === 'id' ? 'Ekspor Data ke Excel' : 'Export Data to Excel'}>
                      <FileSpreadsheet className="w-4 h-4" />
                    </button>
                    <button onClick={handleExportChartPDF}
                      className="p-2 hover:bg-muted/70 text-red-600 dark:text-red-400 rounded-md transition-all cursor-pointer hover:scale-105"
                      title={language === 'id' ? 'Ekspor PDF Laporan Grafik' : 'Export Chart PDF Report'}>
                      <FileText className="w-4 h-4" />
                    </button>
                    <button onClick={handleExportChartImage}
                      className="p-2 hover:bg-muted/70 text-blue-600 dark:text-blue-400 rounded-md transition-all cursor-pointer hover:scale-105"
                      title={language === 'id' ? 'Unduh Gambar Grafik' : 'Download Chart Image'}>
                      <FileImage className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-border/30">
                  <div className="relative no-print" ref={dropdownRef}>
                    <button onClick={() => setIsChartModeDropdownOpen(!isChartModeDropdownOpen)}
                      className="px-3.5 py-2 bg-muted/40 hover:bg-muted/70 text-foreground border border-border/80 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-sm hover:shadow active:scale-95">
                      {(() => {
                        const CurrentIcon = CHART_MODE_ICONS[chartMode]
                        const currentLabel = { line: language === 'id' ? 'Garis' : 'Line', bar: language === 'id' ? 'Batang Komparasi' : 'Side-by-Side Bar', stacked: language === 'id' ? 'Batang Akumulasi' : 'Stacked Bar', netFlow: language === 'id' ? 'Arus Bersih' : 'Net Savings Flow' }[chartMode]
                        return <><CurrentIcon className="w-4 h-4 text-primary" /><span>{currentLabel}</span></>
                      })()}
                      <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isChartModeDropdownOpen ? 'transform rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {isChartModeDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 mt-2 w-[185px] bg-background/95 border border-border rounded-xl shadow-xl backdrop-blur-md z-50 p-1 flex flex-col gap-0.5"
                        >
                          {(['line', 'bar', 'stacked', 'netFlow'] as const).map((m) => {
                            const isActive = chartMode === m
                            const modeLabel = { line: language === 'id' ? 'Tren Garis' : 'Line Trend', bar: language === 'id' ? 'Batang Komparasi' : 'Compare Bar', stacked: language === 'id' ? 'Batang Akumulasi' : 'Stacked Bar', netFlow: language === 'id' ? 'Arus Bersih' : 'Net Flow' }[m]
                            const Icon = CHART_MODE_ICONS[m]
                            return (
                              <button key={m} onClick={() => { setChartMode(m); setActiveLineIndex(null); setIsChartModeDropdownOpen(false) }}
                                className={`w-full px-3 py-2 rounded-lg text-left text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-2 ${isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"}`}>
                                <Icon className="w-4 h-4" /><span>{modeLabel}</span>
                              </button>
                            )
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-bold text-foreground">
                    {chartMode === 'netFlow' ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-md bg-green-500" />
                        <span>{language === 'id' ? 'Surplus Bersih' : 'Net Surplus'}</span>
                        <span className="w-3 h-3 rounded-md bg-primary" />
                        <span>{language === 'id' ? 'Defisit Bersih' : 'Net Deficit'}</span>
                      </span>
                    ) : (
                      <>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500" />{t('income')}</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary" />{t('expense')}</span>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex-1 flex flex-col justify-center relative select-none">
                <CashFlowChart
                  displayCashFlow={displayCashFlow}
                  chartMode={chartMode}
                  activeLineIndex={activeLineIndex}
                  setActiveLineIndex={setActiveLineIndex}
                  language={language}
                  filter={filter}
                  handleQuarterlyClick={handleQuarterlyClick}
                  svgRef={svgRef}
                  labels={chartLabels}
                />
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 bg-card border-border shadow-sm flex flex-col justify-between relative z-10 hover:z-20 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-foreground text-lg font-bold flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />{t('topExpenses')}
                </CardTitle>
                <CardDescription className="text-xs">
                  {language === 'id' ? "Pembagian pengeluaran teratas berdasarkan kategori." : "Top expenses breakdown mapped dynamically by category."}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 flex-1 flex flex-col items-center justify-center gap-6">
                <DonutChart
                  donutData={donutData}
                  totalSpent={totalSpent}
                  activeDonutIndex={activeDonutIndex}
                  setActiveDonutIndex={setActiveDonutIndex}
                  language={language}
                  mounted={mounted}
                />
              </CardContent>
            </Card>
          </div>

          <QuarterlyDetailDialog
            selectedMonthDetail={selectedMonthDetail}
            onClose={() => setSelectedMonthDetail(null)}
            monthDetail={monthDetail}
            language={language}
            modalActiveIdx={modalActiveIdx}
            setModalActiveIdx={setModalActiveIdx}
            modalChartRef={modalChartRef}
            modalChart={modalChart}
          />
        </>
      )}

      {activeTab === 'average' && (
        <AverageAnalysisTab
          filter={filter}
          filteredTransactions={filteredTransactions}
          startDate={startDate}
          endDate={endDate}
          periodSubLabel={periodSubLabel}
        />
      )}
    </motion.div>
  )
}
