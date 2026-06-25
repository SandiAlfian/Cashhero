"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTransactionStore } from "@/store/useTransactionStore"
import { useLanguageStore } from "@/store/useLanguageStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { formatCurrency, formatDate, getTranslation } from "@/lib/format"
import { Check, History } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { filterTransactionsByPeriod, buildWeeklyGroups, buildMonthlyGroups, buildQuarterlyGroups, getPeriodSubLabel, calculateFilteredTotals, container, itemVariant, type HistoryFilter, type GroupedRow } from "@/lib/history"
import { FilterBar } from "@/components/history/FilterBar"
import { TransactionTable } from "@/components/history/TransactionTable"
import { DrillDownModal } from "@/components/history/DrillDownModal"
import { ExportButtons } from "@/components/history/ExportButtons"
import { GroupedPeriodTable } from "@/components/history/GroupedPeriodTable"

export default function HistoryPage() {
  const transactions = useTransactionStore((state) => state.transactions)
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction)
  const { language } = useLanguageStore()
  const [mounted, setMounted] = React.useState(false)

  const [showToast, setShowToast] = React.useState(false)
  const [toastMessage, setToastMessage] = React.useState('')

  const defaultHistoryFilter = useSettingsStore((state) => state.defaultHistoryFilter)

  const [filter, setFilter] = React.useState<HistoryFilter>(defaultHistoryFilter)

  const [startDate, setStartDate] = React.useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = React.useState(() => {
    return new Date().toISOString().split('T')[0]
  })

  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(null)

  React.useEffect(() => {
    setMounted(true)
    setFilter(defaultHistoryFilter)
    // Reset custom period dates to reasonable defaults when filter changes
    if (defaultHistoryFilter === 'customPeriod') {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 30)
      setStartDate(start.toISOString().split('T')[0])
      setEndDate(end.toISOString().split('T')[0])
    }
  }, [defaultHistoryFilter])

  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3500)
  }

  const t = (key: string) => getTranslation(language, key)

  const filteredTransactions = React.useMemo(
    () => filterTransactionsByPeriod(transactions, filter, startDate, endDate),
    [transactions, filter, startDate, endDate]
  )

  const groupedData = React.useMemo((): GroupedRow[] => {
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()

    if (filter === 'weekly') {
      return buildWeeklyGroups(transactions, currentYear, currentMonth)
    }

    if (filter === 'monthly') {
      return buildMonthlyGroups(transactions, currentYear)
    }

    if (filter === 'quarterly') {
      return buildQuarterlyGroups(transactions, currentYear)
    }

    return []
  }, [transactions, filter])

  const activeGroup = React.useMemo(() => {
    if (!selectedGroupId) return null
    return groupedData.find(g => g.id === selectedGroupId) || null
  }, [selectedGroupId, groupedData])

  const periodSubLabel = React.useMemo(() => getPeriodSubLabel(filter, language), [filter, language])

  const { totalIn, totalOut, balance } = React.useMemo(
    () => calculateFilteredTotals(filteredTransactions),
    [filteredTransactions]
  )

  const isGroupedFilter = filter === 'weekly' || filter === 'monthly' || filter === 'quarterly'

  return (
    <motion.div
      className="flex flex-col gap-6 pb-12"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariant} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-sm">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{t('history')}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{t('historySubtitle')}</p>
          </div>
        </div>

        <ExportButtons
          transactions={filteredTransactions}
          periodLabel={periodSubLabel}
          totals={{ income: totalIn, expense: totalOut, balance }}
          language={language}
        />
      </motion.div>

      <FilterBar
        filter={filter}
        setFilter={setFilter}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        language={language}
        t={t}
      />

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

              {isGroupedFilter ? (
                <GroupedPeriodTable
                  groupedData={groupedData}
                  mounted={mounted}
                  language={language}
                  formatCurrency={formatCurrency}
                  onSelectGroup={setSelectedGroupId}
                />
              ) : (
                <TransactionTable
                  transactions={filteredTransactions}
                  mounted={mounted}
                  formatDate={formatDate}
                  formatCurrency={formatCurrency}
                  language={language}
                  t={t}
                  onDeleteTransaction={deleteTransaction}
                  onTriggerToast={triggerToast}
                />
              )}

            </div>
          </CardContent>
        </Card>
      </motion.div>

      <DrillDownModal
        activeGroup={activeGroup}
        selectedGroupId={selectedGroupId}
        setSelectedGroupId={setSelectedGroupId}
        mounted={mounted}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        language={language}
        t={t}
        onDeleteTransaction={deleteTransaction}
        onTriggerToast={triggerToast}
      />

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
