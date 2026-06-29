"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTransactionStore } from "@/store/useTransactionStore"
import { useLanguageStore } from "@/store/useLanguageStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { formatCurrency, formatDate, getTranslation } from "@/lib/format"
import { Check, History, Search, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { filterTransactionsByPeriod, buildWeeklyGroups, buildMonthlyGroups, buildQuarterlyGroups, getPeriodSubLabel, calculateFilteredTotals, container, itemVariant, type HistoryFilter, type GroupedRow } from "@/lib/history"
import { FilterBar } from "@/components/history/FilterBar"
import { TransactionTable } from "@/components/history/TransactionTable"
import { DrillDownModal } from "@/components/history/DrillDownModal"
import { EditTransactionDialog } from "@/components/history/EditTransactionDialog"
import { ExportButtons } from "@/components/history/ExportButtons"
import { GroupedPeriodTable } from "@/components/history/GroupedPeriodTable"
import type { Transaction } from "@/store/useTransactionStore"

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
  const [editingTx, setEditingTx] = React.useState<Transaction | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [perPage, setPerPage] = React.useState<number | 'all'>(25)
  const [page, setPage] = React.useState(1)
  const [highlightedTxId, setHighlightedTxId] = React.useState<string | null>(null)

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

  const searchedTransactions = React.useMemo(
    () => {
      const q = searchQuery.trim().toLowerCase()
      if (!q) return filteredTransactions
      return filteredTransactions.filter(
        (tx) =>
          tx.category.toLowerCase().includes(q) ||
          tx.note.toLowerCase().includes(q)
      )
    },
    [filteredTransactions, searchQuery]
  )

  const totalPages = perPage === 'all' ? 1 : Math.max(1, Math.ceil(searchedTransactions.length / perPage))
  const safePage = Math.min(page, totalPages)
  const paginatedTransactions = React.useMemo(
    () => {
      if (perPage === 'all') return searchedTransactions
      const start = (safePage - 1) * perPage
      return searchedTransactions.slice(start, start + perPage)
    },
    [searchedTransactions, perPage, safePage]
  )

  // Reset to page 1 when search or period filter changes
  React.useEffect(() => { setPage(1) }, [searchQuery, filter, startDate, endDate])

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
          <CardHeader className="pb-0 border-b border-border/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4">
              <div>
                <CardTitle className="text-foreground text-lg font-extrabold tracking-tight">{t('allTransactions')}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground/70 mt-0.5">
                  {periodSubLabel} &middot; {searchedTransactions.length} {language === 'id' ? 'transaksi' : 'transactions'}
                </CardDescription>
              </div>
              {!isGroupedFilter && (
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 pointer-events-none" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={language === 'id' ? 'Cari kategori atau catatan...' : 'Search category or note...'}
                    className="pl-9 pr-9 h-10 text-sm bg-muted/30 border-border/40 focus-visible:ring-primary/30 rounded-xl w-full placeholder:text-muted-foreground/40"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
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
                  transactions={paginatedTransactions}
                  mounted={mounted}
                  formatDate={formatDate}
                  formatCurrency={formatCurrency}
                  language={language}
                  t={t}
                  onDeleteTransaction={deleteTransaction}
                  onTriggerToast={triggerToast}
                  onEditTransaction={setEditingTx}
                  highlightedId={highlightedTxId}
                />
              )}

            </div>
            {!isGroupedFilter && searchedTransactions.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 border-t border-border/15 bg-muted/5">
                <div className="flex items-center gap-2.5 text-[13px] text-muted-foreground/70 font-medium">
                  <span>{language === 'id' ? 'Tampil' : 'Show'}</span>
                  <select
                    value={perPage === 'all' ? 'all' : String(perPage)}
                    onChange={(e) => {
                      setPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value))
                      setPage(1)
                    }}
                    className="h-8 rounded-lg border border-border/40 bg-background/60 px-2.5 text-[13px] font-semibold text-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm"
                  >
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="all">{language === 'id' ? 'Semua' : 'All'}</option>
                  </select>
                  <span className="text-muted-foreground/50">
                    &middot; {searchedTransactions.length} {language === 'id' ? 'transaksi' : 'transactions'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={safePage <= 1}
                    onClick={() => setPage(Math.max(1, safePage - 1))}
                    className="h-8 w-8 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 disabled:opacity-25 disabled:pointer-events-none transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {perPage !== 'all' && (
                    <div className="flex items-center gap-1.5 min-w-[72px] justify-center select-none">
                      <span className="text-[13px] font-bold text-foreground/80 tabular-nums">{safePage}</span>
                      <span className="text-muted-foreground/40 text-[13px]">/</span>
                      <span className="text-[13px] font-medium text-muted-foreground/60 tabular-nums">{totalPages}</span>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={perPage !== 'all' && safePage >= totalPages}
                    onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                    className="h-8 w-8 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 disabled:opacity-25 disabled:pointer-events-none transition-all"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
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
        onEditTransaction={setEditingTx}
        highlightedId={highlightedTxId}
      />

      <EditTransactionDialog
        transaction={editingTx}
        open={editingTx !== null}
        onOpenChange={(open) => { if (!open) setEditingTx(null) }}
        onToast={triggerToast}
        onSaved={(id) => {
          setHighlightedTxId(id)
          setTimeout(() => setHighlightedTxId(null), 4000)
        }}
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
