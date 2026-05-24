"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowDown,
  ArrowUp,
  Wallet,
  Coins,
  ShieldAlert,
  Calendar,
  Briefcase,
  Edit2,
  Trash2,
  Plus,
  ArrowLeft,
  Info,
  TrendingUp,
  History,
  ChevronDown,
  Filter
} from "lucide-react"
import { useTransactionStore } from "@/store/useTransactionStore"
import { useLanguageStore, translations } from "@/store/useLanguageStore"
import { usePortfolioStore, type AssetType, type InvestmentAsset, type AssetHistoryLog } from "@/store/usePortfolioStore"
import { usePlanningStore } from "@/store/usePlanningStore"
import { exportAssetHistoryToExcel, exportAssetHistoryToPDF } from "@/lib/export"
import { formatCurrency, formatRelativeDate } from "@/lib/format"
import { useSettingsStore } from "@/store/useSettingsStore"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { useToast } from "@/components/ToastProvider"

// ─── Types ────────────────────────────────────────────────────────────────────
interface CfDataPoint { date: string; dateEn: string; income: number; expense: number }

// ─── Dashboard Cash Flow Chart ────────────────────────────────────────────────
function DashboardCashFlowChart({
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
  filteredTransactions
}: {
  language: 'id' | 'en'
  mounted: boolean
  t: (k: keyof typeof translations['id']) => string
  formatCurrency: typeof import('@/lib/format').formatCurrency
  filter: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'customPeriod'
  setFilter: (p: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'customPeriod') => void
  startDate: string
  setStartDate: (s: string) => void
  endDate: string
  setEndDate: (s: string) => void
  filteredTransactions: ReturnType<typeof useTransactionStore.getState>['transactions']
}) {
  const [activeIdx, setActiveIdx] = React.useState<number | null>(null)
  const [clickedIdx, setClickedIdx] = React.useState<number | null>(null)
  const chartRef = React.useRef<HTMLDivElement>(null)

  // Dismiss tooltip on click outside
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

  // Dynamic grouping logic based on filter
  const displayData = React.useMemo((): CfDataPoint[] => {
    if (filter === 'daily') {
      const hourlyIncome = Array(24).fill(0)
      const hourlyExpense = Array(24).fill(0)
      
      filteredTransactions.forEach((tx) => {
        const d = new Date(tx.date)
        const hr = d.getHours()
        if (tx.type === 'in') hourlyIncome[hr] += tx.amount
        else hourlyExpense[hr] += tx.amount
      })
      
      const pts: CfDataPoint[] = []
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
      
      const pts: CfDataPoint[] = []
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
        if (mIdx >= startMonth && mIdx < startMonth + 3) {
          const offset = mIdx - startMonth
          if (tx.type === 'in') monthlyIncome[offset] += tx.amount
          else monthlyExpense[offset] += tx.amount
        }
      })
      
      const pts: CfDataPoint[] = []
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

    // Fallback: customPeriod or otherwise - original date-based grouping
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
    const pts: CfDataPoint[] = sorted.map(k => {
      const v = grouped[k]; const d = new Date(v.dateRaw)
      const day = String(d.getDate()).padStart(2,'0')
      return {
        date: `${day} ${monthsId[d.getMonth()]}`,
        dateEn: `${monthsEn[d.getMonth()]} ${day}`,
        income: v.income, expense: v.expense
      }
    })
    if (pts.length === 1) {
      return [{ date: language === 'id' ? 'Mulai' : 'Start', dateEn: 'Start', income: 0, expense: 0 }, ...pts]
    }
    return pts
  }, [filteredTransactions, filter, language])

  const W = 600, H = 260, PX = 50, PY = 30
  const CW = W - PX * 2, CH = H - PY * 2
  const maxVal = Math.max(...displayData.flatMap(d => [d.income, d.expense]), 1) * 1.15

  const coord = (i: number, v: number) => ({
    x: PX + (i / Math.max(1, displayData.length - 1)) * CW,
    y: PY + CH - (v / maxVal) * CH
  })

  const incPts = displayData.map((d, i) => coord(i, d.income))
  const expPts = displayData.map((d, i) => coord(i, d.expense))

  const linePath = (pts: {x:number;y:number}[]) =>
    pts.reduce((p, pt, i) => i === 0 ? `M ${pt.x} ${pt.y}` : `${p} L ${pt.x} ${pt.y}`, '')

  const areaPath = (pts: {x:number;y:number}[]) => {
    if (!pts.length) return ''
    const base = PY + CH
    return `${linePath(pts)} L ${pts[pts.length-1].x} ${base} L ${pts[0].x} ${base} Z`
  }

  const tooltipTransform = React.useMemo(() => {
    if (activeIdx === null || !incPts[activeIdx] || !expPts[activeIdx]) return { x: 0, y: 0 }
    const isLast = activeIdx === displayData.length - 1
    const isFirst = activeIdx === 0
    const minY = Math.min(incPts[activeIdx].y, expPts[activeIdx].y)
    const showBelow = minY < 70

    let xVal: string | number = "-50%"
    const yVal: string | number = showBelow ? "15px" : "-115%"

    if (isLast || isFirst) {
      xVal = "0%"
    }

    return { x: xVal, y: yVal }
  }, [activeIdx, incPts, expPts, displayData.length])

  const tooltipStyle = React.useMemo((): React.CSSProperties => {
    if (activeIdx === null || !incPts[activeIdx] || !expPts[activeIdx]) return {}
    const xPct = (incPts[activeIdx].x / W) * 100
    const isLast = activeIdx === displayData.length - 1
    const isFirst = activeIdx === 0
    
    const minY = Math.min(incPts[activeIdx].y, expPts[activeIdx].y)
    const yPct = (minY / H) * 100

    if (isLast)  return { right: '8px', left: 'auto', top: `${yPct}%` }
    if (isFirst) return { left: '8px', top: `${yPct}%` }
    return { left: `${xPct}%`, top: `${yPct}%` }
  }, [activeIdx, displayData.length, incPts, expPts, W])

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
        {/* Visual period filter bar - default: Mingguan - hidden on print */}
        <div className="flex flex-col gap-2 border-b border-border/30 pb-2 no-print">
          <div className="flex flex-wrap items-center gap-1">
            {(['daily', 'weekly', 'monthly', 'quarterly', 'customPeriod'] as const).map((p) => (
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
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible" aria-label="Cash Flow Chart">
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

              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
                <line key={i} x1={PX} y1={PY + r * CH} x2={W - PX} y2={PY + r * CH}
                  className="stroke-border/40" strokeDasharray="4 4" />
              ))}

              {/* Area fills */}
              <path d={areaPath(incPts)} fill="url(#dashIncGrad)" />
              <path d={areaPath(expPts)} fill="url(#dashExpGrad)" />

              {/* Lines */}
              <path d={linePath(incPts)} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
              <path d={linePath(expPts)} fill="none" stroke="#810B38" strokeWidth="2.5" strokeLinecap="round" />

              {/* Hover dotted line */}
              {activeIdx !== null && incPts[activeIdx] && (
                <line x1={incPts[activeIdx].x} y1={PY}
                  x2={incPts[activeIdx].x} y2={PY + CH}
                  className="stroke-primary/40" strokeWidth="1.5" strokeDasharray="3 3" />
              )}

              {/* Data point dots */}
              {displayData.map((_, i) => {
                const ip = incPts[i]; const ep = expPts[i]
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

              {/* X-axis labels */}
              {displayData.map((d, i) => {
                const p = incPts[i]; if (!p) return null
                // Clean label filtering depending on mode
                if (filter === 'daily' && i % 4 !== 0 && i !== 23) return null
                if (filter === 'monthly' && (i + 1) % 5 !== 0 && i !== 0 && i !== displayData.length - 1) return null
                
                return (
                  <text key={i} x={p.x} y={H - 10} textAnchor="middle"
                    className="fill-muted-foreground font-semibold text-[10px] uppercase tracking-wider">
                    {language === 'id' ? d.date : d.dateEn}
                  </text>
                )
              })}

              {/* Invisible hit zones */}
              {displayData.map((_, i) => {
                const bw = CW / Math.max(1, displayData.length - 1)
                return (
                  <rect key={i} x={PX + i * bw - bw / 2} y={PY} width={bw} height={CH}
                    fill="transparent" className="cursor-pointer"
                    onMouseEnter={() => {
                      if (clickedIdx === null) setActiveIdx(i)
                    }}
                    onMouseLeave={() => {
                      if (clickedIdx === null) setActiveIdx(null)
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (clickedIdx === i) {
                        setClickedIdx(null)
                        setActiveIdx(null)
                      } else {
                        setClickedIdx(i)
                        setActiveIdx(i)
                      }
                    }} />
                )
              })}
            </svg>

            {/* Glassmorphism Tooltip */}
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


const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const itemVariant: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 26 } }
}

