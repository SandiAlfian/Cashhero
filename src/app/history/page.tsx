"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTransactionStore } from "@/store/useTransactionStore"
import { useLanguageStore, translations } from "@/store/useLanguageStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { formatCurrency, formatDate } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Trash2, Filter, FileSpreadsheet, FileText, Eye, ChevronDown, Check } from "lucide-react"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { exportToExcel, exportToPDF } from "@/lib/export"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface GroupedRow {
  id: string
  label: string
  labelEn: string
  startDate: Date
  endDate: Date
  transactions: ReturnType<typeof useTransactionStore.getState>['transactions']
  income: number
  expense: number
  net: number
  txCount: number
}

// ─── isolated PDF Group Print Helper ──────────────────────────────────────────
function exportGroupToPDF(
  label: string,
  transactions: ReturnType<typeof useTransactionStore.getState>['transactions'],
  totals: { income: number; expense: number; net: number },
  language: 'id' | 'en'
) {
  exportToPDF(
    transactions,
    label,
    { income: totals.income, expense: totals.expense, balance: totals.net },
    language
  )
}

// ─── Animation Variants ──────────────────────────────────────────────────────
const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
}

const itemVariant: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

export default function HistoryPage() {
  const transactions = useTransactionStore((state) => state.transactions)
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction)
  const { language } = useLanguageStore()
  const [mounted, setMounted] = React.useState(false)

  // Toast state
  const [showToast, setShowToast] = React.useState(false)
  const [toastMessage, setToastMessage] = React.useState('')

  const defaultHistoryFilter = useSettingsStore((state) => state.defaultHistoryFilter)

  // Raised filter states - Init with static value to prevent SSR Hydration Mismatch
  const [filter, setFilter] = React.useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'customPeriod'>('weekly')

  React.useEffect(() => {
    setFilter(defaultHistoryFilter)
  }, [defaultHistoryFilter])
  const [isMobileFilterDropdownOpen, setIsMobileFilterDropdownOpen] = React.useState(false)
  
  // Custom Date Period States
  const [startDate, setStartDate] = React.useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = React.useState(() => {
    return new Date().toISOString().split('T')[0]
  })

  // Selected Group State for Drill-Down Modal
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Trigger Toast Notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3500)
  }

  const t = (key: keyof typeof translations['id']) => {
    if (!mounted) return translations['id'][key]
    return translations[language]?.[key] || translations['id'][key]
  }

  // Reactive flat transactions for date filter bounds (used for top-level exports)
  const filteredTransactions = React.useMemo(() => {
    const today = new Date()
    
    return transactions.filter((t) => {
      const txDate = new Date(t.date)
      
      switch (filter) {
        case 'daily': {
          const start = new Date(today)
          start.setHours(0, 0, 0, 0)
          const end = new Date(today)
          end.setHours(23, 59, 59, 999)
          return txDate >= start && txDate <= end
        }
        case 'weekly': {
          // Entire current month
          const start = new Date(today.getFullYear(), today.getMonth(), 1)
          start.setHours(0, 0, 0, 0)
          const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
          end.setHours(23, 59, 59, 999)
          return txDate >= start && txDate <= end
        }
        case 'monthly':
        case 'quarterly': {
          // Entire current year
          const start = new Date(today.getFullYear(), 0, 1)
          start.setHours(0, 0, 0, 0)
          const end = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999)
          return txDate >= start && txDate <= end
        }
        case 'customPeriod': {
          if (!startDate || !endDate) return true
          const start = new Date(startDate)
          start.setHours(0, 0, 0, 0)
          const end = new Date(endDate)
          end.setHours(23, 59, 59, 999)
          return txDate >= start && txDate <= end
        }
        default:
          return true
      }
    })
  }, [transactions, filter, startDate, endDate])

  // Grouped Calculations based on filter type
  const groupedData = React.useMemo((): GroupedRow[] => {
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()

    if (filter === 'weekly') {
      // Group active month into 5 weeks
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
      const weeksDef = [
        { label: "Minggu 1 (Tanggal 1-7)", labelEn: "Week 1 (Date 1-7)", s: 1, e: 7 },
        { label: "Minggu 2 (Tanggal 8-14)", labelEn: "Week 2 (Date 8-14)", s: 8, e: 14 },
        { label: "Minggu 3 (Tanggal 15-21)", labelEn: "Week 3 (Date 15-21)", s: 15, e: 21 },
        { label: "Minggu 4 (Tanggal 22-28)", labelEn: "Week 4 (Date 22-28)", s: 22, e: 28 },
        { label: "Minggu 5 (Tanggal 29+)", labelEn: "Week 5 (Date 29+)", s: 29, e: lastDayOfMonth }
      ]

      return weeksDef.map((w, idx) => {
        const sDate = new Date(currentYear, currentMonth, w.s, 0, 0, 0, 0)
        const eDate = new Date(currentYear, currentMonth, w.e, 23, 59, 59, 999)

        const txs = transactions.filter((t) => {
          const d = new Date(t.date)
          return d >= sDate && d <= eDate
        })

        const inc = txs.filter(t => t.type === 'in' && t.category !== 'Tabungan').reduce((sum, t) => sum + t.amount, 0)
        const exp = txs.filter(t => t.type === 'out').reduce((sum, t) => sum + t.amount, 0)

        return {
          id: `w-${idx + 1}`,
          label: w.label,
          labelEn: w.labelEn,
          startDate: sDate,
          endDate: eDate,
          transactions: txs,
          income: inc,
          expense: exp,
          net: inc - exp,
          txCount: txs.length
        }
      })
    }

    if (filter === 'monthly') {
      // Group active year by 12 months
      const monthsDefId = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
      const monthsDefEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

      return Array.from({ length: 12 }).map((_, mIdx) => {
        const sDate = new Date(currentYear, mIdx, 1, 0, 0, 0, 0)
        const eDate = new Date(currentYear, mIdx + 1, 0, 23, 59, 59, 999)

        const txs = transactions.filter((t) => {
          const d = new Date(t.date)
          return d.getFullYear() === currentYear && d.getMonth() === mIdx
        })

        const inc = txs.filter(t => t.type === 'in' && t.category !== 'Tabungan').reduce((sum, t) => sum + t.amount, 0)
        const exp = txs.filter(t => t.type === 'out').reduce((sum, t) => sum + t.amount, 0)

        return {
          id: `m-${mIdx + 1}`,
          label: monthsDefId[mIdx],
          labelEn: monthsDefEn[mIdx],
          startDate: sDate,
          endDate: eDate,
          transactions: txs,
          income: inc,
          expense: exp,
          net: inc - exp,
          txCount: txs.length
        }
      })
    }

    if (filter === 'quarterly') {
      // Group active year by 4 quarters
      const quartersDef = [
        { label: "Kuartal 1 (Jan-Mar)", labelEn: "Quarter 1 (Jan-Mar)", sMonth: 0, eMonth: 2 },
        { label: "Kuartal 2 (Apr-Jun)", labelEn: "Quarter 2 (Apr-Jun)", sMonth: 3, eMonth: 5 },
        { label: "Kuartal 3 (Jul-Sep)", labelEn: "Quarter 3 (Jul-Sep)", sMonth: 6, eMonth: 8 },
        { label: "Kuartal 4 (Okt-Des)", labelEn: "Quarter 4 (Okt-Des)", sMonth: 9, eMonth: 11 }
      ]

      return quartersDef.map((q, qIdx) => {
        const sDate = new Date(currentYear, q.sMonth, 1, 0, 0, 0, 0)
        const eDate = new Date(currentYear, q.eMonth + 1, 0, 23, 59, 59, 999)

        const txs = transactions.filter((t) => {
          const d = new Date(t.date)
          return d.getFullYear() === currentYear && d.getMonth() >= q.sMonth && d.getMonth() <= q.eMonth
        })

        const inc = txs.filter(t => t.type === 'in' && t.category !== 'Tabungan').reduce((sum, t) => sum + t.amount, 0)
        const exp = txs.filter(t => t.type === 'out').reduce((sum, t) => sum + t.amount, 0)

        return {
          id: `q-${qIdx + 1}`,
          label: q.label,
          labelEn: q.labelEn,
          startDate: sDate,
          endDate: eDate,
          transactions: txs,
          income: inc,
          expense: exp,
          net: inc - exp,
          txCount: txs.length
        }
      })
    }

    return []
  }, [transactions, filter])

  // Drill-down selected group object lookup
  const activeGroup = React.useMemo(() => {
    if (!selectedGroupId) return null
    return groupedData.find(g => g.id === selectedGroupId) || null
  }, [selectedGroupId, groupedData])

  // Sub-labels for page layout
  const periodSubLabel = React.useMemo(() => {
    switch (filter) {
      case 'daily':
        return language === 'id' ? 'Hari ini' : 'Today'
      case 'weekly':
        return language === 'id' ? 'Mingguan (Bulan Ini)' : 'Weekly (This Month)'
      case 'monthly':
        return language === 'id' ? 'Bulanan (Tahun Ini)' : 'Monthly (This Year)'
      case 'quarterly':
        return language === 'id' ? 'Kuarter (Tahun Ini)' : 'Quarterly (This Year)'
      case 'customPeriod':
        return language === 'id' ? 'Periode' : 'Selected Period'
      default:
        return language === 'id' ? 'Total keseluruhan' : 'Overall total'
    }
  }, [filter, language])

  // Calculations for overall totals - excluding Tabungan 'in' only (Tabungan 'out' reduces cash balance)
  const totalIn = React.useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'in' && t.category !== 'Tabungan')
      .reduce((acc, curr) => acc + curr.amount, 0)
  }, [filteredTransactions])

  const totalOut = React.useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'out')
      .reduce((acc, curr) => acc + curr.amount, 0)
  }, [filteredTransactions])

  const balance = React.useMemo(() => {
    return totalIn - totalOut
  }, [totalIn, totalOut])

  // Trigger main window print (A4 print layout)
  const handlePrintMain = () => {
    exportToPDF(
      filteredTransactions,
      periodSubLabel,
      { income: totalIn, expense: totalOut, balance: balance },
      language
    )
  }

  const isGroupedFilter = filter === 'weekly' || filter === 'monthly' || filter === 'quarterly'

  return (
    <motion.div 
      className="flex flex-col gap-6 pb-12"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Title & Top Export buttons */}
      <motion.div variants={itemVariant} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{t('history')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('historySubtitle')}</p>
        </div>
        
        {/* Flat Export panel - present on all filters */}
        <div className="flex items-center gap-2 self-start sm:self-center no-print">
          <button
            onClick={() => {
              exportToExcel(
                filteredTransactions,
                periodSubLabel,
                { income: totalIn, expense: totalOut, balance: balance },
                language
              )
            }}
            className="px-4 py-2.5 bg-muted/40 hover:bg-muted/70 text-foreground border border-border font-semibold text-sm rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer duration-200"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span>{language === 'id' ? 'Ekspor Excel' : 'Export Excel'}</span>
          </button>
          <button
            onClick={handlePrintMain}
            className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer duration-200"
          >
            <FileText className="w-4 h-4" />
            <span>{language === 'id' ? 'Ekspor PDF' : 'Export PDF'}</span>
          </button>
        </div>
      </motion.div>

      {/* FILTER CONTROL BAR */}
      <motion.div variants={itemVariant} className="flex flex-col gap-4 bg-card border border-border p-4 rounded-xl shadow-sm no-print">
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
                onClick={() => setFilter(p)}
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
      </motion.div>

      {/* DYNAMIC TRANSACTIONS RENDER CONTAINER */}
      <motion.div variants={itemVariant}>
        <Card className="bg-card/25 backdrop-blur-lg border-border/40 shadow-xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/20">
            <CardTitle className="text-foreground text-lg font-extrabold">{t('allTransactions')}</CardTitle>
            <CardDescription className="text-xs">
              {periodSubLabel}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              
              {/* GROUPED FILTER TABLE (Weekly, Monthly, Quarterly) */}
              {isGroupedFilter ? (
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow className="border-border/30 hover:bg-muted/40 select-none">
                      <TableHead className="text-muted-foreground font-extrabold text-xs uppercase tracking-wider py-3.5 px-6">
                        {language === 'id' ? 'Periode' : 'Period'}
                      </TableHead>
                      <TableHead className="text-muted-foreground font-extrabold text-xs uppercase tracking-wider py-3.5 text-center px-6">
                        {language === 'id' ? 'Jumlah Transaksi' : 'Transactions Count'}
                      </TableHead>
                      <TableHead className="text-muted-foreground font-extrabold text-xs uppercase tracking-wider py-3.5 text-right px-6">
                        {language === 'id' ? 'Pemasukan (+)' : 'Total Income'}
                      </TableHead>
                      <TableHead className="text-muted-foreground font-extrabold text-xs uppercase tracking-wider py-3.5 text-right px-6">
                        {language === 'id' ? 'Pengeluaran (-)' : 'Total Expense'}
                      </TableHead>
                      <TableHead className="text-muted-foreground font-extrabold text-xs uppercase tracking-wider py-3.5 text-right px-6">
                        {language === 'id' ? 'Saldo Bersih' : 'Net Balance'}
                      </TableHead>
                      <TableHead className="w-[100px] no-print py-3.5 px-6"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedData.map((row) => (
                      <TableRow 
                        key={row.id} 
                        onClick={() => setSelectedGroupId(row.id)}
                        className="border-border/25 hover:bg-primary/5 transition-colors cursor-pointer group select-none"
                      >
                        <TableCell className="font-bold text-foreground py-3.5 px-6">
                          {mounted ? (language === 'id' ? row.label : row.labelEn) : ""}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-muted-foreground py-3.5 px-6">
                          {row.txCount}
                        </TableCell>
                        <TableCell className="text-right text-emerald-500 font-extrabold py-3.5 px-6">
                          {row.income > 0 ? `+${formatCurrency(row.income, language)}` : formatCurrency(0, language)}
                        </TableCell>
                        <TableCell className="text-right text-primary font-extrabold py-3.5 px-6">
                          {row.expense > 0 ? `-${formatCurrency(row.expense, language)}` : formatCurrency(0, language)}
                        </TableCell>
                        <TableCell className={`text-right font-black py-3.5 px-6 ${row.net >= 0 ? "text-emerald-500" : "text-primary"}`}>
                          {row.net < 0 ? "-" : ""}{formatCurrency(Math.abs(row.net), language)}
                        </TableCell>
                        <TableCell className="no-print py-3.5 text-center px-6">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 rounded-lg text-xs font-bold text-muted-foreground group-hover:text-primary hover:bg-primary/10 transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                
                /* FLAT FILTER TABLE (Daily & Custom Period) */
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow className="border-border/30 hover:bg-muted/40">
                      <TableHead className="text-muted-foreground font-extrabold text-xs uppercase tracking-wider py-3.5 px-6">{t('date')}</TableHead>
                      <TableHead className="text-muted-foreground font-extrabold text-xs uppercase tracking-wider py-3.5 px-6">{t('category')}</TableHead>
                      <TableHead className="text-muted-foreground font-extrabold text-xs uppercase tracking-wider py-3.5 px-6">{t('note')}</TableHead>
                      <TableHead className="text-right text-muted-foreground font-extrabold text-xs uppercase tracking-wider py-3.5 px-6">{t('amount')}</TableHead>
                      <TableHead className="w-[80px] no-print py-3.5 px-6"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length > 0 ? filteredTransactions.map((tx) => {
                      const noteDisplay = tx.note === 'Modal awal' ? t('initialNote') : tx.note
                      const categoryDisplay = tx.category === 'Saldo Awal' ? t('initialBalance') : tx.category
                      
                      return (
                        <TableRow key={tx.id} className="border-border/25 hover:bg-muted/45 transition-colors group">
                          <TableCell className="font-bold text-foreground py-3.5 px-6">
                            {mounted ? formatDate(tx.date, language) : ""}
                          </TableCell>
                          <TableCell className="text-muted-foreground py-3.5 px-6">{categoryDisplay}</TableCell>
                          <TableCell className="text-muted-foreground py-3.5 px-6">{noteDisplay}</TableCell>
                          <TableCell className={`text-right font-black text-sm py-3.5 px-6 ${tx.type === 'in' ? 'text-emerald-500' : 'text-foreground'}`}>
                            {tx.type === 'in' ? '+' : '-'}{mounted ? formatCurrency(tx.amount, language) : "Rp 0"}
                          </TableCell>
                          <TableCell className="no-print py-3.5 px-6">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                deleteTransaction(tx.id)
                                triggerToast(t('toastTxDeleted'))
                              }}
                              className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 w-8 opacity-0 group-hover:opacity-100 transition-all cursor-pointer rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    }) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground font-semibold px-6">
                          {t('noTransactions')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}

            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* DRILL-DOWN SUB-PERIOD DETAIL MODAL */}
      <AnimatePresence>
        {activeGroup && (
          <Dialog open={selectedGroupId !== null} onOpenChange={(open) => { if (!open) setSelectedGroupId(null) }}>
            <DialogContent className="max-w-4xl sm:max-w-4xl w-full bg-card border border-border/50 shadow-2xl p-0 overflow-hidden rounded-2xl flex flex-col max-h-[85vh]">
              
              {/* Custom header */}
              <div className="p-6 border-b border-border/30 bg-muted/20 relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 select-none">
                <div>
                  <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                      <FileText className="w-5 h-5" />
                    </span>
                    {language === 'id' ? activeGroup.label : activeGroup.labelEn}
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-1 text-muted-foreground">
                    {language === 'id' 
                      ? `Rincian detail transaksi keuangan dari ${activeGroup.startDate.toLocaleDateString('id-ID')} sampai ${activeGroup.endDate.toLocaleDateString('id-ID')}`
                      : `Detailed transaction records from ${activeGroup.startDate.toLocaleDateString('en-US')} to ${activeGroup.endDate.toLocaleDateString('en-US')}`
                    }
                  </DialogDescription>
                </div>
                
                {/* Isolated sub-period export buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      exportToExcel(
                        activeGroup.transactions,
                        language === 'id' ? activeGroup.label : activeGroup.labelEn,
                        { income: activeGroup.income, expense: activeGroup.expense, balance: activeGroup.net },
                        language
                      )
                    }}
                    className="px-3.5 py-2 bg-muted/40 hover:bg-muted/80 text-foreground border border-border/50 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer duration-200 transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    <span>Excel</span>
                  </button>
                  <button
                    onClick={() => {
                      exportGroupToPDF(
                        language === 'id' ? activeGroup.label : activeGroup.labelEn,
                        activeGroup.transactions,
                        { income: activeGroup.income, expense: activeGroup.expense, net: activeGroup.net },
                        language
                      )
                    }}
                    className="px-3.5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer duration-200 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>

              {/* Sub-period Quick metrics summary */}
              <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-muted/10 border-b border-border/20 shrink-0 select-none">
                <div className="p-3.5 rounded-xl bg-card/50 border border-border/30 flex flex-col">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{t('income')}</span>
                  <span className="text-base font-extrabold text-emerald-500 tracking-tight mt-0.5">
                    {formatCurrency(activeGroup.income, language)}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-card/50 border border-border/30 flex flex-col">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{t('expense')}</span>
                  <span className="text-base font-extrabold text-primary tracking-tight mt-0.5">
                    {formatCurrency(activeGroup.expense, language)}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-card/50 border border-border/30 flex flex-col">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{language === 'id' ? 'Arus Kas Bersih' : 'Net Cash Flow'}</span>
                  <span className={`text-base font-extrabold tracking-tight mt-0.5 ${activeGroup.net >= 0 ? "text-emerald-500" : "text-primary"}`}>
                    {activeGroup.net < 0 ? "-" : ""}{formatCurrency(Math.abs(activeGroup.net), language)}
                  </span>
                </div>
              </div>

              {/* Individual Group Transactions list table */}
              <div className="flex-1 overflow-y-auto p-6 min-h-[180px]">
                <div className="rounded-xl border border-border/40 overflow-hidden bg-card/30 backdrop-blur-md">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="border-border/30">
                        <TableHead className="text-muted-foreground font-extrabold text-xs uppercase tracking-wider py-3.5 px-6">{t('date')}</TableHead>
                        <TableHead className="text-muted-foreground font-extrabold text-xs uppercase tracking-wider py-3.5 px-6">{t('category')}</TableHead>
                        <TableHead className="text-muted-foreground font-extrabold text-xs uppercase tracking-wider py-3.5 px-6">{t('note')}</TableHead>
                        <TableHead className="text-right text-muted-foreground font-extrabold text-xs uppercase tracking-wider py-3.5 px-6">{t('amount')}</TableHead>
                        <TableHead className="w-[80px] py-3.5 px-6"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeGroup.transactions.length > 0 ? activeGroup.transactions.map((tx) => {
                        const noteDisplay = tx.note === 'Modal awal' ? t('initialNote') : tx.note
                        const categoryDisplay = tx.category === 'Saldo Awal' ? t('initialBalance') : tx.category
                        
                        return (
                          <TableRow key={tx.id} className="border-border/20 hover:bg-muted/40 transition-colors group">
                            <TableCell className="font-bold text-foreground py-3.5 px-6">
                              {mounted ? formatDate(tx.date, language) : ""}
                            </TableCell>
                            <TableCell className="text-muted-foreground py-3.5 px-6">{categoryDisplay}</TableCell>
                            <TableCell className="text-muted-foreground py-3.5 px-6">{noteDisplay}</TableCell>
                            <TableCell className={`text-right font-black text-sm py-3.5 px-6 ${tx.type === 'in' ? 'text-emerald-500' : 'text-foreground'}`}>
                              {tx.type === 'in' ? '+' : '-'}{mounted ? formatCurrency(tx.amount, language) : "Rp 0"}
                            </TableCell>
                            <TableCell className="py-3.5 text-center px-6">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  deleteTransaction(tx.id)
                                  triggerToast(t('toastTxDeleted'))
                                }}
                                className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-7 w-7 opacity-0 group-hover:opacity-100 transition-all cursor-pointer rounded-md"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      }) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-muted-foreground font-semibold px-6">
                            {t('noTransactions')}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Premium Toast System */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-6 right-6 md:right-8 z-[10001] flex items-center gap-3 bg-foreground text-background dark:bg-card dark:text-foreground px-4 py-3 rounded-xl shadow-2xl border border-border/80 max-w-sm"
          >
            <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 font-bold" />
            </div>
            <span className="text-xs font-bold leading-normal">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
