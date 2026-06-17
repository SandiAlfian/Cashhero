"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Coins,
  Calendar as CalendarIcon,
  Check,
  Search
} from "lucide-react"
import { useTransactionStore } from "@/store/useTransactionStore"
import { usePlanningStore } from "@/store/usePlanningStore"
import { useLanguageStore, translations } from "@/store/useLanguageStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { formatCurrency, formatDate } from "@/lib/format"
import { motion, AnimatePresence } from "framer-motion"

export default function CalendarPage() {
  const { language } = useLanguageStore()
  const activeCurrency = useSettingsStore((state) => state.currency)
  const exchangeRates = useSettingsStore((state) => state.exchangeRates)
  const transactions = useTransactionStore((state) => state.transactions)
  const addTransaction = useTransactionStore((state) => state.addTransaction)
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction)

  // Toast state
  const [showToast, setShowToast] = React.useState(false)
  const [toastMessage, setToastMessage] = React.useState('')
  
  const budgets = usePlanningStore((state) => state.budgets)
  const goals = usePlanningStore((state) => state.goals)
  const updateGoal = usePlanningStore((state) => state.updateGoal)

  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Trigger Toast Notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3500)
  }

  // Translations
  const t = (key: keyof typeof translations['id']) => {
    if (!mounted) return translations['id'][key]
    return translations[language]?.[key] || translations['id'][key]
  }

  // Active viewed year and month state
  const [currentYear, setCurrentYear] = React.useState(() => new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = React.useState(() => new Date().getMonth()) // 0-11
  
  // Selected date state (defaults to today)
  const [selectedDate, setSelectedDate] = React.useState<Date>(() => {
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    return today
  })

  // Inline Quick Entry Form states
  const [activeTab, setActiveTab] = React.useState<'in' | 'out' | 'saving'>('out')
  const [amount, setAmount] = React.useState('')
  const [displayAmount, setDisplayAmount] = React.useState('')
  const [category, setCategory] = React.useState('')
  const [note, setNote] = React.useState('')
  const [selectedGoalId, setSelectedGoalId] = React.useState('')
  const [deductCash, setDeductCash] = React.useState(true)
  const [goalSearchQuery, setGoalSearchQuery] = React.useState('')
  const [showGoalDropdown, setShowGoalDropdown] = React.useState(false)
  const [categoryFocus, setCategoryFocus] = React.useState(false)

  // Language helper arrays
  const monthNamesId = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
  const monthNamesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  const activeMonthName = language === 'id' ? monthNamesId[currentMonth] : monthNamesEn[currentMonth]

  const weekDaysId = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
  const weekDaysEn = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const weekDays = language === 'id' ? weekDaysId : weekDaysEn

  // Navigate to previous month
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(prev => prev - 1)
    } else {
      setCurrentMonth(prev => prev - 1)
    }
  }

  // Navigate to next month
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(prev => prev + 1)
    } else {
      setCurrentMonth(prev => prev + 1)
    }
  }

  // Set view to today
  const jumpToToday = () => {
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    setCurrentMonth(today.getMonth())
    setCurrentYear(today.getFullYear())
    setSelectedDate(today)
  }

  // 42-day calendar grid math (Monday-start)
  const gridCells = React.useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const dayOfWeek = firstDay.getDay() // 0 = Sunday, 1 = Monday...
    const startPadding = dayOfWeek === 0 ? 6 : dayOfWeek - 1

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const prevMonthLastDate = new Date(currentYear, currentMonth, 0).getDate()

    const cells: { date: Date; isCurrentMonth: boolean; key: string }[] = []

    // Previous month padding days
    for (let i = startPadding - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1, prevMonthLastDate - i)
      d.setHours(12, 0, 0, 0)
      cells.push({
        date: d,
        isCurrentMonth: false,
        key: `prev-${prevMonthLastDate - i}`
      })
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(currentYear, currentMonth, i)
      d.setHours(12, 0, 0, 0)
      cells.push({
        date: d,
        isCurrentMonth: true,
        key: `curr-${i}`
      })
    }

    // Next month padding days
    const remaining = 42 - cells.length
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(currentYear, currentMonth + 1, i)
      d.setHours(12, 0, 0, 0)
      cells.push({
        date: d,
        isCurrentMonth: false,
        key: `next-${i}`
      })
    }

    return cells
  }, [currentYear, currentMonth])

  // Daily summary map
  const dailySummaryMap = React.useMemo(() => {
    const map: Record<string, { income: number; expense: number; txCount: number }> = {}
    transactions.forEach((tx) => {
      const d = new Date(tx.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (!map[key]) {
        map[key] = { income: 0, expense: 0, txCount: 0 }
      }
      if (tx.type === 'in') {
        map[key].income += tx.amount
      } else {
        map[key].expense += tx.amount
      }
      map[key].txCount += 1
    })
    return map
  }, [transactions])

  // Month-To-Date (MTD) Calculations for viewed month & year
  const mtdStats = React.useMemo(() => {
    let income = 0
    let expense = 0
    const activeDates = new Set<string>()

    transactions.forEach((tx) => {
      const d = new Date(tx.date)
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        if (tx.type === 'in') {
          income += tx.amount
        } else {
          expense += tx.amount
        }
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
        activeDates.add(key)
      }
    })

    return {
      income,
      expense,
      net: income - expense,
      activeDays: activeDates.size
    }
  }, [transactions, currentMonth, currentYear])

  // Transactions on the selected calendar date
  const selectedDateTransactions = React.useMemo(() => {
    const selY = selectedDate.getFullYear()
    const selM = selectedDate.getMonth()
    const selD = selectedDate.getDate()

    return transactions.filter((tx) => {
      const d = new Date(tx.date)
      return d.getFullYear() === selY && d.getMonth() === selM && d.getDate() === selD
    })
  }, [transactions, selectedDate])

  // Inline Category suggestions logic
  const categoryPlaceholder = React.useMemo(() => {
    if (activeTab === 'in') {
      return language === 'id' ? 'Gaji, Bonus, Dividen, dll' : 'Salary, Bonus, Dividend, etc.'
    }
    return language === 'id' ? 'Makanan, Transport, Belanja, dll' : 'Food, Transport, Shopping, etc.'
  }, [activeTab, language])

  const notePlaceholder = React.useMemo(() => {
    if (activeTab === 'in') {
      return language === 'id' ? 'Gaji bulanan, bonus proyek, dll' : 'Monthly salary, project bonus, etc.'
    }
    if (activeTab === 'saving') {
      return language === 'id' ? 'Tabungan bulanan, dana darurat, dll' : 'Monthly savings, emergency fund, etc.'
    }
    return language === 'id' ? 'Makan siang, bensin, token listrik, dll' : 'Lunch, gasoline, electricity token, etc.'
  }, [activeTab, language])

  const filteredCategories = React.useMemo(() => {
    const query = category.trim().toLowerCase()
    if (query.length < 1) return []

    const budgetCats = budgets
      .map((b) => b.category.trim())
      .filter((cat) => cat && cat.toLowerCase().includes(query))
    
    const historyCats = transactions
      .map((t) => t.category.trim())
      .filter((cat) => cat && cat.toLowerCase() !== "saldo awal" && cat.toLowerCase().includes(query))

    const combinedMap = new Map<string, 'budget' | 'history'>()
    historyCats.forEach((cat) => combinedMap.set(cat, 'history'))
    budgetCats.forEach((cat) => combinedMap.set(cat, 'budget'))

    return Array.from(combinedMap.entries()).map(([name, source]) => ({
      name,
      source
    })).slice(0, 5)
  }, [category, budgets, transactions])

  // Saving goals autocomplete
  const filteredGoals = React.useMemo(() => {
    const query = goalSearchQuery.trim().toLowerCase()
    if (!query) return goals
    return goals.filter((g) => g.title.toLowerCase().includes(query))
  }, [goals, goalSearchQuery])

  // Live nominal formatting helper
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "")
    if (!val) {
      setAmount("")
      setDisplayAmount("")
      return
    }
    setAmount(val)
    const rate = exchangeRates[activeCurrency] || 1
    setDisplayAmount(formatCurrency(Number(val) * rate, language))
  }

  // Handle Form Submission
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || isNaN(Number(amount)) || !note) return

    // Selected Date ISO String format
    const txDate = new Date(selectedDate)
    txDate.setHours(12, 0, 0, 0)
    const dateStr = txDate.toISOString()

    const rate = exchangeRates[activeCurrency] || 1
    const amountInIdr = Number(amount) * rate

    if (activeTab === 'saving') {
      if (!selectedGoalId) return
      const goal = goals.find((g) => g.id === selectedGoalId)
      if (!goal) return

      // Update goal (stored in IDR)
      updateGoal(goal.id, goal.title, goal.target, goal.collected + amountInIdr, goal.iconName)

      // Add transaction (stored in IDR)
      addTransaction({
        type: deductCash ? 'out' : 'in',
        amount: amountInIdr,
        category: 'Tabungan',
        note: note.trim(),
        date: dateStr
      })
      triggerToast(t('toastTxAdded'))
    } else {
      if (!category) return
      addTransaction({
        type: activeTab,
        amount: amountInIdr,
        category: category.trim(),
        note: note.trim(),
        date: dateStr
      })
      triggerToast(t('toastTxAdded'))
    }

    // Reset inputs
    setAmount('')
    setDisplayAmount('')
    setCategory('')
    setNote('')
    setSelectedGoalId('')
    setGoalSearchQuery('')
    setShowGoalDropdown(false)
  }

  if (!mounted) return null

  return (
    <div className="flex flex-col gap-6 pb-12 relative">
      
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <CalendarIcon className="w-7 h-7" />
            </span>
            {t('calendar')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t('calendarSubtitle')}</p>
        </div>

        {/* Panel Kontrol Navigasi Bulan */}
        <div className="flex items-center gap-2 bg-card/40 backdrop-blur-md border border-border/40 p-1.5 rounded-xl self-start">
          <Button
            variant="ghost"
            size="icon"
            onClick={prevMonth}
            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-sm font-bold px-3 min-w-[120px] text-center select-none tracking-wide text-foreground">
            {activeMonthName} {currentYear}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextMonth}
            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
          <div className="w-[1px] h-6 bg-border/60 mx-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={jumpToToday}
            className="h-8 px-3 rounded-lg border-border hover:bg-muted/40 text-xs font-semibold"
          >
            {language === 'id' ? 'Hari Ini' : 'Today'}
          </Button>
        </div>
      </div>

      {/* 4 Kartu Metrik Bulanan Teratas (MTD) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Pemasukan */}
        <Card className="bg-card/30 backdrop-blur-md border-border/40 hover:border-emerald-500/20 hover:bg-card/50 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl transition-all duration-300 group-hover:scale-155" />
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">{t('income')}</span>
              <span className="text-lg font-black text-emerald-500 tracking-tight mt-1">
                {formatCurrency(mtdStats.income, language)}
              </span>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl">
              <ArrowUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Pengeluaran */}
        <Card className="bg-card/30 backdrop-blur-md border-border/40 hover:border-primary/20 hover:bg-card/50 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl transition-all duration-300 group-hover:scale-155" />
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">{t('expense')}</span>
              <span className="text-lg font-black text-primary tracking-tight mt-1">
                {formatCurrency(mtdStats.expense, language)}
              </span>
            </div>
            <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-xl">
              <ArrowDown className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Selisih Bersih */}
        <Card className="bg-card/30 backdrop-blur-md border-border/40 hover:border-blue-500/20 hover:bg-card/50 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl transition-all duration-300 group-hover:scale-155" />
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
                {language === 'id' ? 'Saldo Bersih' : 'Net Balance'}
              </span>
              <span className={`text-lg font-black tracking-tight mt-1 ${mtdStats.net >= 0 ? "text-emerald-500" : "text-primary"}`}>
                {mtdStats.net < 0 ? "-" : ""}{formatCurrency(Math.abs(mtdStats.net), language)}
              </span>
            </div>
            <div className={`p-3 rounded-xl border ${mtdStats.net >= 0 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-primary/10 border-primary/20 text-primary"}`}>
              <Coins className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Hari Aktif */}
        <Card className="bg-card/30 backdrop-blur-md border-border/40 hover:border-amber-500/20 hover:bg-card/50 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl transition-all duration-300 group-hover:scale-155" />
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">{t('activeDays')}</span>
              <span className="text-lg font-black text-amber-500 tracking-tight mt-1">
                {mtdStats.activeDays} {language === 'id' ? 'Hari' : 'Days'}
              </span>
            </div>
            <div className="p-3 bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 dark:border-amber-900/30 text-amber-500 dark:text-amber-400 rounded-xl">
              <CalendarIcon className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid Layout: Calendar on left, Details Panel + Form on right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Calendar Grid Container (Spans 8 columns) */}
        <Card className="xl:col-span-8 bg-card/25 backdrop-blur-lg border-border/40 overflow-hidden shadow-2xl">
          <CardContent className="p-0">
            
            {/* Kalender Grid Header (Mon-Sun) */}
            <div className="grid grid-cols-7 border-b border-border/30 bg-muted/20 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground select-none">
              {weekDays.map((day, idx) => (
                <div 
                  key={day} 
                  className={`py-3 ${idx >= 5 ? "bg-muted/10 text-primary/80 font-black dark:text-pink-400" : ""}`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Kalender Cells Grid */}
            <div className="grid grid-cols-7 bg-transparent divide-x divide-y divide-border/20">
              {gridCells.map((cell, idx) => {
                const cellY = cell.date.getFullYear()
                const cellM = cell.date.getMonth()
                const cellD = cell.date.getDate()
                
                const key = `${cellY}-${String(cellM + 1).padStart(2, '0')}-${String(cellD).padStart(2, '0')}`
                const stats = dailySummaryMap[key]

                // Today condition
                const today = new Date()
                const isToday = cellY === today.getFullYear() && cellM === today.getMonth() && cellD === today.getDate()

                // Selected date condition
                const isSelected = cellY === selectedDate.getFullYear() && cellM === selectedDate.getMonth() && cellD === selectedDate.getDate()

                // Weekend column check (Saturday & Sunday are columns 5 and 6)
                const isWeekend = idx % 7 === 5 || idx % 7 === 6

                return (
                  <div
                    key={cell.key}
                    onClick={() => {
                      setSelectedDate(cell.date)
                      // If user clicks a padding cell, transition current viewed month automatically
                      if (cellM !== currentMonth) {
                        setCurrentMonth(cellM)
                        setCurrentYear(cellY)
                      }
                    }}
                    className={`min-h-[90px] md:min-h-[110px] p-2 flex flex-col justify-between cursor-pointer transition-all duration-300 relative group overflow-hidden ${
                      cell.isCurrentMonth ? "text-foreground" : "text-muted-foreground/35 bg-black/5 dark:bg-white/[0.01]"
                    } ${
                      isWeekend && cell.isCurrentMonth ? "bg-primary/[0.01] dark:bg-pink-500/[0.01]" : ""
                    } ${
                      isSelected 
                        ? "bg-primary/5 border-2 border-primary shadow-[0_0_24px_rgba(157,21,72,0.15)] ring-1 ring-primary z-20" 
                        : "hover:bg-muted/30"
                    }`}
                  >
                    
                    {/* Ring for today */}
                    {isToday && (
                      <div className="absolute inset-0.5 border border-amber-500/40 dark:border-amber-400/50 rounded-lg animate-pulse z-0 pointer-events-none" />
                    )}

                    {/* Date Number Header */}
                    <div className="flex items-center justify-between select-none z-10">
                      <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-between leading-none p-1 ${
                        isToday 
                          ? "bg-amber-500 text-white font-black shadow-md dark:bg-amber-500" 
                          : isWeekend && cell.isCurrentMonth 
                            ? "text-primary dark:text-pink-400 font-extrabold" 
                            : ""
                      }`}>
                        {cellD}
                      </span>
                      
                      {/* Active Indicator count dot */}
                      {stats && stats.txCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 font-bold rounded bg-muted/40 border border-border/50 text-muted-foreground leading-none">
                          {stats.txCount}
                        </span>
                      )}
                    </div>

                    {/* Daily Cashflow labels in cell */}
                    <div className="flex flex-col gap-0.5 mt-auto z-10 w-full overflow-hidden select-none">
                      {stats && stats.income > 0 && cell.isCurrentMonth && (
                        <span className="text-[9px] font-bold text-emerald-500 dark:text-emerald-400 leading-none tracking-tighter truncate md:block hidden">
                          +{formatCurrency(stats.income, language).replace(/[^\d.,]/g, "")}
                        </span>
                      )}
                      {stats && stats.expense > 0 && cell.isCurrentMonth && (
                        <span className="text-[9px] font-bold text-primary dark:text-pink-500 leading-none tracking-tighter truncate md:block hidden">
                          -{formatCurrency(stats.expense, language).replace(/[^\d.,]/g, "")}
                        </span>
                      )}
                      
                      {/* Visual Indicator dots for mobile */}
                      <div className="flex gap-1 justify-center md:hidden mt-1">
                        {stats && stats.income > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        )}
                        {stats && stats.expense > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Detail Panel & Form Container (Spans 4 columns) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          
          {/* 1. Selected Date Details Panel */}
          <Card className="bg-card/25 backdrop-blur-lg border-border/40 overflow-hidden shadow-xl">
            <CardHeader className="pb-3 border-b border-border/30">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <CalendarIcon className="w-4 h-4 text-primary" />
                {formatDate(selectedDate.toISOString(), language).split(" pukul")[0]}
              </CardTitle>
              <CardDescription className="text-xs">
                {language === 'id' ? 'Daftar transaksi tercatat di tanggal terpilih.' : 'List of transactions on the selected date.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              
              <AnimatePresence mode="popLayout">
                {selectedDateTransactions.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-8 text-center"
                  >
                    <div className="p-3 bg-muted/10 border border-border/30 text-muted-foreground rounded-2xl mb-3">
                      <Coins className="w-6 h-6 opacity-60" />
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground max-w-[200px]">
                      {t('noTransactionsDate')}
                    </p>
                  </motion.div>
                ) : (
                  <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
                    {selectedDateTransactions.map((tx) => (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/30 hover:border-border/60 transition-all duration-200 group"
                      >
                        <div className="flex flex-col gap-0.5 min-w-0 max-w-[70%]">
                          <span className="text-xs font-bold text-foreground truncate">
                            {tx.category === 'Tabungan' ? `💰 ${tx.category}` : tx.category}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate italic">
                            {tx.note}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className={`text-xs font-extrabold ${tx.type === 'in' ? "text-emerald-500" : "text-primary"}`}>
                            {tx.type === 'in' ? "+" : "-"}{formatCurrency(tx.amount, language).replace(/[^\d.,]/g, "")}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              deleteTransaction(tx.id)
                              triggerToast(t('toastTxDeleted'))
                            }}
                            className="w-7 h-7 hover:bg-primary/10 hover:text-primary text-muted-foreground/60 transition-colors rounded-md"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* 2. Integrated Inline Transaction Entry Form */}
          <Card className="bg-card/25 backdrop-blur-lg border-border/40 overflow-hidden shadow-xl">
            <CardHeader className="pb-3 border-b border-border/30">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <Plus className="w-4.5 h-4.5 text-primary" />
                {t('addTransactionDate')} {selectedDate.getDate()} {activeMonthName}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleSaveTransaction} className="flex flex-col gap-4">
                
                {/* 3 tabs: Pengeluaran, Pemasukan, Tabungan */}
                <div className="grid grid-cols-3 bg-muted/40 p-1 rounded-lg border border-border/30">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('out')
                      setCategory('')
                    }}
                    className={`py-1.5 text-xs font-extrabold rounded-md transition-all duration-300 ${
                      activeTab === 'out'
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {language === 'id' ? 'Keluar' : 'Expense'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('in')
                      setCategory('')
                    }}
                    className={`py-1.5 text-xs font-extrabold rounded-md transition-all duration-300 ${
                      activeTab === 'in'
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {language === 'id' ? 'Masuk' : 'Income'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('saving')
                      setCategory('Tabungan')
                    }}
                    className={`py-1.5 text-xs font-extrabold rounded-md transition-all duration-300 ${
                      activeTab === 'saving'
                        ? "bg-amber-500 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {language === 'id' ? 'Tabungan' : 'Savings'}
                  </button>
                </div>

                {/* Nominal Input (Rp) */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="calendarNominalInput" className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80">
                    {t('amountLabel').replace('(Rp)', `(${activeCurrency})`)}
                  </label>
                  <div className="relative">
                    <CurrencyInput
                      id="calendarNominalInput"
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="0"
                      className="pl-3 pr-4 py-2 font-black text-sm text-foreground bg-muted/20 border-border/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-lg placeholder-muted-foreground/45"
                      required
                    />
                  </div>
                  {displayAmount && (
                    <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold ml-1">
                      {t('livePreview')} {displayAmount}
                    </span>
                  )}
                </div>

                {/* Category Input (hidden / prefilled if Tabungan) */}
                {activeTab !== 'saving' ? (
                  <div className="flex flex-col gap-1.5 relative">
                    <label htmlFor="calendarCategoryInput" className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80">
                      {t('categoryLabel')}
                    </label>
                    <Input
                      id="calendarCategoryInput"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      onFocus={() => setCategoryFocus(true)}
                      onBlur={() => setTimeout(() => setCategoryFocus(false), 200)}
                      placeholder={categoryPlaceholder}
                      className="px-3 py-2 text-sm text-foreground bg-muted/20 border-border/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-lg placeholder-muted-foreground/45"
                      required
                    />

                    {/* Autocomplete Category suggestions */}
                    {categoryFocus && filteredCategories.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-card/95 border border-border/40 rounded-lg shadow-2xl p-1 z-35 backdrop-blur-md">
                        {filteredCategories.map((item) => (
                          <div
                            key={item.name}
                            onMouseDown={() => setCategory(item.name)}
                            className="px-2.5 py-1.5 text-xs text-foreground hover:bg-muted/40 cursor-pointer rounded-md flex items-center justify-between"
                          >
                            <span className="font-bold">{item.name}</span>
                            <span className="text-[9px] px-1 py-0.5 rounded bg-muted/50 text-muted-foreground/80 uppercase font-bold tracking-wider">
                              {item.source === 'budget' ? t('budgetSuggestion') : t('historySuggestion')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Savings target selection (Premium Select2 style autocomplete search) */
                  <div className="flex flex-col gap-1.5 relative">
                    <label htmlFor="calendarGoalSearchInput" className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80">
                      {t('selectSavingGoal')}
                    </label>
                    {goals.length > 0 ? (
                      <div className="relative">
                        <Input
                          id="calendarGoalSearchInput"
                          placeholder={language === 'id' ? 'Cari target tabungan...' : 'Search saving goal...'}
                          value={goalSearchQuery}
                          onChange={(e) => {
                            setGoalSearchQuery(e.target.value)
                            setShowGoalDropdown(true)
                          }}
                          onFocus={() => setShowGoalDropdown(true)}
                          onBlur={() => setTimeout(() => setShowGoalDropdown(false), 200)}
                          className="pl-8 pr-8 py-2 text-sm bg-muted/20 border-border/40 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                        <Search className="w-4 h-4 text-muted-foreground/60 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        
                        {selectedGoalId && (
                          <Check className="w-4.5 h-4.5 text-emerald-500 absolute right-2.5 top-1/2 -translate-y-1/2 font-bold" />
                        )}

                        {/* Dropdown list for Select2 simulation */}
                        {showGoalDropdown && filteredGoals.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-card/95 border border-border/40 rounded-lg shadow-2xl p-1 z-35 backdrop-blur-md max-h-[160px] overflow-y-auto">
                            {filteredGoals.map((goal) => (
                              <div
                                key={goal.id}
                                onMouseDown={() => {
                                  setSelectedGoalId(goal.id)
                                  setGoalSearchQuery(goal.title)
                                  setNote(t('savingNoteTemplate').replace('[Nama Target]', goal.title).replace('[Goal Name]', goal.title))
                                }}
                                className={`px-2.5 py-1.5 text-xs rounded-md cursor-pointer flex items-center justify-between ${
                                  selectedGoalId === goal.id 
                                    ? "bg-primary/10 text-primary font-bold" 
                                    : "text-foreground hover:bg-muted/40"
                                }`}
                              >
                                <span className="truncate">🎯 {goal.title}</span>
                                <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                                  {formatCurrency(goal.collected, language)} / {formatCurrency(goal.target, language)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {showGoalDropdown && filteredGoals.length === 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-card/95 border border-border p-3 text-center text-xs text-muted-foreground rounded-lg z-35 select-none">
                            {language === 'id' ? 'Tidak ada target tabungan yang cocok' : 'No matching saving goals'}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        <p className="text-xs font-semibold text-primary">{t('noSavingGoalsWarning')}</p>
                      </div>
                    )}

                    {/* Deduct from cash checkbox inside Saving tab */}
                    {goals.length > 0 && (
                      <div className="flex items-start gap-2.5 mt-2 bg-muted/10 p-2 rounded-lg border border-border/30">
                        <input
                          id="calendarDeductCashInput"
                          type="checkbox"
                          checked={deductCash}
                          onChange={(e) => setDeductCash(e.target.checked)}
                          className="w-3.5 h-3.5 mt-0.5 accent-primary cursor-pointer"
                        />
                        <div className="flex flex-col gap-0.5 cursor-pointer" onClick={() => setDeductCash(!deductCash)}>
                          <span className="text-[11px] font-bold text-foreground leading-none">{t('deductFromCash')}</span>
                          <span className="text-[9px] text-muted-foreground leading-normal">{t('deductHelp')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Catatan (Note) */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="calendarNoteInput" className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80">
                    {t('noteLabel')}
                  </label>
                  <Input
                    id="calendarNoteInput"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={notePlaceholder}
                    className="px-3 py-2 text-sm text-foreground bg-muted/20 border-border/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-lg placeholder-muted-foreground/45"
                    required
                  />
                </div>

                {/* Simpan Button */}
                <Button
                  type="submit"
                  disabled={!amount || !note || (activeTab !== 'saving' && !category) || (activeTab === 'saving' && !selectedGoalId)}
                  className="w-full mt-2 h-9 text-xs font-extrabold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg disabled:opacity-50 transition-all duration-300"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  {t('save')}
                </Button>
              </form>
            </CardContent>
          </Card>

        </div>

      </div>

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
    </div>
  )
}