export default function Home() {
  const transactions = useTransactionStore((state) => state.transactions)
  const addTransaction = useTransactionStore((state) => state.addTransaction)
  const deleteAssetTransactions = useTransactionStore((state) => state.deleteAssetTransactions)
  const { language } = useLanguageStore()
  const activeCurrency = useSettingsStore((state) => state.currency)
  const [mounted, setMounted] = React.useState(false)

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
  const [endDate, setEndDate] = React.useState(() => new Date().toISOString().split('T')[0])

  // Filtered transactions for Dashboard Metrics & Chart
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

  // Dynamic period sub-label for metrics cards
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

  // Portfolio Store
  const {
    assets,
    addAsset,
    updateAsset,
    deleteAsset,
    addAssetHistoryLog
  } = usePortfolioStore()

  // Planning Store
  const goals = usePlanningStore((state) => state.goals)

  // Modal State
  const [portfolioOpen, setPortfolioOpen] = React.useState(false)

  // Form State
  const [editingAsset, setEditingAsset] = React.useState<InvestmentAsset | null>(null)
  const [isAdding, setIsAdding] = React.useState(false)

  const [assetNameInput, setAssetNameInput] = React.useState("")
  const [assetTypeInput, setAssetTypeInput] = React.useState<AssetType>('stocks')
  const [assetInitialInput, setAssetInitialInput] = React.useState("")
  const [assetGainLossInput, setAssetGainLossInput] = React.useState("")
  const [assetGainLossType, setAssetGainLossType] = React.useState<'profit' | 'loss'>('profit')

  // New Integration States
  const [deductCash, setDeductCash] = React.useState(true)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)
  const [assetToDelete, setAssetToDelete] = React.useState<InvestmentAsset | null>(null)
  
  // Partial Liquidation States
  const [partialLiqOpen, setPartialLiqOpen] = React.useState(false)
  const [liqAsset, setLiqAsset] = React.useState<InvestmentAsset | null>(null)
  const [partialLiqAmountInput, setPartialLiqAmountInput] = React.useState("")

  // Asset History States
  const [assetHistoryOpen, setAssetHistoryOpen] = React.useState(false)
  const [selectedHistoryAsset, setSelectedHistoryAsset] = React.useState<InvestmentAsset | null>(null)
  const [historyFilter, setHistoryFilter] = React.useState<'all' | 'capital_change' | 'gain_loss' | 'liquidation'>('all')
  const [isHistoryFilterDropdownOpen, setIsHistoryFilterDropdownOpen] = React.useState(false)

  const filteredLogs = React.useMemo(() => {
    if (!selectedHistoryAsset || !selectedHistoryAsset.history) return []
    return selectedHistoryAsset.history.filter((log) => {
      if (historyFilter === 'all') return true
      if (historyFilter === 'capital_change') return log.type === 'capital_change'
      if (historyFilter === 'gain_loss') return log.type === 'profit' || log.type === 'loss'
      if (historyFilter === 'liquidation') return log.type === 'liquidation'
      return true
    })
  }, [selectedHistoryAsset, historyFilter])

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const t = (key: keyof typeof translations['id']) => {
    if (!mounted) return translations['id'][key]
    return translations[language]?.[key] || translations['id'][key]
  }

  // Calculate overall Cash Balance (cumulative) - excluding Tabungan 'in' only (Tabungan 'out' reduces cash balance)
  const overallIn = transactions.filter(t => t.type === 'in' && t.category !== 'Tabungan').reduce((acc, curr) => acc + curr.amount, 0)
  const overallOut = transactions.filter(t => t.type === 'out').reduce((acc, curr) => acc + curr.amount, 0)
  const balance = overallIn - overallOut

  // Calculate filtered totals for Pemasukan / Pengeluaran cards - excluding Tabungan 'in' only (Tabungan 'out' reduces cash balance)
  const totalIn = filteredTransactions.filter(t => t.type === 'in' && t.category !== 'Tabungan').reduce((acc, curr) => acc + curr.amount, 0)
  const totalOut = filteredTransactions.filter(t => t.type === 'out').reduce((acc, curr) => acc + curr.amount, 0)

  // Calculate Portfolio net values and Savings
  const totalInvestment = assets.reduce((acc, a) => acc + (a.initialCapital + a.realizedGainLoss), 0)
  const totalSavings = goals.reduce((acc, goal) => acc + goal.collected, 0)
  const netWorth = balance + totalInvestment + totalSavings

  // Get recent 5 transactions from overall list
  const recentTransactions = transactions.slice(0, 5)

  // Reset form
  const resetForm = () => {
    setAssetNameInput("")
    setAssetTypeInput('stocks')
    setAssetInitialInput("")
    setAssetGainLossInput("")
    setAssetGainLossType('profit')
    setDeductCash(true)
    setEditingAsset(null)
    setIsAdding(false)
    setHistoryFilter('all')
    setIsHistoryFilterDropdownOpen(false)
  }

  // Open & populate form state
  const handleOpenPortfolio = () => {
    resetForm()
    setPortfolioOpen(true)
  }

  const handleStartEdit = (asset: InvestmentAsset) => {
    setEditingAsset(asset)
    setAssetNameInput(asset.name)
    setAssetTypeInput(asset.type)
    setAssetInitialInput(new Intl.NumberFormat("id-ID").format(asset.initialCapital))
    setAssetGainLossInput(new Intl.NumberFormat("id-ID").format(Math.abs(asset.realizedGainLoss)))
    setAssetGainLossType(asset.realizedGainLoss >= 0 ? 'profit' : 'loss')
    setIsAdding(false)
  }

  const handleStartAdd = () => {
    resetForm()
    setIsAdding(true)
  }

  // Handle Form Inputs with thousands separators
  const formatInputVal = (val: string) => {
    const clean = val.replace(/\D/g, "")
    if (!clean) return ""
    return new Intl.NumberFormat("id-ID").format(Number(clean))
  }

  const parseNum = (str: string) => Number(str.replace(/\D/g, "")) || 0

  const handleSaveAsset = () => {
    const initialVal = parseNum(assetInitialInput)
    const glVal = parseNum(assetGainLossInput) * (assetGainLossType === 'profit' ? 1 : -1)
    const trimmedName = assetNameInput.trim()
    
    if (!trimmedName) return

    if (editingAsset) {
      // 1. Catat log penyesuaian modal kustom jika modal awal disesuaikan
      if (initialVal !== editingAsset.initialCapital) {
        const diffCap = initialVal - editingAsset.initialCapital
        addAssetHistoryLog(
          editingAsset.id,
          Math.abs(diffCap),
          'capital_change',
          language === 'id'
            ? `Penyesuaian Modal: ${diffCap >= 0 ? '+' : ''}${formatCurrency(diffCap, language)}`
            : `Capital Adjustment: ${diffCap >= 0 ? '+' : ''}${formatCurrency(diffCap, language)}`
        )
      }

      // 2. Catat log keuntungan/kerugian kustom jika realized gain/loss disesuaikan
      // Tanpa pemanggilan addTransaction (Saldo Tunai tidak terpengaruh)
      if (glVal !== editingAsset.realizedGainLoss) {
        const diffGL = glVal - editingAsset.realizedGainLoss
        addAssetHistoryLog(
          editingAsset.id,
          Math.abs(diffGL),
          diffGL >= 0 ? 'profit' : 'loss',
          language === 'id'
            ? `Penyesuaian Keuntungan/Kerugian: ${diffGL >= 0 ? '+' : ''}${formatCurrency(diffGL, language)}`
            : `Gain/Loss Adjustment: ${diffGL >= 0 ? '+' : ''}${formatCurrency(diffGL, language)}`
        )
      }

      updateAsset(editingAsset.id, {
        name: trimmedName,
        type: assetTypeInput,
        initialCapital: initialVal,
        realizedGainLoss: glVal
      })
    } else if (isAdding) {
      // 3. Catat log riwayat awal kustom untuk aset baru
      const initialLogs: Omit<AssetHistoryLog, 'id' | 'date'>[] = []
      if (initialVal > 0) {
        initialLogs.push({
          amount: initialVal,
          type: 'capital_change',
          note: language === 'id' ? 'Alokasi Modal Awal' : 'Initial Capital Allocation'
        })
      }
      if (glVal !== 0) {
        initialLogs.push({
          amount: Math.abs(glVal),
          type: glVal >= 0 ? 'profit' : 'loss',
          note: language === 'id' ? 'Penyesuaian Nilai Awal' : 'Initial Value Adjustment'
        })
      }

      const newAssetId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9)
      addAsset(
        trimmedName,
        assetTypeInput,
        initialVal,
        glVal,
        initialLogs,
        newAssetId
      )

      if (deductCash && initialVal > 0) {
        const note = t('initialAssetNote').replace('[Nama Aset]', trimmedName)
        addTransaction({
          amount: initialVal,
          type: 'out',
          category: 'Investasi',
          note: note,
          assetId: newAssetId
        })
      }
    }
    resetForm()
  }

  const handleDeleteAsset = (asset: InvestmentAsset) => {
    setAssetToDelete(asset)
    setDeleteConfirmOpen(true)
  }

  const handleExecuteDelete = (liquidate: boolean) => {
    if (!assetToDelete) return

    if (liquidate) {
      const netVal = assetToDelete.initialCapital + assetToDelete.realizedGainLoss
      if (netVal > 0) {
        const note = t('liquidateAssetNote').replace('[Nama Aset]', assetToDelete.name)
        addTransaction({
          amount: netVal,
          type: 'in',
          category: 'Investasi',
          note: note,
          assetId: assetToDelete.id
        })
      }
    } else {
      // Fitur 2: Rollback transaksi pembuatan/penyesuaian aset secara bersih
      deleteAssetTransactions(assetToDelete.id, assetToDelete.name)
    }

    deleteAsset(assetToDelete.id)
    setDeleteConfirmOpen(false)
    setAssetToDelete(null)

    if (editingAsset?.id === assetToDelete.id) {
      resetForm()
    }
  }

  const handleStartPartialLiquidation = (asset: InvestmentAsset) => {
    setLiqAsset(asset)
    setPartialLiqAmountInput("")
    setPartialLiqOpen(true)
  }

  const handleExecutePartialLiquidation = () => {
    if (!liqAsset) return

    const liqAmt = parseNum(partialLiqAmountInput)
    if (liqAmt <= 0) return

    const netVal = liqAsset.initialCapital + liqAsset.realizedGainLoss
    if (liqAmt > netVal) return

    let newInitial = liqAsset.initialCapital
    let newGL = liqAsset.realizedGainLoss

    if (liqAmt <= liqAsset.initialCapital) {
      newInitial = liqAsset.initialCapital - liqAmt
    } else {
      newInitial = 0
      const remainder = liqAmt - liqAsset.initialCapital
      newGL = liqAsset.realizedGainLoss - remainder
    }

    updateAsset(liqAsset.id, {
      initialCapital: newInitial,
      realizedGainLoss: newGL
    })

    addAssetHistoryLog(
      liqAsset.id,
      liqAmt,
      'liquidation',
      language === 'id' 
        ? `Likuidasi Sebagian Aset` 
        : `Partial Asset Liquidation`
    )

    const noteTemplate = language === 'id' ? 'Likuidasi Sebagian: [Nama Aset]' : 'Partial Liquidation: [Nama Aset]'
    const note = noteTemplate.replace('[Nama Aset]', liqAsset.name)

    addTransaction({
      amount: liqAmt,
      type: 'in',
      category: 'Investasi',
      note: note,
      assetId: liqAsset.id
    })

    setPartialLiqOpen(false)
    setLiqAsset(null)
    setPartialLiqAmountInput("")
  }

  // Weekly alert logic check
  const checkAssetNeedsUpdate = (asset: InvestmentAsset) => {
    if (asset.type !== 'stocks' && asset.type !== 'crypto') return false
    const diffDays = (Date.now() - new Date(asset.lastUpdated).getTime()) / (1000 * 60 * 60 * 24)
    return diffDays >= 7
  }

  const assetsNeedingUpdate = assets.filter(checkAssetNeedsUpdate)
  const showBanner = assetsNeedingUpdate.length > 0

  const oldestUpdateDate = assetsNeedingUpdate.reduce((oldest, current) => {
    return new Date(current.lastUpdated).getTime() < new Date(oldest).getTime() ? current.lastUpdated : oldest
  }, assetsNeedingUpdate[0]?.lastUpdated || new Date().toISOString())

  return (
    <motion.div 
      className="flex flex-col gap-8 pb-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Title */}
      <motion.div variants={itemVariant} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{t('dashboard')}</h1>
          <p className="text-muted-foreground">{t('dashboardSubtitle')}</p>
        </div>
        
        {/* Weekly Portfolio Update Trigger */}
        <button 
          onClick={handleOpenPortfolio}
          className="self-start md:self-center px-4 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer duration-200 animate-in fade-in zoom-in-95"
        >
          <Briefcase className="w-4 h-4 text-primary-foreground dark:text-rose-100" />
          <span>{t('updatePortfolio')}</span>
        </button>
      </motion.div>

      {/* Main Row: Cash Flow metrics */}
      <motion.div variants={itemVariant} className="grid gap-6 md:grid-cols-3">
        {/* Total Cash Balance */}
        <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('cashBalance')}
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {mounted ? formatCurrency(balance, language) : "Rp 0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('currentTotal')}</p>
          </CardContent>
        </Card>

        {/* Pemasukan */}
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

        {/* Pengeluaran */}
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
      </motion.div>

      {/* NEW SECTION: Total Portofolio & Aset (Asset & Investment Tracker) */}
      <motion.div variants={itemVariant} className="flex flex-col gap-6">
        <div className="flex items-center gap-2 px-1">
          <h2 className="text-lg font-bold tracking-tight text-foreground">{t('portfolioAsset')}</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          {/* Net Worth Card (Spans 2 columns on desktop) */}
          <Card className="md:col-span-2 bg-gradient-to-br from-primary/10 via-card to-card border-primary/20 shadow-sm relative overflow-hidden hover:shadow-md transition-all">
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
              <Wallet className="w-48 h-48 text-primary" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-primary/95 dark:text-rose-300 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-primary dark:text-rose-400" />
                {t('netWorth')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-foreground tracking-tight">
                {mounted ? formatCurrency(netWorth, language) : "Rp 0"}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {language === 'id' 
                  ? "Saldo Tunai + Investasi Portofolio + Total Tabungan" 
                  : "Cash Balance + Portfolio Investments + Total Savings"}
              </p>
              <div className="flex items-center gap-4 mt-5 pt-4 border-t border-border/40 text-xs flex-wrap">
                <div>
                  <span className="text-muted-foreground block mb-0.5">{t('cashBalance')}</span>
                  <span className="font-semibold text-foreground">{mounted ? formatCurrency(balance, language) : "Rp 0"}</span>
                </div>
                <div className="w-[1px] h-6 bg-border/60" />
                <div>
                  <span className="text-muted-foreground block mb-0.5">{t('totalInvestment')}</span>
                  <span className="font-semibold text-primary">{mounted ? formatCurrency(totalInvestment, language) : "Rp 0"}</span>
                </div>
                <div className="w-[1px] h-6 bg-border/60" />
                <div>
                  <span className="text-muted-foreground block mb-0.5">{language === 'id' ? 'Total Tabungan' : 'Total Savings'}</span>
                  <span className="font-semibold text-green-500">{mounted ? formatCurrency(totalSavings, language) : "Rp 0"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clickable Total Portofolio & Aset Card (Spans 2 columns on desktop) */}
          <Card 
            onClick={handleOpenPortfolio}
            className="md:col-span-2 bg-card border-border hover:border-primary/45 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
              <Coins className="w-48 h-48 text-primary" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-primary" />
                {t('portfolioAsset')}
              </CardTitle>
              <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                {language === 'id' ? 'Kelola' : 'Manage'} &rarr;
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-foreground tracking-tight group-hover:text-primary transition-colors">
                {mounted ? formatCurrency(totalInvestment, language) : "Rp 0"}
              </div>
              
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/40 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase font-semibold mb-0.5">
                    {t('stocks')}
                  </span>
                  <span className="font-semibold text-foreground">
                    {mounted 
                      ? formatCurrency(
                          assets.filter(a => a.type === 'stocks').reduce((acc, a) => acc + (a.initialCapital + a.realizedGainLoss), 0), 
                          language
                        ) 
                      : "Rp 0"
                    }
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase font-semibold mb-0.5">
                    {t('crypto')}
                  </span>
                  <span className="font-semibold text-foreground">
                    {mounted 
                      ? formatCurrency(
                          assets.filter(a => a.type === 'crypto').reduce((acc, a) => acc + (a.initialCapital + a.realizedGainLoss), 0), 
                          language
                        ) 
                      : "Rp 0"
                    }
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase font-semibold mb-0.5">
                    {t('otherType')}
                  </span>
                  <span className="font-semibold text-foreground">
                    {mounted 
                      ? formatCurrency(
                          assets.filter(a => a.type === 'other').reduce((acc, a) => acc + (a.initialCapital + a.realizedGainLoss), 0), 
                          language
                        ) 
                      : "Rp 0"
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Reminder Alert Banner - Rendered conditionally */}
        {showBanner && (
          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
            <div className="flex gap-3">
              <div className="p-2.5 bg-primary/10 rounded-lg self-start sm:self-center">
                <ShieldAlert className="w-5 h-5 text-primary animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  {t('weeklyReminder')}
                </h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                  {t('weeklyReminderDesc')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
              <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {t('lastUpdated')}: {mounted ? formatRelativeDate(oldestUpdateDate, language) : ""}
              </span>
              <Button 
                size="sm"
                onClick={handleOpenPortfolio}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg px-3 py-1.5 cursor-pointer shadow-sm"
              >
                {t('updatePortfolio')}
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Bottom Row: Cash Flow Chart (Live) & Recent Transactions */}
      <motion.div variants={itemVariant} className="grid gap-6 md:grid-cols-7">
        <DashboardCashFlowChart
          language={language}
          mounted={mounted}
          t={t}
          formatCurrency={formatCurrency}
          filter={filter}
          setFilter={setFilter}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          filteredTransactions={filteredTransactions}
        />

        <Card className="md:col-span-3 bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">{t('recentTransactions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentTransactions.length > 0 ? recentTransactions.map((item) => {
                const noteDisplay = item.note === 'Modal awal' ? t('initialNote') : item.note
                const categoryDisplay = item.category === 'Saldo Awal' ? t('initialBalance') : item.category
                
                return (
                  <div key={item.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full transition-colors ${item.type === 'in' ? 'bg-green-500/10 group-hover:bg-green-500/20' : 'bg-destructive/10 group-hover:bg-destructive/20'}`}>
                        {item.type === 'in' ? (
                          <ArrowDown className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <ArrowUp className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none text-card-foreground">{noteDisplay}</p>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {categoryDisplay} &bull; {mounted ? formatRelativeDate(item.date, language) : ""}
                        </p>
                      </div>
                    </div>
                    <div className={`font-semibold text-sm ${item.type === 'in' ? 'text-green-600 dark:text-green-400' : 'text-card-foreground'}`}>
                      {item.type === 'in' ? '+' : '-'}{mounted ? formatCurrency(item.amount, language) : "Rp 0"}
                    </div>
                  </div>
                )
              }) : (
                <p className="text-sm text-muted-foreground text-center py-4">{t('noTransactions')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* PORTFOLIO DETAIL & UPDATE DIALOG MODAL */}
      <Dialog open={portfolioOpen} onOpenChange={setPortfolioOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto scrollbar-none bg-background/95 border-border text-foreground backdrop-blur-xl p-6 shadow-2xl rounded-xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-foreground text-xl font-bold tracking-tight flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary dark:text-rose-400" />
              {t('allAssetsDetail')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {language === 'id'
                ? "Kelola alokasi aset investasi Anda secara dinamis dengan realized gain/loss mingguan."
                : "Manage your investment asset allocations dynamically with weekly realized gain/loss."}
            </DialogDescription>
          </DialogHeader>

          {!isAdding && !editingAsset ? (
            <div className="flex flex-col gap-4">
              {/* Add Asset Button / Title */}
              <div className="flex justify-between items-center pb-2 border-b border-border/60">
                <h3 className="text-sm font-bold text-foreground">
                  {language === 'id' ? 'Daftar Aset Investasi' : 'Investment Assets List'}
                </h3>
                <button
                  onClick={handleStartAdd}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('addAsset')}</span>
                </button>
              </div>

              {/* Assets List */}
              <div className="max-h-[350px] overflow-y-auto pr-1 space-y-3">
                {assets.length > 0 ? (
                  assets.map((asset) => {
                    const netVal = asset.initialCapital + asset.realizedGainLoss
                    const isProfit = asset.realizedGainLoss >= 0
                    const needsUpdate = checkAssetNeedsUpdate(asset)
                    
                    let IconComponent = Wallet
                    if (asset.type === 'stocks') IconComponent = TrendingUp
                    if (asset.type === 'crypto') IconComponent = Coins

                    return (
                      <div 
                        key={asset.id} 
                        className={`p-3.5 rounded-xl border transition-all flex flex-col gap-2.5 ${
                          needsUpdate 
                            ? 'border-primary/40 bg-primary/5 hover:border-primary/60' 
                            : 'border-border/80 bg-muted/10 hover:border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${
                              asset.type === 'stocks' 
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                                : asset.type === 'crypto' 
                                  ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' 
                                  : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                            }`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-foreground flex items-center gap-2 flex-wrap">
                                {asset.name}
                                <span className="text-[9px] font-semibold text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded border border-border/40">
                                  {asset.type === 'stocks' ? t('stocks') : asset.type === 'crypto' ? t('crypto') : t('otherType')}
                                </span>
                              </h4>
                              <span className="text-[10px] text-muted-foreground">
                                {t('lastUpdated')}: {formatRelativeDate(asset.lastUpdated, language)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedHistoryAsset(asset)
                                setAssetHistoryOpen(true)
                              }}
                              className="p-1.5 hover:bg-primary/10 rounded-lg text-primary/70 hover:text-primary transition-colors cursor-pointer"
                              title={language === 'id' ? 'Riwayat Penyesuaian' : 'Adjustment History'}
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleStartPartialLiquidation(asset)}
                              className="p-1.5 hover:bg-green-500/10 rounded-lg text-green-600 dark:text-green-400 hover:text-green-700 transition-colors cursor-pointer"
                              title={language === 'id' ? 'Likuidasi Sebagian' : 'Partial Liquidation'}
                            >
                              <Coins className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleStartEdit(asset)}
                              className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              title={t('editAsset')}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAsset(asset)}
                              className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                              title={t('deleteAssetConfirm')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-2 bg-muted/30 p-2 rounded-lg text-xs">
                          <div>
                            <span className="text-muted-foreground block text-[9px] uppercase font-semibold mb-0.5">{t('initialCapital')}</span>
                            <span className="font-semibold text-foreground">{formatCurrency(asset.initialCapital, language)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[9px] uppercase font-semibold mb-0.5">{t('realizedGainLoss')}</span>
                            <span className={`font-semibold ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                              {isProfit ? '+' : ''}{formatCurrency(asset.realizedGainLoss, language)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[9px] uppercase font-semibold mb-0.5">{t('netInvestmentValue')}</span>
                            <span className="font-bold text-foreground">{formatCurrency(netVal, language)}</span>
                          </div>
                        </div>

                        {/* Alert Badge inline if stocks/crypto & hasn't been updated in >= 7 days */}
                        {needsUpdate && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg self-start">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>{t('weeklyRecommended')}</span>
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="py-8 text-center flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-xl">
                    <Wallet className="w-8 h-8 text-muted-foreground/40 animate-pulse" />
                    <p className="text-muted-foreground text-xs font-semibold">{t('noAssets')}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-4">
                <Button 
                  onClick={() => setPortfolioOpen(false)} 
                  className="bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer shadow-md text-xs font-semibold rounded-lg px-5 py-2"
                >
                  {language === 'id' ? 'Selesai' : 'Done'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Back Button / Title */}
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <button
                  onClick={resetForm}
                  className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  type="button"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-sm font-bold text-foreground">
                  {editingAsset ? t('editAsset') : t('newAsset')}
                </h3>
              </div>

              <div className="grid gap-4 py-1">
                {/* Asset Name */}
                <div className="grid gap-1.5">
                  <label className="font-semibold text-xs text-muted-foreground">{t('assetName')}</label>
                  <Input 
                    placeholder={language === 'id' ? 'Contoh: Saham BBCA, Bitcoin, Emas Antam' : 'e.g. BBCA Stocks, Bitcoin, Gold'}
                    value={assetNameInput}
                    onChange={(e) => setAssetNameInput(e.target.value)}
                    className="bg-muted/40 border border-input text-foreground focus-visible:ring-primary h-10 rounded-lg text-sm font-medium"
                  />
                </div>

                {/* Asset Type Custom Toggles */}
                <div className="grid gap-1.5">
                  <label className="font-semibold text-xs text-muted-foreground">{t('assetType')}</label>
                  <div className="flex gap-2">
                    {([
                      { value: 'stocks', label: t('stocks'), icon: TrendingUp },
                      { value: 'crypto', label: t('crypto'), icon: Coins },
                      { value: 'other', label: t('otherType'), icon: Wallet }
                    ] as const).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAssetTypeInput(opt.value)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          assetTypeInput === opt.value
                            ? 'border-primary bg-primary/10 text-primary shadow-sm'
                            : 'border-border bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/30'
                        }`}
                      >
                        <opt.icon className="w-3.5 h-3.5" />
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modal Awal & Realized Gain/Loss Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <label className="font-semibold text-xs text-muted-foreground">{t('initialCapital')}</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs text-muted-foreground/60 font-semibold select-none">
                        {
                          {
                            IDR: 'Rp',
                            USD: '$',
                            EUR: '€',
                            SGD: 'S$',
                            JPY: '¥'
                          }[activeCurrency] || 'Rp'
                        }
                      </span>
                      <Input 
                        value={assetInitialInput}
                        onChange={(e) => setAssetInitialInput(formatInputVal(e.target.value))}
                        className="pl-8 bg-muted/40 border border-input text-foreground focus-visible:ring-primary h-10 rounded-lg text-sm font-medium"
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-1.5">
                    <label className="font-semibold text-xs text-muted-foreground">{t('realizedGainLoss')}</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs text-muted-foreground/60 font-semibold select-none">
                        {
                          {
                            IDR: 'Rp',
                            USD: '$',
                            EUR: '€',
                            SGD: 'S$',
                            JPY: '¥'
                          }[activeCurrency] || 'Rp'
                        }
                      </span>
                      <Input 
                        value={assetGainLossInput}
                        onChange={(e) => setAssetGainLossInput(formatInputVal(e.target.value))}
                        className="pl-8 bg-muted/40 border border-input text-foreground focus-visible:ring-primary h-10 rounded-lg text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Profit/Loss status switch */}
                <div className="flex items-center justify-between gap-4 bg-muted/40 p-2 rounded-lg border border-border/40">
                  <span className="text-xs text-muted-foreground font-semibold">
                    {language === 'id' ? 'Status Kinerja Mingguan' : 'Weekly Performance Status'}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAssetGainLossType('profit')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        assetGainLossType === 'profit' 
                          ? 'bg-green-500 text-white shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {t('profit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssetGainLossType('loss')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        assetGainLossType === 'loss' 
                          ? 'bg-destructive text-white shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {t('loss')}
                    </button>
                  </div>
                </div>

                {/* Deduct from Cash Balance Checkbox (only when adding) */}
                {isAdding && (
                  <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/40 bg-muted/30">
                    <input
                      id="deductCashToggle"
                      type="checkbox"
                      checked={deductCash}
                      onChange={(e) => setDeductCash(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-input text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
                    <div className="grid gap-0.5 cursor-pointer select-none" onClick={() => setDeductCash(!deductCash)}>
                      <label htmlFor="deductCashToggle" className="text-xs font-bold text-foreground cursor-pointer">
                        {t('deductFromCash')}
                      </label>
                      <p className="text-[10px] text-muted-foreground">
                        {t('deductHelp')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Info Note about realized gain/loss (only when editing) */}
                {editingAsset && (
                  <div className="p-2.5 rounded-lg border border-border/40 bg-muted/30 text-[10px] text-muted-foreground flex gap-1.5 items-start">
                    <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>
                      {t('glAdjustNote')}
                    </span>
                  </div>
                )}

                {/* Recommendation Warning Note specifically for Saham/Crypto */}
                {(assetTypeInput === 'stocks' || assetTypeInput === 'crypto') && (
                  <div className="p-2.5 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20 flex gap-2 items-start text-[11px] text-muted-foreground">
                    <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>
                      {language === 'id'
                        ? "Kategori Saham dan Kripto direkomendasikan untuk diperbarui realized gain/loss-nya secara rutin setiap minggu."
                        : "Stocks and Crypto categories are recommended to have their realized gain/loss updated regularly every week."}
                    </span>
                  </div>
                )}

                {/* Live Net Value Preview */}
                <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 flex items-center justify-between text-xs font-bold text-foreground">
                  <span>{t('netInvestmentValue')}:</span>
                  <span className={`text-base ${parseNum(assetGainLossInput) * (assetGainLossType === 'profit' ? 1 : -1) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                    {formatCurrency(
                      parseNum(assetInitialInput) + parseNum(assetGainLossInput) * (assetGainLossType === 'profit' ? 1 : -1),
                      language
                    )}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <Button 
                  variant="ghost" 
                  onClick={resetForm} 
                  className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors text-xs font-semibold rounded-lg px-4 py-2"
                  type="button"
                >
                  {t('cancel')}
                </Button>
                <Button 
                  onClick={handleSaveAsset} 
                  disabled={!assetNameInput.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer shadow-md text-xs font-semibold rounded-lg px-5 py-2 disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  {t('saveChanges')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PARTIAL LIQUIDATION DIALOG */}
      <Dialog open={partialLiqOpen} onOpenChange={setPartialLiqOpen}>
        <DialogContent className="sm:max-w-[440px] bg-background/95 border-border text-foreground backdrop-blur-xl p-6 shadow-2xl rounded-xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-foreground text-lg font-bold tracking-tight flex items-center gap-2">
              <Coins className="w-5 h-5 text-green-600 dark:text-green-400" />
              {language === 'id' ? 'Likuidasi Sebagian Aset' : 'Partial Asset Liquidation'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {language === 'id' 
                ? "Tarik sebagian modal investasi Anda kembali ke Saldo Tunai aktif." 
                : "Withdraw a portion of your investment capital back to your active Cash Balance."}
            </DialogDescription>
          </DialogHeader>

          {liqAsset && (
            <div className="flex flex-col gap-4">
              <div className="p-3.5 bg-muted/30 rounded-xl border border-border/40 text-xs flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === 'id' ? 'Nama Aset:' : 'Asset Name:'}</span>
                  <span className="font-bold text-foreground">{liqAsset.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === 'id' ? 'Nilai Bersih Saat Ini:' : 'Current Net Value:'}</span>
                  <span className="font-bold text-foreground">
                    {formatCurrency(liqAsset.initialCapital + liqAsset.realizedGainLoss, language)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {language === 'id' ? 'Nominal Likuidasi (Rp)' : 'Liquidation Amount (Rp)'}
                </label>
                <Input
                  type="text"
                  placeholder="0"
                  value={partialLiqAmountInput}
                  onChange={(e) => setPartialLiqAmountInput(formatInputVal(e.target.value))}
                  className="bg-muted/40 border-border text-foreground text-sm py-2 px-3 rounded-lg focus:ring-primary font-number"
                />
                {parseNum(partialLiqAmountInput) > (liqAsset.initialCapital + liqAsset.realizedGainLoss) && (
                  <span className="text-[10px] font-bold text-destructive">
                    {language === 'id'
                      ? "Nominal melebihi nilai bersih aset saat ini!"
                      : "Amount exceeds current net value of this asset!"}
                  </span>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-2 border-t border-border/40">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setPartialLiqOpen(false)
                    setLiqAsset(null)
                    setPartialLiqAmountInput("")
                  }}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors text-xs font-semibold rounded-lg px-4 py-2"
                >
                  {t('cancel')}
                </Button>
                <Button
                  onClick={handleExecutePartialLiquidation}
                  disabled={
                    parseNum(partialLiqAmountInput) <= 0 || 
                    parseNum(partialLiqAmountInput) > (liqAsset.initialCapital + liqAsset.realizedGainLoss)
                  }
                  className="bg-green-600 text-white hover:bg-green-700 cursor-pointer shadow-md text-xs font-semibold rounded-lg px-5 py-2 disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  {language === 'id' ? 'Likuidasi' : 'Liquidate'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ASSET HISTORY DIALOG */}
      <Dialog open={assetHistoryOpen} onOpenChange={setAssetHistoryOpen}>
        <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto scrollbar-none bg-background/95 border-border text-foreground backdrop-blur-xl p-6 shadow-2xl rounded-xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-foreground text-lg font-bold tracking-tight flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              {language === 'id' ? 'Riwayat Penyesuaian Aset' : 'Asset Adjustment History'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {language === 'id'
                ? "Daftar lengkap log aktivitas penyesuaian modal, realized gain/loss, dan likuidasi aset."
                : "A complete list of logs for capital allocation, realized gain/loss, and asset liquidation."}
            </DialogDescription>
          </DialogHeader>

          {selectedHistoryAsset && (
            <div className="flex flex-col gap-4">
              <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 text-xs flex justify-between items-center font-bold">
                <span className="text-muted-foreground">{language === 'id' ? 'Nama Aset:' : 'Asset Name:'}</span>
                <span className="text-foreground text-sm font-extrabold">{selectedHistoryAsset.name}</span>
              </div>

              {/* Dropdown Filter & Export Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-3 rounded-xl border border-border/40 text-xs no-print">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-semibold uppercase">{language === 'id' ? 'Filter:' : 'Filter:'}</span>
                  
                  {/* Interactive Custom Dropdown Filter */}
                  <div className="relative">
                    <button
                      onClick={() => setIsHistoryFilterDropdownOpen(!isHistoryFilterDropdownOpen)}
                      className="px-3.5 py-2 bg-muted/40 hover:bg-muted/70 text-foreground border border-border/80 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-between gap-2 shadow-sm active:scale-95 min-w-[130px]"
                    >
                      <span className="flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5 text-primary" />
                        <span>
                          {
                            {
                              all: language === 'id' ? 'Semua' : 'All',
                              capital_change: language === 'id' ? 'Alokasi Modal' : 'Capital',
                              gain_loss: language === 'id' ? 'Untung/Rugi' : 'Profit & Loss',
                              liquidation: language === 'id' ? 'Likuidasi' : 'Liquidation'
                            }[historyFilter]
                          }
                        </span>
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isHistoryFilterDropdownOpen ? 'transform rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isHistoryFilterDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 mt-2 w-[160px] bg-background/95 border border-border rounded-xl shadow-xl backdrop-blur-md z-50 p-1 flex flex-col gap-0.5"
                        >
                          {([
                            { value: 'all', label: language === 'id' ? 'Semua' : 'All' },
                            { value: 'capital_change', label: language === 'id' ? 'Alokasi Modal' : 'Capital' },
                            { value: 'gain_loss', label: language === 'id' ? 'Untung/Rugi' : 'Profit & Loss' },
                            { value: 'liquidation', label: language === 'id' ? 'Likuidasi' : 'Liquidation' }
                          ] as const).map((opt) => {
                            const isActive = historyFilter === opt.value
                            return (
                              <button
                                key={opt.value}
                                onClick={() => {
                                  setHistoryFilter(opt.value)
                                  setIsHistoryFilterDropdownOpen(false)
                                }}
                                className={`w-full px-3 py-2 rounded-lg text-left text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-2 ${
                                  isActive
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                }`}
                              >
                                <span>{opt.label}</span>
                              </button>
                            )
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <button
                    onClick={() => {
                      exportAssetHistoryToExcel(selectedHistoryAsset.name, filteredLogs, language)
                    }}
                    className="px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white font-bold text-[10px] rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    Excel
                  </button>
                  <button
                    onClick={() => {
                      exportAssetHistoryToPDF(selectedHistoryAsset.name, filteredLogs, language)
                    }}
                    className="px-2.5 py-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[10px] rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    PDF
                  </button>
                </div>
              </div>

              {/* Log History List */}
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {filteredLogs.length > 0 ? (
                  [...filteredLogs].reverse().map((log) => {
                    const badgeColor = {
                      capital_change: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
                      profit: "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20",
                      loss: "bg-destructive/10 text-destructive border border-destructive/20",
                      liquidation: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20"
                    }[log.type]

                    const typeLabel = {
                      capital_change: language === 'id' ? 'Modal' : 'Capital',
                      profit: language === 'id' ? 'Untung' : 'Profit',
                      loss: language === 'id' ? 'Rugi' : 'Loss',
                      liquidation: language === 'id' ? 'Likuidasi' : 'Liquidation'
                    }[log.type]

                    return (
                      <div 
                        key={log.id} 
                        className="p-3 rounded-xl border border-border/80 bg-muted/10 flex flex-col gap-1.5 text-xs hover:border-border transition-all duration-200 animate-in fade-in"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${badgeColor}`}>
                            {typeLabel}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            {formatRelativeDate(log.date, language)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 mt-0.5">
                          <span className="text-muted-foreground font-medium">{log.note}</span>
                          <span className="font-bold text-foreground font-number text-sm">
                            {log.type === 'loss' ? '-' : log.type === 'profit' || log.type === 'liquidation' ? '+' : ''}
                            {formatCurrency(log.amount, language)}
                          </span>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="py-8 text-center flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-xl">
                    <History className="w-8 h-8 text-muted-foreground/30 animate-pulse" />
                    <span className="text-xs text-muted-foreground font-semibold">
                      {language === 'id' ? 'Belum ada log penyesuaian.' : 'No adjustment logs yet.'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-border/40 mt-2">
                <Button
                  onClick={() => {
                    setAssetHistoryOpen(false)
                    setSelectedHistoryAsset(null)
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer shadow-md text-xs font-semibold rounded-lg px-5 py-2"
                >
                  {language === 'id' ? 'Selesai' : 'Close'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PORTFOLIO DELETE & LIQUIDATION CONFIRMATION DIALOG */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto scrollbar-none bg-background/95 border-border text-foreground backdrop-blur-xl p-6 shadow-2xl rounded-xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-foreground text-lg font-bold tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary animate-pulse" />
              {t('liquidateConfirm')}
            </DialogTitle>
          </DialogHeader>

          {assetToDelete && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                {t('liquidateDesc').replace('[nilai]', formatCurrency(assetToDelete.initialCapital + assetToDelete.realizedGainLoss, language))}
              </p>

              <div className="flex flex-col gap-2.5 mt-2">
                {/* Option 1: Liquidate to Cash */}
                {(assetToDelete.initialCapital + assetToDelete.realizedGainLoss) > 0 && (
                  <button
                    onClick={() => handleExecuteDelete(true)}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl border border-green-500/30 bg-green-500/5 hover:bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold transition-all cursor-pointer shadow-sm text-left"
                  >
                    <div>
                      <span className="block text-sm font-extrabold">{t('liquidateOption')}</span>
                      <span className="text-[10px] text-muted-foreground font-semibold mt-0.5 block">
                        {language === 'id' 
                          ? `Saldo Tunai akan bertambah +${formatCurrency(assetToDelete.initialCapital + assetToDelete.realizedGainLoss, language)}`
                          : `Cash Balance will increase by +${formatCurrency(assetToDelete.initialCapital + assetToDelete.realizedGainLoss, language)}`}
                      </span>
                    </div>
                    <span>&rarr;</span>
                  </button>
                )}

                {/* Option 2: Delete Only */}
                <button
                  onClick={() => handleExecuteDelete(false)}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/10 hover:bg-muted/20 text-foreground text-xs font-bold transition-all cursor-pointer text-left"
                >
                  <div>
                    <span className="block text-sm font-extrabold">{t('deleteOnlyOption')}</span>
                    <span className="text-[10px] text-muted-foreground font-semibold mt-0.5 block">
                      {language === 'id'
                        ? "Hapus aset dan HAPUS semua riwayat transaksi terkait agar saldo kembali semula"
                        : "Remove asset and DELETE all related transaction history to restore your balance"}
                    </span>
                  </div>
                  <span>&rarr;</span>
                </button>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-2 border-t border-border/40">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDeleteConfirmOpen(false)
                    setAssetToDelete(null)
                  }}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors text-xs font-semibold rounded-lg px-4 py-2"
                >
                  {t('cancel')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
