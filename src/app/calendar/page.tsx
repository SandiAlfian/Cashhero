"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Check
} from "lucide-react"
import { useTransactionStore } from "@/store/useTransactionStore"
import { useLanguageStore } from "@/store/useLanguageStore"
import { formatCurrency, getTranslation } from "@/lib/format"
import { motion, AnimatePresence } from "framer-motion"
import { buildGridCells, buildDailySummaryMap, buildMtdStats, MONTH_NAMES_ID, MONTH_NAMES_EN, WEEK_DAYS_ID, WEEK_DAYS_EN } from "@/lib/calendar"
import { MtdStatCards } from "@/components/calendar/MtdStatCards"
import { CalendarGrid } from "@/components/calendar/CalendarGrid"
import { SelectedDateTransactions } from "@/components/calendar/SelectedDateTransactions"
import { QuickEntryForm } from "@/components/calendar/QuickEntryForm"

export default function CalendarPage() {
  const { language } = useLanguageStore()
  const transactions = useTransactionStore((state) => state.transactions)
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction)

  const [showToast, setShowToast] = React.useState(false)
  const [toastMessage, setToastMessage] = React.useState('')

  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3500)
  }

  const t = (key: string) => getTranslation(language, key)

  const [currentYear, setCurrentYear] = React.useState(() => new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = React.useState(() => new Date().getMonth())

  const [selectedDate, setSelectedDate] = React.useState<Date>(() => {
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    return today
  })

  const activeMonthName = language === 'id' ? MONTH_NAMES_ID[currentMonth] : MONTH_NAMES_EN[currentMonth]
  const weekDays = language === 'id' ? WEEK_DAYS_ID : WEEK_DAYS_EN

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(prev => prev - 1)
    } else {
      setCurrentMonth(prev => prev - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(prev => prev + 1)
    } else {
      setCurrentMonth(prev => prev + 1)
    }
  }

  const jumpToToday = () => {
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    setCurrentMonth(today.getMonth())
    setCurrentYear(today.getFullYear())
    setSelectedDate(today)
  }

  const gridCells = React.useMemo(() => buildGridCells(currentYear, currentMonth), [currentYear, currentMonth])
  const dailySummaryMap = React.useMemo(() => buildDailySummaryMap(transactions), [transactions])
  const mtdStats = React.useMemo(() => buildMtdStats(transactions, currentMonth, currentYear), [transactions, currentMonth, currentYear])

  const selectedDateTransactions = React.useMemo(() => {
    const selY = selectedDate.getFullYear()
    const selM = selectedDate.getMonth()
    const selD = selectedDate.getDate()

    return transactions.filter((tx) => {
      const d = new Date(tx.date)
      return d.getFullYear() === selY && d.getMonth() === selM && d.getDate() === selD
    })
  }, [transactions, selectedDate])

  if (!mounted) return null

  return (
    <div className="flex flex-col gap-6 pb-12 relative">

  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div className="flex items-center gap-3">
      <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-sm">
        <CalendarIcon className="w-6 h-6" />
      </div>
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{t('calendar')}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{t('calendarSubtitle')}</p>
      </div>
    </div>

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

      <MtdStatCards
        mtdStats={mtdStats}
        language={language}
        t={t}
        formatCurrency={formatCurrency}
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

        <CalendarGrid
          gridCells={gridCells}
          dailySummaryMap={dailySummaryMap}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          setCurrentYear={setCurrentYear}
          weekDays={weekDays}
          formatCurrency={formatCurrency}
          language={language}
        />

        <div className="xl:col-span-4 flex flex-col gap-6">

          <SelectedDateTransactions
            selectedDateTransactions={selectedDateTransactions}
            selectedDate={selectedDate}
            formatCurrency={formatCurrency}
            language={language}
            t={t}
            onDeleteTransaction={deleteTransaction}
            onTriggerToast={triggerToast}
          />

          <QuickEntryForm
            selectedDate={selectedDate}
            activeMonthName={activeMonthName}
            formatCurrency={formatCurrency}
            onTriggerToast={triggerToast}
          />

        </div>

      </div>

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
