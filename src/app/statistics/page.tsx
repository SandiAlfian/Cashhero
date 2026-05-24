"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useLanguageStore, translations } from "@/store/useLanguageStore"
import { useTransactionStore } from "@/store/useTransactionStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { formatCurrency, formatRelativeDate } from "@/lib/format"
import { motion, AnimatePresence } from "framer-motion"
import { 
  BarChart3, 
  Calendar,
  ChevronDown,
  PieChart,
  Filter,
  ArrowDown,
  ArrowUp,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  LineChart,
  AreaChart,
  Image as FileImage
} from "lucide-react"
import { exportToExcel, exportToPDF } from "@/lib/export"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// Cash Flow Line Chart Data Point
interface CashFlowDataPoint {
  date: string
  dateEn: string
  income: number
  expense: number
}

// Top Expenses Category Point
interface DonutDataPoint {
  category: string
  categoryEn: string
  amount: number
  color: string
  percentage: number
}

export default function StatisticsPage() {
  const { language } = useLanguageStore()
  const transactions = useTransactionStore((state) => state.transactions)
  const [mounted, setMounted] = React.useState(false)

  // Interactive chart states
  const [activeLineIndex, setActiveLineIndex] = React.useState<number | null>(null)
  const [activeDonutIndex, setActiveDonutIndex] = React.useState<number | null>(null)
  const [chartMode, setChartMode] = React.useState<'line' | 'bar' | 'stacked' | 'netFlow'>('line')
  const [isChartModeDropdownOpen, setIsChartModeDropdownOpen] = React.useState(false)
  const [isMobileFilterDropdownOpen, setIsMobileFilterDropdownOpen] = React.useState(false)
  const chartRef = React.useRef<HTMLDivElement>(null)
  const svgRef = React.useRef<SVGSVGElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const defaultHistoryFilter = useSettingsStore((state) => state.defaultHistoryFilter)

  // Raised filter states - Init with static value to prevent SSR Hydration Mismatch
  const [filter, setFilter] = React.useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'customPeriod'>('weekly')

  React.useEffect(() => {
    setFilter(defaultHistoryFilter)
  }, [defaultHistoryFilter])
  const [startDate, setStartDate] = React.useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = React.useState(() => {
    return new Date().toISOString().split('T')[0]
  })

  // Quarterly detail modal state
  const [selectedMonthDetail, setSelectedMonthDetail] = React.useState<{
    monthIndex: number
    monthNameId: string
    monthNameEn: string
  } | null>(null)
  
  // Interactive modal chart state
  const [modalActiveIdx, setModalActiveIdx] = React.useState<number | null>(null)
  const modalChartRef = React.useRef<HTMLDivElement>(null)

  // Chart image export PNG
  const handleExportChartImage = () => {
    if (svgRef.current) {
      const isId = language === 'id'
      const fileName = `Cashhero_Chart_${filter}_${new Date().toISOString().split('T')[0]}`
      const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement
      
      const styleBlock = document.createElement("style")
      styleBlock.textContent = `
        .stroke-border\\/40 { stroke: rgba(226, 232, 240, 0.45) !important; }
        .stroke-primary\\/50 { stroke: rgba(129, 11, 56, 0.5) !important; }
        .stroke-primary\\/60 { stroke: rgba(129, 11, 56, 0.6) !important; }
        .fill-muted-foreground { fill: #64748B !important; }
        text { font-family: 'Plus Jakarta Sans', Arial, sans-serif !important; font-weight: 600; }
      `
      svgClone.insertBefore(styleBlock, svgClone.firstChild)
      
      const svgString = new XMLSerializer().serializeToString(svgClone)
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" })
      const URL = window.URL || window.webkitURL || window
      const blobURL = URL.createObjectURL(svgBlob)
      
      const image = new Image()
      image.onload = () => {
        // Render a professional data table in the exported PNG image
        // Enlarge canvas to 1200x820 (520px chart, 300px for table data)
        const canvas = document.createElement("canvas")
        canvas.width = 1200
        canvas.height = 820
        const context = canvas.getContext("2d")
        if (context) {
          // Fill background
          context.fillStyle = "#ffffff"
          context.fillRect(0, 0, canvas.width, canvas.height)
          
          // Draw chart SVG at y = 0
          context.drawImage(image, 0, 0, 1200, 520)
          
          // Draw visual divider
          context.strokeStyle = "#E2E8F0"
          context.lineWidth = 2
          context.beginPath()
          context.moveTo(40, 535)
          context.lineTo(1160, 535)
          context.stroke()
          
          // Draw table title header
          context.fillStyle = "#1E293B"
          context.font = "bold 16px Arial, sans-serif"
          context.fillText(isId ? "RINGKASAN DATA ARUS KAS" : "CASH FLOW DATA SUMMARY", 50, 565)
          
          // Draw Table Header Block
          context.fillStyle = "#1E293B"
          context.fillRect(40, 580, 1120, 36)
          
          // Draw Column Headers
          context.fillStyle = "#ffffff"
          context.font = "bold 12px Arial, sans-serif"
          
          const colHeaders = isId 
            ? ["Periode", "Total Pemasukan", "Total Pengeluaran", "Selisih Arus Kas"]
            : ["Period", "Total Income", "Total Expense", "Net Flow"]
            
          context.textAlign = "left"
          context.fillText(colHeaders[0], 60, 602)
          context.textAlign = "right"
          context.fillText(colHeaders[1], 500, 602)
          context.fillText(colHeaders[2], 820, 602)
          context.fillText(colHeaders[3], 1140, 602)
          
          // Draw Rows
          context.font = "bold 12px Arial, sans-serif"
          const maxRows = Math.min(6, displayCashFlow.length) // limit to 6 rows to prevent canvas clipping
          
          const fmt = (num: number) => {
            return new Intl.NumberFormat(isId ? 'id-ID' : 'en-US', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(num)
          }
          
          for (let idx = 0; idx < maxRows; idx++) {
            const d = displayCashFlow[idx]
            const period = isId ? d.date : d.dateEn
            const net = d.income - d.expense
            const yRow = 635 + idx * 28
            
            // Zebra background
            if (idx % 2 === 1) {
              context.fillStyle = "#F8FAFC"
              context.fillRect(40, yRow - 18, 1120, 24)
            }
            
            // Period Label
            context.fillStyle = "#1E293B"
            context.textAlign = "left"
            context.fillText(period, 60, yRow)
            
            // Income (Green)
            context.fillStyle = "#16A34A"
            context.textAlign = "right"
            context.fillText(fmt(d.income), 500, yRow)
            
            // Expense (Red)
            context.fillStyle = "#DC2626"
            context.fillText(fmt(d.expense), 820, yRow)
            
            // Net Flow (Blue/Amber)
            context.fillStyle = net >= 0 ? "#1D4ED8" : "#B91C1C"
            context.fillText((net >= 0 ? "+" : "") + fmt(net), 1140, yRow)
          }
          
          // If displayCashFlow has more than 6 rows, print an ellipsis row
          if (displayCashFlow.length > 6) {
            const yEllipsis = 635 + 6 * 28
            context.fillStyle = "#64748B"
            context.textAlign = "center"
            context.font = "italic 11px Arial, sans-serif"
            context.fillText(isId ? `... dan ${displayCashFlow.length - 6} data lainnya ...` : `... and ${displayCashFlow.length - 6} more periods ...`, 600, yEllipsis)
          }
          
          // Trigger download link
          const pngURL = canvas.toDataURL("image/png")
          const downloadLink = document.createElement("a")
          downloadLink.href = pngURL
          downloadLink.download = `${fileName}.png`
          document.body.appendChild(downloadLink)
          downloadLink.click()
          document.body.removeChild(downloadLink)
        }
        URL.revokeObjectURL(blobURL)
      }
      image.src = blobURL
    }
  }

  // Chart data Excel export
  const handleExportChartExcel = () => {
    if (svgRef.current) {
      const isId = language === 'id'
      const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement
      
      const styleBlock = document.createElement("style")
      styleBlock.textContent = `
        .stroke-border\\/40 { stroke: rgba(226, 232, 240, 0.45) !important; }
        .stroke-primary\\/50 { stroke: rgba(129, 11, 56, 0.5) !important; }
        .stroke-primary\\/60 { stroke: rgba(129, 11, 56, 0.6) !important; }
        .fill-muted-foreground { fill: #64748B !important; }
        text { font-family: 'Plus Jakarta Sans', Arial, sans-serif !important; font-weight: 600; }
      `
      svgClone.insertBefore(styleBlock, svgClone.firstChild)
      
      const svgString = new XMLSerializer().serializeToString(svgClone)
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" })
      const URL = window.URL || window.webkitURL || window
      const blobURL = URL.createObjectURL(svgBlob)
      
      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = 1200
        canvas.height = 520
        const context = canvas.getContext("2d")
        if (context) {
          context.fillStyle = "#ffffff"
          context.fillRect(0, 0, canvas.width, canvas.height)
          context.drawImage(image, 0, 0, 1200, 520)
          
          const pngURL = canvas.toDataURL("image/png")
          
          const chartHeaders = isId 
            ? ["Periode", "Total Pemasukan", "Total Pengeluaran", "Selisih Bersih"]
            : ["Period", "Total Income", "Total Expense", "Net Flow"]

          const fmt = (num: number) => {
            return new Intl.NumberFormat(isId ? 'id-ID' : 'en-US', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(num)
          }

          const rows = displayCashFlow.map((d, idx) => {
            const periodLabel = isId ? d.date : d.dateEn
            const net = d.income - d.expense
            const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'
            return `
              <tr style="background-color: ${rowBg};">
                <td style="border: 1px solid #CBD5E1; padding: 10px; font-size: 10pt; font-weight: bold; color: #1E293B; font-family: Arial, sans-serif;">
                  ${periodLabel}
                </td>
                <td style="border: 1px solid #CBD5E1; padding: 10px; font-size: 10pt; text-align: right; color: #16A34A; font-weight: bold; font-family: Arial, sans-serif;">
                  ${fmt(d.income)}
                </td>
                <td style="border: 1px solid #CBD5E1; padding: 10px; font-size: 10pt; text-align: right; color: #DC2626; font-weight: bold; font-family: Arial, sans-serif;">
                  ${fmt(d.expense)}
                </td>
                <td style="border: 1px solid #CBD5E1; padding: 10px; font-size: 10pt; text-align: right; color: ${net >= 0 ? '#1D4ED8' : '#B91C1C'}; font-weight: bold; font-family: Arial, sans-serif;">
                  ${fmt(net)}
                </td>
              </tr>
            `
          }).join("")

          const html = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
              <meta charset="utf-8" />
              <!--[if gte mso 9]>
              <xml>
                <x:ExcelWorkbook>
                  <x:ExcelWorksheets>
                    <x:ExcelWorksheet>
                      <x:Name>Data Grafik Cashhero</x:Name>
                      <x:WorksheetOptions>
                        <x:DisplayGridlines />
                      </x:WorksheetOptions>
                    </x:ExcelWorksheet>
                  </x:ExcelWorksheets>
                </x:ExcelWorkbook>
              </xml>
              <![endif]-->
            </head>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
              <table style="border-collapse: collapse; width: 100%;">
                <colgroup>
                  <col width="200" />
                  <col width="180" />
                  <col width="180" />
                  <col width="180" />
                </colgroup>
                <tr>
                  <td colspan="4" style="background-color: #810B38; color: #FFFFFF; font-size: 14pt; font-weight: bold; text-align: center; padding: 12px;">
                    ${isId ? "RINGKASAN DATA GRAFIK CASSHERO" : "CASSHERO CHART DATA SUMMARY"}
                  </td>
                </tr>
                <tr>
                  <td colspan="4" style="font-size: 10pt; padding: 8px 0; color: #475569;">
                    <strong>${isId ? "Filter Periode" : "Period Filter"}:</strong> ${periodSubLabel}
                  </td>
                </tr>
                <!-- EMBEDDED DYNAMIC CHART IMAGE -->
                <tr>
                  <td colspan="4" style="text-align: center; padding: 20px 0; border: 1px solid #CBD5E1;">
                    <img src="${pngURL}" width="600" height="260" style="display: block; margin: 0 auto;" />
                  </td>
                </tr>
                <!-- EMPTY ROW -->
                <tr><td colspan="4" style="height: 20px;"></td></tr>
                <tr style="background-color: #1E293B;">
                  <th style="border: 1px solid #475569; color: #FFFFFF; padding: 10px; text-align: left;">${chartHeaders[0]}</th>
                  <th style="border: 1px solid #475569; color: #FFFFFF; padding: 10px; text-align: right;">${chartHeaders[1]}</th>
                  <th style="border: 1px solid #475569; color: #FFFFFF; padding: 10px; text-align: right;">${chartHeaders[2]}</th>
                  <th style="border: 1px solid #475569; color: #FFFFFF; padding: 10px; text-align: right;">${chartHeaders[3]}</th>
                </tr>
                ${rows}
              </table>
            </body>
            </html>
          `

          const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" })
          const downloadUrl = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = downloadUrl
          link.download = `Cashhero_Chart_Data_${new Date().toISOString().split('T')[0]}.xls`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
        URL.revokeObjectURL(blobURL)
      }
      image.src = blobURL
    }
  }

  // Chart data PDF report export
  const handleExportChartPDF = () => {
    if (svgRef.current) {
      const isId = language === 'id'
      const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement
      
      const styleBlock = document.createElement("style")
      styleBlock.textContent = `
        .stroke-border\\/40 { stroke: rgba(226, 232, 240, 0.45) !important; }
        .stroke-primary\\/50 { stroke: rgba(129, 11, 56, 0.5) !important; }
        .stroke-primary\\/60 { stroke: rgba(129, 11, 56, 0.6) !important; }
        .fill-muted-foreground { fill: #64748B !important; }
        text { font-family: 'Plus Jakarta Sans', Arial, sans-serif !important; font-weight: 600; }
      `
      svgClone.insertBefore(styleBlock, svgClone.firstChild)
      
      const svgString = new XMLSerializer().serializeToString(svgClone)
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" })
      const URL = window.URL || window.webkitURL || window
      const blobURL = URL.createObjectURL(svgBlob)
      
      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = 1200
        canvas.height = 520
        const context = canvas.getContext("2d")
        if (context) {
          context.fillStyle = "#ffffff"
          context.fillRect(0, 0, canvas.width, canvas.height)
          context.drawImage(image, 0, 0, 1200, 520)
          
          const pngURL = canvas.toDataURL("image/png")
          
          const fmt = (num: number) => {
            return new Intl.NumberFormat(isId ? 'id-ID' : 'en-US', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(num)
          }

          const chartModeLabels: Record<string, string> = {
            line: isId ? "Tren Garis Arus Kas" : "Line Cash Flow Trend",
            bar: isId ? "Batang Sisi-ke-Sisi" : "Side-by-Side Bar",
            stacked: isId ? "Batang Bertumpuk" : "Stacked Bar",
            netFlow: isId ? "Aliran Selisih Bersih" : "Net Savings Flow"
          }
          const chartModeLabel = chartModeLabels[chartMode] || chartMode

          const headers = isId 
            ? ["Periode", "Total Pemasukan", "Total Pengeluaran", "Selisih Bersih"]
            : ["Period", "Total Income", "Total Expense", "Net Flow"]

          const rowsHtml = displayCashFlow.map((d, idx) => {
            const periodLabel = isId ? d.date : d.dateEn
            const net = d.income - d.expense
            const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'
            return `
              <tr style="background-color: ${rowBg}; page-break-inside: avoid;">
                <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-size: 11px; font-weight: bold; color: #1E293B; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
                  ${periodLabel}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-size: 11px; text-align: right; color: #16A34A; font-weight: bold; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
                  ${fmt(d.income)}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-size: 11px; text-align: right; color: #DC2626; font-weight: bold; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
                  ${fmt(d.expense)}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-size: 11px; text-align: right; color: ${net >= 0 ? '#1D4ED8' : '#B91C1C'}; font-weight: bold; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
                  ${net >= 0 ? '+' : ''}${fmt(net)}
                </td>
              </tr>
            `
          }).join("")

          const printWindow = window.open("", "_blank")
          if (printWindow) {
            printWindow.document.write(`
              <html>
                <head>
                  <title>${isId ? "Ekspor Grafik Cashhero" : "Cashhero Chart Export"}</title>
                  <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
                    @page {
                      size: A4 portrait;
                      margin: 15mm;
                    }
                    body {
                      font-family: 'Plus Jakarta Sans', Arial, sans-serif;
                      color: #1E293B;
                      margin: 0;
                      padding: 0;
                      background: #FFFFFF;
                      -webkit-print-color-adjust: exact;
                      print-color-adjust: exact;
                    }
                    .header {
                      background-color: #810B38;
                      padding: 20px;
                      border-radius: 12px;
                      color: #FFFFFF;
                      margin-bottom: 20px;
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                    }
                    .title {
                      font-size: 16px;
                      font-weight: 800;
                      letter-spacing: -0.5px;
                      margin: 0;
                      text-transform: uppercase;
                    }
                    .brand {
                      font-size: 12px;
                      font-weight: 700;
                      opacity: 0.9;
                    }
                    .meta-info {
                      display: flex;
                      justify-content: space-between;
                      font-size: 11px;
                      color: #64748B;
                      padding-bottom: 10px;
                      border-bottom: 2px solid #F1F5F9;
                      margin-bottom: 20px;
                    }
                    .meta-info strong {
                      color: #1E293B;
                    }
                    .chart-container {
                      text-align: center;
                      margin-bottom: 30px;
                      border: 1px solid #E2E8F0;
                      border-radius: 12px;
                      padding: 15px;
                      background: #FFFFFF;
                      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                    }
                    .chart-image {
                      width: 100%;
                      max-width: 700px;
                      height: auto;
                      border-radius: 6px;
                    }
                    table {
                      width: 100%;
                      border-collapse: collapse;
                      margin-top: 10px;
                    }
                    th {
                      padding: 10px;
                      text-align: left;
                      background: #1E293B;
                      color: #FFFFFF;
                      font-weight: 700;
                      font-size: 10px;
                      text-transform: uppercase;
                      border-bottom: 3px solid #CBD5E1;
                    }
                    .th-right { text-align: right; }
                    .footer {
                      margin-top: 40px;
                      padding-top: 15px;
                      border-top: 1px solid #E2E8F0;
                      text-align: center;
                      font-size: 10px;
                      color: #64748B;
                    }
                  </style>
                </head>
                <body>
                  <div class="header">
                    <div class="title">${isId ? "LAPORAN GRAFIK KEUANGAN" : "FINANCIAL CHART REPORT"}</div>
                    <div class="brand">Cashhero</div>
                  </div>
                  <div class="meta-info">
                    <div>
                      <strong>${isId ? "Filter Periode" : "Period Filter"}:</strong> ${periodSubLabel} &bull; 
                      <strong>${isId ? "Mode Grafik" : "Chart Mode"}:</strong> ${chartModeLabel}
                    </div>
                    <div><strong>${isId ? "Tanggal Cetak" : "Print Date"}:</strong> ${new Date().toLocaleDateString(isId ? 'id-ID' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  </div>
                  <div class="chart-container">
                    <img src="${pngURL}" class="chart-image" />
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>${headers[0]}</th>
                        <th class="th-right">${headers[1]}</th>
                        <th class="th-right">${headers[2]}</th>
                        <th class="th-right">${headers[3]}</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${rowsHtml}
                    </tbody>
                  </table>
                  <div class="footer">
                    Generated by Cashhero Financial Manager
                  </div>
                  <script>
                    window.onload = function() {
                      setTimeout(function() {
                        window.print();
                        window.close();
                      }, 350);
                    }
                  </script>
                </body>
              </html>
            `);
            printWindow.document.close();
          }
        }
        URL.revokeObjectURL(blobURL);
      }
      image.src = blobURL;
    }
  }

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Dismiss tooltips and dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chartRef.current && !chartRef.current.contains(event.target as Node)) {
        setActiveLineIndex(null)
      }
      if (modalChartRef.current && !modalChartRef.current.contains(event.target as Node)) {
        setModalActiveIdx(null)
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsChartModeDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const t = (key: keyof typeof translations['id']) => {
    if (!mounted) return translations['id'][key]
    return translations[language]?.[key] || translations['id'][key]
  }

  // Category translation helpers
  const getCategoryEn = (cat: string) => {
    const map: Record<string, string> = {
      "Makanan": "Food",
      "Transport": "Transport",
      "Investasi": "Investment",
      "Tagihan": "Bills",
      "Hiburan": "Entertainment",
      "Belanja": "Shopping",
      "Lainnya": "Others",
      "Lain-lain": "Others"
    }
    return map[cat] || cat
  }

  const getCategoryId = (cat: string) => {
    const map: Record<string, string> = {
      "Food": "Makanan",
      "Transport": "Transport",
      "Investment": "Investasi",
      "Bills": "Tagihan",
      "Entertainment": "Hiburan",
      "Shopping": "Belanja",
      "Others": "Lainnya"
    }
    return map[cat] || cat
  }

  // Dynamic period sub-label
  const periodSubLabel = React.useMemo(() => {
    switch (filter) {
      case 'daily':
        return language === 'id' ? 'Hari ini' : 'Today'
      case 'weekly':
        return language === 'id' ? 'Minggu ini' : 'This week'
      case 'monthly':
        return language === 'id' ? 'Bulan ini' : 'This month'
      case 'quarterly':
        return language === 'id' ? 'Kuartal ini' : 'This quarter'
      case 'customPeriod':
        return language === 'id' ? 'Periode Terpilih' : 'Selected Period'
      default:
        return language === 'id' ? 'Total keseluruhan' : 'Overall total'
    }
  }, [filter, language])

  // Reactive date filtering matching Dashboard exactly
  const filteredTransactions = React.useMemo(() => {
    const today = new Date()
    return transactions.filter((tx) => {
      const txDate = new Date(tx.date)
      if (filter === 'daily') {
        return (
          txDate.getDate() === today.getDate() &&
          txDate.getMonth() === today.getMonth() &&
          txDate.getFullYear() === today.getFullYear()
        )
      }
      if (filter === 'weekly') {
        const day = today.getDay()
        const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Shift Monday to index 0
        const startOfWeek = new Date(today)
        startOfWeek.setDate(diff)
        startOfWeek.setHours(0, 0, 0, 0)
        
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 7)
        
        return txDate >= startOfWeek && txDate < endOfWeek
      }
      if (filter === 'monthly') {
        return (
          txDate.getMonth() === today.getMonth() &&
          txDate.getFullYear() === today.getFullYear()
        )
      }
      if (filter === 'quarterly') {
        const quarter = Math.floor(today.getMonth() / 3)
        const startMonth = quarter * 3
        return (
          txDate.getMonth() >= startMonth &&
          txDate.getMonth() < startMonth + 3 &&
          txDate.getFullYear() === today.getFullYear()
        )
      }
      if (filter === 'customPeriod') {
        const sDate = new Date(startDate)
        sDate.setHours(0, 0, 0, 0)
        const eDate = new Date(endDate)
        eDate.setHours(23, 59, 59, 999)
        return txDate >= sDate && txDate <= eDate
      }
      return true
    })
  }, [transactions, filter, startDate, endDate])

  // Calculate dynamic totals for the 3 premium metric cards - excluding Tabungan 'in' only (Tabungan 'out' reduces cash balance)
  const totalIn = React.useMemo(() => {
    return filteredTransactions.filter(t => t.type === 'in' && t.category !== 'Tabungan').reduce((acc, curr) => acc + curr.amount, 0)
  }, [filteredTransactions])

  const totalOut = React.useMemo(() => {
    return filteredTransactions.filter(t => t.type === 'out').reduce((acc, curr) => acc + curr.amount, 0)
  }, [filteredTransactions])

  const netFlow = totalIn - totalOut

  // 1. Calculate precise Time-Series Line Chart data from filtered transactions
  const displayCashFlow = React.useMemo((): CashFlowDataPoint[] => {
    if (filter === 'daily') {
      const hourlyIncome = Array(24).fill(0)
      const hourlyExpense = Array(24).fill(0)
      
      filteredTransactions.forEach((tx) => {
        const d = new Date(tx.date)
        const hr = d.getHours()
        if (tx.type === 'in') hourlyIncome[hr] += tx.amount
        else hourlyExpense[hr] += tx.amount
      })
      
      const pts: CashFlowDataPoint[] = []
      for (let h = 0; h < 24; h++) {
        const label = `${String(h).padStart(2, '0')}:00`
        pts.push({
          date: label,
          dateEn: label,
          income: hourlyIncome[h],
          expense: hourlyExpense[h]
        })
      }
      return pts
    }

    if (filter === 'weekly') {
      const daysId = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
      const daysEn = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      
      const dailyIncome = Array(7).fill(0)
      const dailyExpense = Array(7).fill(0)
      
      filteredTransactions.forEach((tx) => {
        const d = new Date(tx.date)
        let dayIdx = d.getDay()
        dayIdx = dayIdx === 0 ? 6 : dayIdx - 1 // Shift Monday to index 0, Sunday to 6
        if (tx.type === 'in') dailyIncome[dayIdx] += tx.amount
        else dailyExpense[dayIdx] += tx.amount
      })
      
      return daysId.map((dId, idx) => ({
        date: dId,
        dateEn: daysEn[idx],
        income: dailyIncome[idx],
        expense: dailyExpense[idx]
      }))
    }

    if (filter === 'monthly') {
      const today = new Date()
      const year = today.getFullYear()
      const month = today.getMonth()
      const totalDays = new Date(year, month + 1, 0).getDate()
      
      const dailyIncome = Array(totalDays).fill(0)
      const dailyExpense = Array(totalDays).fill(0)
      
      filteredTransactions.forEach((tx) => {
        const d = new Date(tx.date)
        if (d.getMonth() === month && d.getFullYear() === year) {
          const dayIdx = d.getDate() - 1
          if (tx.type === 'in') dailyIncome[dayIdx] += tx.amount
          else dailyExpense[dayIdx] += tx.amount
        }
      })
      
      const pts: CashFlowDataPoint[] = []
      const monthsId = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agt","Sep","Okt","Nov","Des"]
      const monthsEn = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
      const mLabelId = monthsId[month]
      const mLabelEn = monthsEn[month]
      
      for (let day = 1; day <= totalDays; day++) {
        pts.push({
          date: `${day} ${mLabelId}`,
          dateEn: `${mLabelEn} ${day}`,
          income: dailyIncome[day - 1],
          expense: dailyExpense[day - 1]
        })
      }
      return pts
    }

    if (filter === 'quarterly') {
      const today = new Date()
      const quarter = Math.floor(today.getMonth() / 3)
      const startMonth = quarter * 3
      
      const monthsId = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
      const monthsEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
      
      const monthlyIncome = Array(3).fill(0)
      const monthlyExpense = Array(3).fill(0)
      
      filteredTransactions.forEach((tx) => {
        const d = new Date(tx.date)
        const mIdx = d.getMonth()
        if (d.getFullYear() === today.getFullYear() && mIdx >= startMonth && mIdx < startMonth + 3) {
          const offset = mIdx - startMonth
          if (tx.type === 'in') monthlyIncome[offset] += tx.amount
          else monthlyExpense[offset] += tx.amount
        }
      })
      
      const pts: CashFlowDataPoint[] = []
      for (let idx = 0; idx < 3; idx++) {
        const actualMonth = startMonth + idx
        pts.push({
          date: monthsId[actualMonth],
          dateEn: monthsEn[actualMonth],
          income: monthlyIncome[idx],
          expense: monthlyExpense[idx]
        })
      }
      return pts
    }

    // Fallback: customPeriod or otherwise
    const grouped: Record<string, { income: number; expense: number; dateRaw: string }> = {}
    filteredTransactions.forEach((tx) => {
      const d = new Date(tx.date)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      if (!grouped[key]) grouped[key] = { income: 0, expense: 0, dateRaw: tx.date }
      if (tx.type === 'in') grouped[key].income += tx.amount
      else grouped[key].expense += tx.amount
    })
    const monthsId = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agt","Sep","Okt","Nov","Des"]
    const monthsEn = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    const sorted = Object.keys(grouped).sort()
    const pts: CashFlowDataPoint[] = sorted.map(k => {
      const v = grouped[k]; const d = new Date(v.dateRaw)
      const day = String(d.getDate()).padStart(2,'0')
      return {
        date: `${day} ${monthsId[d.getMonth()]}`,
        dateEn: `${monthsEn[d.getMonth()]} ${day}`,
        income: v.income, expense: v.expense
      }
    })
    if (pts.length === 1) {
      return [{ date: language === 'id' ? "Mulai" : "Start", dateEn: "Start", income: 0, expense: 0 }, ...pts]
    }
    return pts
  }, [filteredTransactions, filter, language])

  // 2. Calculate dynamic Donut Chart Top Expenses - excluding Tabungan transactions
  const expenses = React.useMemo(() => filteredTransactions.filter((t) => t.type === 'out' && t.category !== 'Tabungan'), [filteredTransactions])
  const totalSpent = React.useMemo(() => expenses.reduce((acc, curr) => acc + curr.amount, 0), [expenses])

  const donutData = React.useMemo((): DonutDataPoint[] => {
    const expensesByCategory = expenses.reduce((acc, t) => {
      const cat = t.category.trim()
      acc[cat] = (acc[cat] || 0) + t.amount
      return acc
    }, {} as Record<string, number>)

    const categoryList = Object.entries(expensesByCategory).map(([category, amount]) => ({
      category,
      amount
    })).sort((a, b) => b.amount - a.amount)

    const donutColors = [
      "#810B38", // Burgundy (primary)
      "#F59E0B", // Amber
      "#3B82F6", // Blue
      "#8B5CF6", // Purple
      "#10B981", // Green
      "#EC4899", // Pink
      "#06B6D4", // Cyan
    ]

    const finalCategories: { category: string; categoryEn: string; amount: number }[] = []
    if (categoryList.length > 5) {
      const top4 = categoryList.slice(0, 4)
      const rest = categoryList.slice(4)
      const restAmount = rest.reduce((sum, item) => sum + item.amount, 0)
      
      top4.forEach((item) => {
        finalCategories.push({
          category: item.category,
          categoryEn: item.category,
          amount: item.amount
        })
      })
      
      finalCategories.push({
        category: "Lainnya",
        categoryEn: "Others",
        amount: restAmount
      })
    } else {
      categoryList.forEach((item) => {
        finalCategories.push({
          category: item.category,
          categoryEn: item.category,
          amount: item.amount
        })
      })
    }

    return finalCategories.map((item, idx) => {
      const percentage = totalSpent > 0 ? Math.round((item.amount / totalSpent) * 100) : 0
      const categoryId = getCategoryId(item.category)
      const categoryEn = getCategoryEn(item.category)
      return {
        category: categoryId,
        categoryEn: categoryEn,
        amount: item.amount,
        color: donutColors[idx % donutColors.length],
        percentage
      }
    })
  }, [expenses, totalSpent])

  // Math for Line Chart SVG
  const svgWidth = 600
  const svgHeight = 260
  const paddingX = 50
  const paddingY = 30
  const chartWidth = svgWidth - paddingX * 2
  const chartHeight = svgHeight - paddingY * 2

  const maxTransValue = React.useMemo(() => {
    if (chartMode === 'stacked') {
      return displayCashFlow.reduce((max, d) => Math.max(max, d.income + d.expense), 0)
    }
    return displayCashFlow.reduce((max, d) => Math.max(max, d.income, d.expense), 0)
  }, [displayCashFlow, chartMode])

  const maxVal = maxTransValue > 0 ? maxTransValue * 1.15 : 1000000

  // Net flow specific values
  const netFlowData = React.useMemo(() => {
    const values = displayCashFlow.map(d => d.income - d.expense)
    const maxNet = Math.max(...values, 1)
    const minNet = Math.min(...values, -1)
    const absMax = Math.max(Math.abs(maxNet), Math.abs(minNet))
    return {
      values,
      scaleMax: absMax * 1.15,
      yZero: paddingY + chartHeight / 2
    }
  }, [displayCashFlow, paddingY, chartHeight])

  const getCoordinates = (index: number, val: number) => {
    const x = paddingX + (index / Math.max(1, displayCashFlow.length - 1)) * chartWidth
    const y = paddingY + chartHeight - (val / maxVal) * chartHeight
    return { x, y }
  }

  const incomePoints = displayCashFlow.map((d, i) => getCoordinates(i, d.income))
  const expensePoints = displayCashFlow.map((d, i) => getCoordinates(i, d.expense))

  const createLinePath = (points: { x: number; y: number }[]) => {
    return points.reduce((path, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`
    }, "")
  }

  const createAreaPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return ""
    const linePath = createLinePath(points)
    const firstX = points[0].x
    const lastX = points[points.length - 1].x
    const baseY = paddingY + chartHeight
    return `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`
  }

  const incomePath = createLinePath(incomePoints)
  const expensePath = createLinePath(expensePoints)
  const incomeArea = createAreaPath(incomePoints)
  const expenseArea = createAreaPath(expensePoints)

  // Donut chart math
  const donutRadius = 50
  const strokeWidth = 14
  const circumference = 2 * Math.PI * donutRadius
  let currentOffset = 0

  // Dynamic tooltip height based on active mode
  const activeMinY = React.useMemo(() => {
    if (activeLineIndex === null || !displayCashFlow[activeLineIndex]) return 0
    const d = displayCashFlow[activeLineIndex]
    if (chartMode === 'stacked') {
      const totalHeight = ((d.income + d.expense) / maxVal) * chartHeight
      return paddingY + chartHeight - totalHeight
    }
    if (chartMode === 'netFlow') {
      const netVal = d.income - d.expense
      const yVal = netFlowData.yZero - (netVal / netFlowData.scaleMax) * (chartHeight / 2)
      return Math.min(yVal, netFlowData.yZero)
    }
    // line or bar
    const incY = paddingY + chartHeight - (d.income / maxVal) * chartHeight
    const expY = paddingY + chartHeight - (d.expense / maxVal) * chartHeight
    return Math.min(incY, expY)
  }, [activeLineIndex, displayCashFlow, chartMode, maxVal, chartHeight, paddingY, netFlowData])

  // Dynamic tooltip positioning
  const tooltipTransform = React.useMemo(() => {
    if (activeLineIndex === null || !displayCashFlow[activeLineIndex] || !incomePoints[activeLineIndex] || !expensePoints[activeLineIndex]) return { x: 0, y: 0 }
    const isFirst = activeLineIndex === 0
    const isLast = activeLineIndex === displayCashFlow.length - 1
    const showBelow = activeMinY < 70

    let xVal: string | number = "-50%"
    const yVal: string | number = showBelow ? "15px" : "-115%"

    if (isLast || isFirst) {
      xVal = "0%"
    }

    return { x: xVal, y: yVal }
  }, [activeLineIndex, displayCashFlow, incomePoints, expensePoints, activeMinY])

  const tooltipStyle = React.useMemo((): React.CSSProperties => {
    if (activeLineIndex === null || !displayCashFlow[activeLineIndex] || !incomePoints[activeLineIndex] || !expensePoints[activeLineIndex]) return {}
    
    const xPos = (incomePoints[activeLineIndex].x / svgWidth) * 100
    const isFirst = activeLineIndex === 0
    const isLast = activeLineIndex === displayCashFlow.length - 1
    
    const yPct = (activeMinY / svgHeight) * 100
    
    if (isLast) {
      return {
        right: "8px",
        left: "auto",
        top: `${yPct}%`
      }
    }
    
    if (isFirst) {
      return {
        left: "8px",
        top: `${yPct}%`
      }
    }
    
    return {
      left: `${xPos}%`,
      top: `${yPct}%`
    }
  }, [activeLineIndex, displayCashFlow, incomePoints, expensePoints, svgWidth, svgHeight, activeMinY])

  // ────────────────────────────────────────────────────────────────────────────
  // QUARTERLY DETAIL MODAL MATHS
  // ────────────────────────────────────────────────────────────────────────────
  const monthTransactions = React.useMemo(() => {
    if (!selectedMonthDetail) return []
    const year = new Date().getFullYear()
    return transactions.filter((tx) => {
      const d = new Date(tx.date)
      return d.getMonth() === selectedMonthDetail.monthIndex && d.getFullYear() === year
    })
  }, [transactions, selectedMonthDetail])

  const monthIn = React.useMemo(() => {
    return monthTransactions.filter(t => t.type === 'in' && t.category !== 'Tabungan').reduce((acc, curr) => acc + curr.amount, 0)
  }, [monthTransactions])

  const monthOut = React.useMemo(() => {
    return monthTransactions.filter(t => t.type === 'out').reduce((acc, curr) => acc + curr.amount, 0)
  }, [monthTransactions])

  const monthNet = monthIn - monthOut

  const monthDailyFlow = React.useMemo((): CashFlowDataPoint[] => {
    if (!selectedMonthDetail) return []
    const year = new Date().getFullYear()
    const totalDays = new Date(year, selectedMonthDetail.monthIndex + 1, 0).getDate()
    
    const dailyIncome = Array(totalDays).fill(0)
    const dailyExpense = Array(totalDays).fill(0)
    
    monthTransactions.forEach((tx) => {
      const d = new Date(tx.date)
      const dayIdx = d.getDate() - 1
      if (tx.type === 'in') dailyIncome[dayIdx] += tx.amount
      else dailyExpense[dayIdx] += tx.amount
    })
    
    const pts: CashFlowDataPoint[] = []
    const mLabelId = selectedMonthDetail.monthNameId.substring(0, 3)
    const mLabelEn = selectedMonthDetail.monthNameEn.substring(0, 3)
    
    for (let day = 1; day <= totalDays; day++) {
      pts.push({
        date: `${day} ${mLabelId}`,
        dateEn: `${mLabelEn} ${day}`,
        income: dailyIncome[day - 1],
        expense: dailyExpense[day - 1]
      })
    }
    return pts
  }, [monthTransactions, selectedMonthDetail])

  // Math for Modal Line Chart SVG
  const modalMaxTransValue = monthDailyFlow.reduce((max, d) => Math.max(max, d.income, d.expense), 0)
  const modalMaxVal = modalMaxTransValue > 0 ? modalMaxTransValue * 1.15 : 1000000

  const getModalCoordinates = (index: number, val: number) => {
    const x = paddingX + (index / Math.max(1, monthDailyFlow.length - 1)) * chartWidth
    const y = paddingY + chartHeight - (val / modalMaxVal) * chartHeight
    return { x, y }
  }

  const modalIncPts = monthDailyFlow.map((d, i) => getModalCoordinates(i, d.income))
  const modalExpPts = monthDailyFlow.map((d, i) => getModalCoordinates(i, d.expense))

  const modalIncPath = createLinePath(modalIncPts)
  const modalExpPath = createLinePath(modalExpPts)
  const modalIncArea = createAreaPath(modalIncPts)
  const modalExpArea = createAreaPath(modalExpPts)

  const modalTooltipTransform = React.useMemo(() => {
    if (modalActiveIdx === null || !monthDailyFlow[modalActiveIdx] || !modalIncPts[modalActiveIdx] || !modalExpPts[modalActiveIdx]) return { x: 0, y: 0 }
    const isFirst = modalActiveIdx === 0
    const isLast = modalActiveIdx === monthDailyFlow.length - 1
    const minY = Math.min(modalIncPts[modalActiveIdx].y, modalExpPts[modalActiveIdx].y)
    const showBelow = minY < 70

    let xVal: string | number = "-50%"
    const yVal: string | number = showBelow ? "15px" : "-115%"

    if (isLast || isFirst) {
      xVal = "0%"
    }

    return { x: xVal, y: yVal }
  }, [modalActiveIdx, monthDailyFlow, modalIncPts, modalExpPts])

  const modalTooltipStyle = React.useMemo((): React.CSSProperties => {
    if (modalActiveIdx === null || !monthDailyFlow[modalActiveIdx] || !modalIncPts[modalActiveIdx] || !modalExpPts[modalActiveIdx]) return {}
    
    const xPos = (modalIncPts[modalActiveIdx].x / svgWidth) * 100
    const isFirst = modalActiveIdx === 0
    const isLast = modalActiveIdx === monthDailyFlow.length - 1
    
    const minY = Math.min(modalIncPts[modalActiveIdx].y, modalExpPts[modalActiveIdx].y)
    const yPct = (minY / svgHeight) * 100
    
    if (isLast) {
      return {
        right: "8px",
        left: "auto",
        top: `${yPct}%`
      }
    }
    
    if (isFirst) {
      return {
        left: "8px",
        top: `${yPct}%`
      }
    }
    
    return {
      left: `${xPos}%`,
      top: `${yPct}%`
    }
  }, [modalActiveIdx, monthDailyFlow, modalIncPts, modalExpPts, svgWidth, svgHeight])

  return (
    <motion.div
      className="flex flex-col gap-8 pb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Title Header with Export Buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{t('statistics')}</h1>
          <p className="text-muted-foreground">{t('statisticsSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center no-print">
          <button
            onClick={() => {
              exportToExcel(
                filteredTransactions,
                periodSubLabel,
                { income: totalIn, expense: totalOut, balance: netFlow },
                language
              )
            }}
            className="px-4 py-2.5 bg-muted/40 hover:bg-muted/70 text-foreground border border-border font-semibold text-sm rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer duration-200"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span>{language === 'id' ? "Ekspor Excel" : "Export Excel"}</span>
          </button>
          <button
            onClick={() => {
              exportToPDF(
                filteredTransactions,
                periodSubLabel,
                { income: totalIn, expense: totalOut, balance: netFlow },
                language
              )
            }}
            className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer duration-200"
          >
            <FileText className="w-4 h-4" />
            <span>{language === 'id' ? "Ekspor PDF" : "Export PDF"}</span>
          </button>
        </div>
      </div>

      {/* FILTER CONTROL BAR */}
      <div className="flex flex-col gap-4 bg-card border border-border p-4 rounded-xl shadow-sm no-print">
        {/* TAMPILAN DESKTOP (Horizontal Buttons & Inline Date) */}
        <div className="hidden md:flex flex-row items-center gap-1.5 flex-nowrap overflow-x-auto scrollbar-none w-full max-w-full py-1">
          <span className="text-xs font-semibold text-muted-foreground mr-1.5 flex items-center gap-1 uppercase tracking-wider shrink-0 select-none">
            <Filter className="w-3.5 h-3.5" />
            {t('filterPeriod')}:
          </span>
          
          <div className="flex items-center gap-1.5 shrink-0">
            {(['daily', 'weekly', 'monthly', 'quarterly', 'customPeriod'] as const).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setFilter(p)
                  setActiveLineIndex(null)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 ${
                  filter === p
                    ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-transparent hover:border-border"
                }`}
              >
                {t(p)}
              </button>
            ))}
          </div>

          {filter === 'customPeriod' && (
            <div className="flex flex-row items-center gap-3 shrink-0 animate-in fade-in slide-in-from-left-1 duration-200 border-l border-border/60 dark:border-zinc-700/60 pl-3.5 ml-2 font-number">
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase whitespace-nowrap">{t('startDate')}:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-muted/30 dark:bg-zinc-800/30 border border-border dark:border-zinc-700/80 rounded-lg px-2.5 py-1 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary shrink-0"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase whitespace-nowrap">{t('endDate')}:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-muted/30 dark:bg-zinc-800/30 border border-border dark:border-zinc-700/80 rounded-lg px-2.5 py-1 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary shrink-0"
                />
              </div>
            </div>
          )}
        </div>

        {/* TAMPILAN MOBILE (Dropdown & Bottom Row Date) */}
        <div className="flex md:hidden flex-col gap-3.5 w-full">
          <div className="flex items-center justify-between gap-3 w-full relative">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider select-none">
              <Filter className="w-4 h-4" />
              {t('filterPeriod')}
            </span>
            
            {/* Interactive Custom Dropdown */}
            <div className="relative flex-1 max-w-[200px]">
              <button
                onClick={() => setIsMobileFilterDropdownOpen(!isMobileFilterDropdownOpen)}
                className="w-full px-3.5 py-2 bg-muted/40 hover:bg-muted/70 text-foreground border border-border/80 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-between gap-2 shadow-sm active:scale-95"
              >
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
                    {(['daily', 'weekly', 'monthly', 'quarterly', 'customPeriod'] as const).map((p) => {
                      const isActive = filter === p
                      return (
                        <button
                          key={p}
                          onClick={() => {
                            setFilter(p)
                            setActiveLineIndex(null)
                            setIsMobileFilterDropdownOpen(false)
                          }}
                          className={`w-full px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-2 ${
                            isActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                          }`}
                        >
                          <span>{t(p)}</span>
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {filter === 'customPeriod' && (
            <div className="flex flex-row items-center justify-between gap-3 w-full animate-in fade-in slide-in-from-top-1 duration-200 bg-muted/20 border border-border/60 dark:border-zinc-700/60 p-3 rounded-xl font-number">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase whitespace-nowrap">{t('startDate')}:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-background border border-border dark:border-zinc-700/80 rounded-lg px-2 py-1.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full"
                />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase whitespace-nowrap">{t('endDate')}:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-background border border-border dark:border-zinc-700/80 rounded-lg px-2 py-1.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3 PREMIUM SUMMARY METRIC CARDS */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Pemasukan Card */}
        <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('income')}
            </CardTitle>
            <div className="p-2 bg-green-500/10 rounded-full">
              <ArrowDown className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {mounted ? formatCurrency(totalIn, language) : "Rp 0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{periodSubLabel}</p>
          </CardContent>
        </Card>

        {/* Pengeluaran Card */}
        <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('expense')}
            </CardTitle>
            <div className="p-2 bg-destructive/10 rounded-full">
              <ArrowUp className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {mounted ? formatCurrency(totalOut, language) : "Rp 0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{periodSubLabel}</p>
          </CardContent>
        </Card>

        {/* Selisih Arus Kas Card */}
        <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'id' ? "Selisih Arus Kas" : "Net Flow"}
            </CardTitle>
            <div className={`p-2 rounded-full ${netFlow >= 0 ? 'bg-blue-500/10' : 'bg-amber-500/10'}`}>
              <TrendingUp className={`h-4 w-4 ${netFlow >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {mounted ? (netFlow >= 0 ? "+" : "") + formatCurrency(netFlow, language) : "Rp 0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{periodSubLabel}</p>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS ROW */}
      <div className="grid gap-6 lg:grid-cols-7">
        
        {/* LINE CHART: Cash Flow Trend */}
        <Card 
          ref={chartRef} 
          className={`lg:col-span-4 bg-card border-border shadow-sm flex flex-col justify-between relative transition-all duration-300 overflow-visible ${
            activeLineIndex !== null ? 'z-40' : 'z-10 hover:z-20'
          }`}
        >
          <CardHeader className="flex flex-col gap-4 border-b border-border/50 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-foreground text-lg font-bold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  {t('cashFlowTrend')}
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  {filter === 'quarterly' 
                    ? (language === 'id' 
                        ? "Klik titik bulan untuk melihat rincian tren harian & daftar transaksi!" 
                        : "Click month points to open daily detailed trends & transaction lists!")
                    : (language === 'id' 
                        ? "Uraian tren pemasukan dan pengeluaran Anda pada periode terpilih." 
                        : "Income vs expense breakdown trends for the selected period.")}
                </CardDescription>
              </div>
              
              {/* Chart Actions: Exports */}
              <div className="flex items-center gap-1.5 self-start md:self-center bg-muted/30 p-1 rounded-lg border border-border/50 no-print">
                <button
                  onClick={handleExportChartExcel}
                  className="p-2 hover:bg-muted/70 text-green-600 dark:text-green-400 rounded-md transition-all cursor-pointer hover:scale-105"
                  title={language === 'id' ? "Ekspor Data ke Excel" : "Export Data to Excel"}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
                <button
                  onClick={handleExportChartPDF}
                  className="p-2 hover:bg-muted/70 text-red-600 dark:text-red-400 rounded-md transition-all cursor-pointer hover:scale-105"
                  title={language === 'id' ? "Ekspor PDF Laporan Grafik" : "Export Chart PDF Report"}
                >
                  <FileText className="w-4 h-4" />
                </button>
                <button
                  onClick={handleExportChartImage}
                  className="p-2 hover:bg-muted/70 text-blue-600 dark:text-blue-400 rounded-md transition-all cursor-pointer hover:scale-105"
                  title={language === 'id' ? "Unduh Gambar Grafik" : "Download Chart Image"}
                >
                  <FileImage className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Row 2: Mode Selector and Legend */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-border/30">
              {/* Dropdown Chart Selector */}
              <div className="relative no-print" ref={dropdownRef}>
                <button
                  onClick={() => setIsChartModeDropdownOpen(!isChartModeDropdownOpen)}
                  className="px-3.5 py-2 bg-muted/40 hover:bg-muted/70 text-foreground border border-border/80 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-sm hover:shadow active:scale-95"
                >
                  {/* Current Active Mode Icon and Text */}
                  {(() => {
                    const CurrentIcon = {
                      line: LineChart,
                      bar: BarChart3,
                      stacked: AreaChart,
                      netFlow: TrendingUp
                    }[chartMode]
                    
                    const currentLabel = {
                      line: language === 'id' ? "Garis" : "Line",
                      bar: language === 'id' ? "Batang Komparasi" : "Side-by-Side Bar",
                      stacked: language === 'id' ? "Batang Akumulasi" : "Stacked Bar",
                      netFlow: language === 'id' ? "Arus Bersih" : "Net Savings Flow"
                    }[chartMode]

                    return (
                      <>
                        <CurrentIcon className="w-4 h-4 text-primary" />
                        <span>{currentLabel}</span>
                      </>
                    )
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
                        const modeLabel = {
                          line: language === 'id' ? "Tren Garis" : "Line Trend",
                          bar: language === 'id' ? "Batang Komparasi" : "Compare Bar",
                          stacked: language === 'id' ? "Batang Akumulasi" : "Stacked Bar",
                          netFlow: language === 'id' ? "Arus Bersih" : "Net Flow"
                        }[m]
                        const Icon = {
                          line: LineChart,
                          bar: BarChart3,
                          stacked: AreaChart,
                          netFlow: TrendingUp
                        }[m]

                        return (
                          <button
                            key={m}
                            onClick={() => {
                              setChartMode(m)
                              setActiveLineIndex(null)
                              setIsChartModeDropdownOpen(false)
                            }}
                            className={`w-full px-3 py-2 rounded-lg text-left text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-2 ${
                              isActive
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{modeLabel}</span>
                          </button>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[11px] font-bold text-foreground">
                {chartMode === 'netFlow' ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-green-500" />
                    <span>{language === 'id' ? "Surplus Bersih" : "Net Surplus"}</span>
                    <span className="w-3 h-3 rounded-md bg-primary" />
                    <span>{language === 'id' ? "Defisit Bersih" : "Net Deficit"}</span>
                  </span>
                ) : (
                  <>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-green-500" />
                      {t('income')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-primary" />
                      {t('expense')}
                    </span>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-4 flex-1 flex flex-col justify-center relative select-none">
            {displayCashFlow.length === 0 ? (
              <div className="h-[260px] w-full rounded-md border border-dashed border-border/60 bg-muted/5 flex flex-col items-center justify-center gap-3.5 p-6 text-center">
                <div className="p-3 bg-primary/10 rounded-full">
                  <BarChart3 className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <div>
                  <p className="text-foreground font-bold text-sm">
                    {language === 'id' ? "Arus Kas Kosong" : "No Cash Flow Data"}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs mt-1.5 leading-relaxed">
                    {language === 'id'
                      ? "Belum ada riwayat arus kas. Catat transaksi baru di Dashboard untuk mulai menganalisis tren."
                      : "No cash flow records. Record new transactions on the Dashboard to start analyzing trends."}
                  </p>
                </div>
              </div>
            ) : (
              /* SVG Line Chart */
              <div className="w-full relative overflow-visible">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible" ref={svgRef}>
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

                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
                    const y = paddingY + r * chartHeight
                    return (
                      <line 
                        key={idx} 
                        x1={paddingX} 
                        y1={y} 
                        x2={svgWidth - paddingX} 
                        y2={y} 
                        className="stroke-border/40" 
                        strokeDasharray="4 4" 
                      />
                    )
                  })}

                  {/* --- MODE: LINE --- */}
                  {chartMode === 'line' && (
                    <>
                      {/* Area fills */}
                      <path d={incomeArea} fill="url(#incomeGrad)" className="transition-all duration-300" />
                      <path d={expenseArea} fill="url(#expenseGrad)" className="transition-all duration-300" />

                      {/* Lines */}
                      <path d={incomePath} fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" className="transition-all duration-300" />
                      <path d={expensePath} fill="none" stroke="#810B38" strokeWidth="3" strokeLinecap="round" className="transition-all duration-300" />
                    </>
                  )}

                  {/* --- MODE: BAR --- */}
                  {chartMode === 'bar' && (
                    <g className="transition-all duration-300">
                      {displayCashFlow.map((d, i) => {
                        const xCenter = paddingX + (i / Math.max(1, displayCashFlow.length - 1)) * chartWidth
                        const barWidth = Math.max(4, Math.min(14, chartWidth / (displayCashFlow.length * 3.5)))
                        const gap = 1.5
                        
                        const incHeight = (d.income / maxVal) * chartHeight
                        const incY = paddingY + chartHeight - incHeight
                        
                        const expHeight = (d.expense / maxVal) * chartHeight
                        const expY = paddingY + chartHeight - expHeight
                        
                        const isActive = activeLineIndex === i

                        return (
                          <g key={i} className="transition-all duration-200">
                            {/* Income Bar */}
                            <rect
                              x={xCenter - barWidth - gap}
                              y={incY}
                              width={barWidth}
                              height={Math.max(1, incHeight)}
                              fill="#10B981"
                              rx="2"
                              opacity={isActive ? 1 : activeLineIndex !== null ? 0.45 : 0.85}
                              className="transition-all duration-200"
                            />
                            {/* Expense Bar */}
                            <rect
                              x={xCenter + gap}
                              y={expY}
                              width={barWidth}
                              height={Math.max(1, expHeight)}
                              fill="#810B38"
                              rx="2"
                              opacity={isActive ? 1 : activeLineIndex !== null ? 0.45 : 0.85}
                              className="transition-all duration-200"
                            />
                          </g>
                        )
                      })}
                    </g>
                  )}

                  {/* --- MODE: STACKED --- */}
                  {chartMode === 'stacked' && (
                    <g className="transition-all duration-300">
                      {displayCashFlow.map((d, i) => {
                        const xCenter = paddingX + (i / Math.max(1, displayCashFlow.length - 1)) * chartWidth
                        const barWidth = Math.max(6, Math.min(20, chartWidth / (displayCashFlow.length * 2.2)))
                        
                        const incHeight = (d.income / maxVal) * chartHeight
                        const incY = paddingY + chartHeight - incHeight
                        
                        const expHeight = (d.expense / maxVal) * chartHeight
                        const expY = incY - expHeight
                        
                        const isActive = activeLineIndex === i

                        return (
                          <g key={i} className="transition-all duration-200">
                            {/* Income Bar (Bottom) */}
                            <rect
                              x={xCenter - barWidth/2}
                              y={incY}
                              width={barWidth}
                              height={Math.max(1, incHeight)}
                              fill="#10B981"
                              rx={d.expense === 0 ? "3" : "0"}
                              opacity={isActive ? 1 : activeLineIndex !== null ? 0.45 : 0.85}
                              className="transition-all duration-200"
                            />
                            {/* Expense Bar (Top) */}
                            <rect
                              x={xCenter - barWidth/2}
                              y={expY}
                              width={barWidth}
                              height={Math.max(1, expHeight)}
                              fill="#810B38"
                              rx={d.income === 0 ? "3" : "0"}
                              opacity={isActive ? 1 : activeLineIndex !== null ? 0.45 : 0.85}
                              className="transition-all duration-200"
                            />
                          </g>
                        )
                      })}
                    </g>
                  )}

                  {/* --- MODE: NET FLOW --- */}
                  {chartMode === 'netFlow' && (
                    <g className="transition-all duration-300">
                      {/* Zero Reference Line */}
                      <line
                        x1={paddingX}
                        y1={netFlowData.yZero}
                        x2={svgWidth - paddingX}
                        y2={netFlowData.yZero}
                        stroke="#64748B"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                        opacity="0.8"
                      />
                      
                      {/* Zero label */}
                      <text
                        x={paddingX - 10}
                        y={netFlowData.yZero + 4}
                        textAnchor="end"
                        className="fill-muted-foreground font-bold text-[9px]"
                      >
                        0
                      </text>

                      {displayCashFlow.map((d, i) => {
                        const xCenter = paddingX + (i / Math.max(1, displayCashFlow.length - 1)) * chartWidth
                        const barWidth = Math.max(6, Math.min(22, chartWidth / (displayCashFlow.length * 2)))
                        
                        const netVal = d.income - d.expense
                        const yVal = netFlowData.yZero - (netVal / netFlowData.scaleMax) * (chartHeight / 2)
                        
                        const isPositive = netVal >= 0
                        const yPos = isPositive ? yVal : netFlowData.yZero
                        const barHeight = Math.max(2, Math.abs(netFlowData.yZero - yVal))
                        
                        const isActive = activeLineIndex === i

                        return (
                          <g key={i} className="transition-all duration-200">
                            <rect
                              x={xCenter - barWidth/2}
                              y={yPos}
                              width={barWidth}
                              height={barHeight}
                              fill={isPositive ? "#10B981" : "#810B38"}
                              rx="3"
                              opacity={isActive ? 1 : activeLineIndex !== null ? 0.45 : 0.85}
                              className="transition-all duration-200"
                            />
                          </g>
                        )
                      })}
                    </g>
                  )}

                  {/* Dotted indicator line on hover */}
                  {activeLineIndex !== null && activeLineIndex < incomePoints.length && (
                    <line
                      x1={incomePoints[activeLineIndex].x}
                      y1={paddingY}
                      x2={incomePoints[activeLineIndex].x}
                      y2={paddingY + chartHeight}
                      className="stroke-primary/50"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* Active Dots on Hover (Only in line mode) */}
                  {chartMode === 'line' && displayCashFlow.map((d, i) => {
                    const incP = incomePoints[i]
                    const expP = expensePoints[i]
                    const isActive = activeLineIndex === i

                    if (!incP || !expP) return null

                    return (
                      <g key={i} className="cursor-pointer">
                        <circle
                          cx={incP.x}
                          cy={incP.y}
                          r={isActive ? 7 : 4}
                          fill="#10B981"
                          className="transition-all duration-200"
                          stroke="#FFF"
                          strokeWidth={isActive ? 2 : 1}
                        />
                        <circle
                          cx={expP.x}
                          cy={expP.y}
                          r={isActive ? 7 : 4}
                          fill="#810B38"
                          className="transition-all duration-200"
                          stroke="#FFF"
                          strokeWidth={isActive ? 2 : 1}
                        />
                      </g>
                    )
                  })}

                  {/* X Axis Labels */}
                  {displayCashFlow.map((d, i) => {
                    const p = incomePoints[i]
                    if (!p) return null

                    // Thin labels dynamically to avoid collision on mobile/tablets
                    if (filter === 'daily' && i % 4 !== 0 && i !== 23) return null
                    if (filter === 'monthly' && (i + 1) % 5 !== 0 && i !== 0 && i !== displayCashFlow.length - 1) return null

                    const label = language === 'id' ? d.date : d.dateEn
                    return (
                      <text
                        key={i}
                        x={p.x}
                        y={svgHeight - 10}
                        textAnchor="middle"
                        className="fill-muted-foreground font-semibold text-[10px] uppercase tracking-wider"
                      >
                        {label}
                      </text>
                    )
                  })}

                  {/* Invisible hover & click rect zones */}
                  {displayCashFlow.map((d, i) => {
                    const width = chartWidth / Math.max(1, displayCashFlow.length - 1)
                    const x = paddingX + i * width - width / 2
                    return (
                      <rect
                        key={i}
                        x={x}
                        y={paddingY}
                        width={width}
                        height={chartHeight}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setActiveLineIndex(i)}
                        onMouseLeave={() => setActiveLineIndex(null)}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (filter === 'quarterly') {
                            const today = new Date()
                            const quarter = Math.floor(today.getMonth() / 3)
                            const startMonth = quarter * 3
                            const actualMonth = startMonth + i
                            
                            const monthsId = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
                            const monthsEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
                            
                            setSelectedMonthDetail({
                              monthIndex: actualMonth,
                              monthNameId: monthsId[actualMonth],
                              monthNameEn: monthsEn[actualMonth]
                            })
                            setModalActiveIdx(null)
                          } else {
                            setActiveLineIndex(i === activeLineIndex ? null : i)
                          }
                        }}
                      />
                    )
                  })}
                </svg>

                {/* Tooltip Overlay */}
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
                          <span>{t('income')}:</span>
                          <span>{formatCurrency(displayCashFlow[activeLineIndex].income, language)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-6 text-primary">
                          <span>{t('expense')}:</span>
                          <span>{formatCurrency(displayCashFlow[activeLineIndex].expense, language)}</span>
                        </div>
                        
                        {/* Net Flow / Selisih Bersih in Tooltip */}
                        <div className={`flex items-center justify-between gap-6 border-t border-border/40 pt-1 mt-1 font-bold ${
                          (displayCashFlow[activeLineIndex].income - displayCashFlow[activeLineIndex].expense) >= 0 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          <span>{language === 'id' ? "Selisih:" : "Net:"}</span>
                          <span>
                            {((displayCashFlow[activeLineIndex].income - displayCashFlow[activeLineIndex].expense) >= 0 ? "+" : "") + 
                             formatCurrency(displayCashFlow[activeLineIndex].income - displayCashFlow[activeLineIndex].expense, language)}
                          </span>
                        </div>

                        {filter === 'quarterly' && (
                          <div className="text-[9px] text-primary/80 dark:text-rose-400 font-bold border-t border-border/40 dark:border-zinc-700/60 pt-1 mt-1 flex items-center gap-1 animate-pulse">
                            <TrendingUp className="w-2.5 h-2.5 text-primary dark:text-rose-400" />
                            <span>{language === 'id' ? "Klik untuk rincian harian" : "Click for daily details"}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>

        {/* DONUT CHART: Top Expenses */}
        <Card className="lg:col-span-3 bg-card border-border shadow-sm flex flex-col justify-between relative z-10 hover:z-20 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-foreground text-lg font-bold flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              {t('topExpenses')}
            </CardTitle>
            <CardDescription className="text-xs">
              {language === 'id' 
                ? "Pembagian pengeluaran teratas berdasarkan kategori." 
                : "Top expenses breakdown mapped dynamically by category."}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-2 flex-1 flex flex-col items-center justify-center gap-6">
            {totalSpent === 0 || donutData.length === 0 ? (
              <div className="h-[320px] w-full rounded-md border border-dashed border-border/60 bg-muted/5 flex flex-col items-center justify-center gap-3.5 p-6 text-center">
                <div className="p-3 bg-primary/10 rounded-full">
                  <PieChart className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <div>
                  <p className="text-foreground font-bold text-sm">
                    {language === 'id' ? "Belum Ada Pengeluaran" : "No Expenses Yet"}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs mt-1.5 leading-relaxed">
                    {language === 'id'
                      ? "Setiap pengeluaran Anda akan otomatis dianalisis dan dikelompokkan secara visual di sini."
                      : "All your expense transactions will be automatically analyzed and categorized visually here."}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="relative w-44 h-44 shrink-0 flex items-center justify-center select-none">
                  <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90 overflow-visible">
                    {donutData.map((d, i) => {
                      const isHovered = activeDonutIndex === i
                      const dashArray = `${(d.percentage / 100) * circumference} ${circumference}`
                      const offset = circumference - currentOffset
                      currentOffset += (d.percentage / 100) * circumference

                      return (
                        <circle
                          key={i}
                          cx="60"
                          cy="60"
                          r={donutRadius}
                          fill="transparent"
                          stroke={d.color}
                          strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                          strokeDasharray={dashArray}
                          strokeDashoffset={offset}
                          strokeLinecap="round"
                          className="cursor-pointer transition-all duration-200"
                          style={{
                            transformOrigin: "60px 60px"
                          }}
                          onMouseEnter={() => setActiveDonutIndex(i)}
                          onMouseLeave={() => setActiveDonutIndex(null)}
                        />
                      )
                    })}
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 pointer-events-none">
                    {activeDonutIndex !== null && activeDonutIndex < donutData.length ? (
                      <>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider line-clamp-1">
                          {language === 'id' ? donutData[activeDonutIndex].category : donutData[activeDonutIndex].categoryEn}
                        </span>
                        <span className="text-sm font-extrabold text-primary mt-0.5">
                          {donutData[activeDonutIndex].percentage}%
                        </span>
                        <span className="text-[10px] font-bold text-foreground mt-0.5">
                          {formatCurrency(donutData[activeDonutIndex].amount, language)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                          {language === 'id' ? "Total Pengeluaran" : "Total Expense"}
                        </span>
                        <span className="text-sm font-extrabold text-foreground mt-0.5">
                          {mounted ? formatCurrency(totalSpent, language) : "Rp 0"}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="w-full space-y-2 text-xs pt-2 border-t border-border/40">
                  {donutData.map((d, i) => {
                    const label = language === 'id' ? d.category : d.categoryEn
                    const isHovered = activeDonutIndex === i

                    return (
                      <div 
                        key={i} 
                        className={`flex items-center justify-between p-1.5 rounded-lg transition-all duration-150 ${
                          isHovered ? 'bg-primary/5 scale-[1.01]' : ''
                        }`}
                        onMouseEnter={() => setActiveDonutIndex(i)}
                        onMouseLeave={() => setActiveDonutIndex(null)}
                      >
                        <div className="flex items-center gap-2 cursor-pointer">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                          <span className={`font-semibold text-foreground ${isHovered ? 'text-primary' : ''}`}>
                            {label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 font-bold text-foreground">
                          <span>{d.percentage}%</span>
                          <span className="text-muted-foreground font-semibold text-[11px]">
                            {mounted ? formatCurrency(d.amount, language) : "Rp 0"}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* QUARTERLY DETAIL MODAL (BULANAN DETAIL) */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <Dialog open={selectedMonthDetail !== null} onOpenChange={(open) => { if(!open) setSelectedMonthDetail(null) }}>
        {selectedMonthDetail && (
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto scrollbar-none bg-background/95 border-border text-foreground backdrop-blur-xl p-6 shadow-2xl rounded-xl">
            <DialogHeader className="mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-3">
                <div>
                  <DialogTitle className="text-foreground text-xl font-bold flex items-center gap-2 tracking-tight">
                    <Calendar className="w-5 h-5 text-primary dark:text-rose-400" />
                    <span>
                      {language === 'id'
                        ? `Detail Arus Kas - ${selectedMonthDetail.monthNameId}`
                        : `Cash Flow Details - ${selectedMonthDetail.monthNameEn}`}
                    </span>
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground text-xs mt-1">
                    {language === 'id'
                      ? `Laporan lengkap arus harian dan daftar transaksi pada bulan ${selectedMonthDetail.monthNameId}.`
                      : `Comprehensive daily flow report and transactions for ${selectedMonthDetail.monthNameEn}.`}
                  </DialogDescription>
                </div>
                {/* Specific Month Exports inside Modal */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      exportToExcel(
                        monthTransactions,
                        language === 'id' ? selectedMonthDetail.monthNameId : selectedMonthDetail.monthNameEn,
                        { income: monthIn, expense: monthOut, balance: monthNet },
                        language
                      )
                    }}
                    className="p-2 bg-muted/40 hover:bg-muted/70 text-foreground border border-border rounded-lg transition-all cursor-pointer"
                    title={language === 'id' ? "Ekspor Excel Bulan Ini" : "Export Excel This Month"}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </button>
                  <button
                    onClick={() => {
                      exportToPDF(
                        monthTransactions,
                        language === 'id' ? selectedMonthDetail.monthNameId : selectedMonthDetail.monthNameEn,
                        { income: monthIn, expense: monthOut, balance: monthNet },
                        language
                      )
                    }}
                    className="p-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all cursor-pointer"
                    title={language === 'id' ? "Cetak PDF Laporan" : "Print PDF Report"}
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </DialogHeader>

            {/* Modal Month Quick Metrics Row */}
            <div className="grid grid-cols-3 gap-3 bg-muted/20 border border-border/60 p-3 rounded-xl text-xs mb-4">
              <div>
                <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider mb-0.5">{t('income')}</span>
                <span className="font-bold text-green-600 dark:text-green-400 text-sm">{formatCurrency(monthIn, language)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider mb-0.5">{t('expense')}</span>
                <span className="font-bold text-primary text-sm">{formatCurrency(monthOut, language)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider mb-0.5">{language === 'id' ? "Saldo Bersih" : "Net Flow"}</span>
                <span className={`font-extrabold text-sm ${monthNet >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {monthNet >= 0 ? "+" : ""}{formatCurrency(monthNet, language)}
                </span>
              </div>
            </div>

            {/* Modal Daily Trend Chart */}
            <div ref={modalChartRef} className="relative w-full border border-border/65 bg-muted/5 rounded-xl p-3 mb-6">
              <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
                <BarChart3 className="w-3.5 h-3.5 text-primary" />
                {language === 'id' ? "Grafik Harian Bulan Ini" : "Daily Trend Chart This Month"}
              </h4>
              
              {monthDailyFlow.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  {language === 'id' ? "Tidak ada transaksi harian." : "No daily transactions recorded."}
                </div>
              ) : (
                <div className="w-full relative overflow-visible select-none">
                  <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
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

                    {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => (
                      <line key={idx} x1={paddingX} y1={paddingY + r * chartHeight} x2={svgWidth - paddingX} y2={paddingY + r * chartHeight} className="stroke-border/40" strokeDasharray="3 3" />
                    ))}

                    <path d={modalIncArea} fill="url(#modalIncGrad)" />
                    <path d={modalExpArea} fill="url(#modalExpGrad)" />

                    <path d={modalIncPath} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
                    <path d={modalExpPath} fill="none" stroke="#810B38" strokeWidth="2.5" strokeLinecap="round" />

                    {modalActiveIdx !== null && modalIncPts[modalActiveIdx] && (
                      <line x1={modalIncPts[modalActiveIdx].x} y1={paddingY} x2={modalIncPts[modalActiveIdx].x} y2={paddingY + chartHeight} className="stroke-primary/40" strokeWidth="1" strokeDasharray="2 2" />
                    )}

                    {monthDailyFlow.map((d, i) => {
                      const incP = modalIncPts[i]
                      const expP = modalExpPts[i]
                      const isActive = modalActiveIdx === i
                      if (!incP || !expP) return null
                      return (
                        <g key={i}>
                          <circle cx={incP.x} cy={incP.y} r={isActive ? 6 : 3} fill="#10B981" stroke="#FFF" strokeWidth={isActive ? 1.5 : 0.5} />
                          <circle cx={expP.x} cy={expP.y} r={isActive ? 6 : 3} fill="#810B38" stroke="#FFF" strokeWidth={isActive ? 1.5 : 0.5} />
                        </g>
                      )
                    })}

                    {/* Month daily labels thinning */}
                    {monthDailyFlow.map((d, i) => {
                      const p = modalIncPts[i]
                      if (!p) return null
                      if ((i + 1) % 5 !== 0 && i !== 0 && i !== monthDailyFlow.length - 1) return null
                      return (
                        <text key={i} x={p.x} y={svgHeight - 10} textAnchor="middle" className="fill-muted-foreground font-semibold text-[9px] uppercase tracking-wider">
                          {d.date}
                        </text>
                      )
                    })}

                    {monthDailyFlow.map((d, i) => {
                      const width = chartWidth / Math.max(1, monthDailyFlow.length - 1)
                      const x = paddingX + i * width - width / 2
                      return (
                        <rect
                          key={i}
                          x={x}
                          y={paddingY}
                          width={width}
                          height={chartHeight}
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseEnter={() => setModalActiveIdx(i)}
                          onMouseLeave={() => setModalActiveIdx(null)}
                          onClick={(e) => {
                            e.stopPropagation()
                            setModalActiveIdx(i === modalActiveIdx ? null : i)
                          }}
                        />
                      )
                    })}
                  </svg>

                  {/* Modal active chart tooltip */}
                  <AnimatePresence>
                    {modalActiveIdx !== null && monthDailyFlow[modalActiveIdx] && modalIncPts[modalActiveIdx] && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, x: modalTooltipTransform.x, y: `calc(${modalTooltipTransform.y} + 8px)` }}
                        animate={{ opacity: 1, scale: 1, x: modalTooltipTransform.x, y: modalTooltipTransform.y }}
                        exit={{ opacity: 0, scale: 0.95, x: modalTooltipTransform.x, y: `calc(${modalTooltipTransform.y} + 8px)` }}
                        transition={{ duration: 0.12 }}
                        className="absolute z-50 bg-background/95 border border-border/80 p-2.5 rounded-lg shadow-xl backdrop-blur-md text-[10px] flex flex-col gap-1 pointer-events-none min-w-[120px]"
                        style={modalTooltipStyle}
                      >
                        <div className="font-bold text-foreground border-b border-border/50 pb-0.5">
                          <span>{language === 'id' ? monthDailyFlow[modalActiveIdx].date : monthDailyFlow[modalActiveIdx].dateEn}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 font-semibold mt-0.5">
                          <div className="flex items-center justify-between gap-4 text-green-600 dark:text-green-400">
                            <span>{t('income')}:</span>
                            <span>{formatCurrency(monthDailyFlow[modalActiveIdx].income, language)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-primary">
                            <span>{t('expense')}:</span>
                            <span>{formatCurrency(monthDailyFlow[modalActiveIdx].expense, language)}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Modal Month Transactions Table */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                {language === 'id' ? "Daftar Transaksi Bulan Ini" : "Transactions List This Month"}
              </h4>
              
              <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2">
                {monthTransactions.length > 0 ? (
                  monthTransactions.map((tx) => (
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
              <Button
                onClick={() => setSelectedMonthDetail(null)}
                className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold rounded-lg px-5 py-2 cursor-pointer shadow-sm"
              >
                {language === 'id' ? "Tutup" : "Close"}
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>

    </motion.div>
  )
}
