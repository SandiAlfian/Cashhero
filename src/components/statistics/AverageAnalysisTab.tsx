"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TrendingUp, Wallet, DollarSign, PiggyBank, BarChart3, PieChart, ChevronDown, ShieldCheck, Target, Activity, CheckCircle, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguageStore } from "@/store/useLanguageStore"
import { usePlanningStore } from "@/store/usePlanningStore"
import { formatCurrency, getTranslation } from "@/lib/format"
import { isEndOfPeriod, saveAuditData } from "@/lib/periodUtils"
import { generateSuggestions } from "@/lib/statistics"
import type { Transaction } from "@/store/useTransactionStore"
import type { PeriodFilter } from "@/lib/statistics"
import { useAverageAnalysis as useAvgAnalysis } from "@/hooks/useStatisticsData"
import { InfoMetricCard } from "./InfoMetricCard"
import { OutstandingCard } from "./OutstandingCard"
import { BudgetComparisonChart } from "@/components/charts/BudgetComparisonChart"
import { PieComparisonChart } from "@/components/charts/PieComparisonChart"
import { VarianceDataTable } from "./VarianceDataTable"
import { UnbudgetedCategoryTable } from "./UnbudgetedCategoryTable"
import { AuditScorecard } from "./AuditScorecard"

interface Props {
  filter: PeriodFilter
  filteredTransactions: Transaction[]
  startDate: string
  endDate: string
  periodSubLabel: string
}

export default function AverageAnalysisTab({ filter, filteredTransactions, startDate, endDate }: Props) {
  const language = useLanguageStore((s) => s.language)
  const budgets = usePlanningStore((s) => s.budgets)
  const t = (key: string) => getTranslation(language, key)
  const [chartStyle, setChartStyle] = React.useState<'bar' | 'pie'>('bar')
  const [isChartStyleOpen, setIsChartStyleOpen] = React.useState(false)
  const chartDropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chartDropdownRef.current && !chartDropdownRef.current.contains(event.target as Node)) {
        setIsChartStyleOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const endOfPeriod = React.useMemo(() => isEndOfPeriod(filter), [filter])
  const { computed } = useAvgAnalysis(filteredTransactions, budgets, filter, startDate, endDate, language)

  const suggestions = React.useMemo(
    () => {
      const icons = { AlertTriangle, Target, PiggyBank, CheckCircle, Activity, BarChart3 }
      const _fmt = (amount: number, lang: string) => formatCurrency(amount, lang as 'id' | 'en')
      return generateSuggestions(computed, language, icons, _fmt)
    },
    [computed, language]
  )

  React.useEffect(() => {
    if (!endOfPeriod || suggestions.length === 0 || typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    const lastSent = localStorage.getItem('cashhero-audit-notification-sent')
    const today = new Date().toISOString().slice(0, 10)
    if (lastSent === today) return
    const lang = language as 'id' | 'en'
    const title = lang === 'id' ? 'Laporan Audit Periode' : 'Period Audit Report'
    const topSuggestion = suggestions[0]
    const body = lang === 'id'
      ? `Skor keuangan Anda: ${computed.auditResult.score}/100. ${topSuggestion ? topSuggestion.text.replace(/<[^>]*>/g, '') : 'Lihat rincian di halaman statistik.'}`
      : `Your financial score: ${computed.auditResult.score}/100. ${topSuggestion ? topSuggestion.text.replace(/<[^>]*>/g, '') : 'View details on the statistics page.'}`
    navigator.serviceWorker.ready.then((registration) => {
      registration.active?.postMessage({
        type: 'SHOW_LOCAL_NOTIFICATION',
        payload: { title, options: { body, tag: 'cashhero-audit-report' } }
      })
    })
    localStorage.setItem('cashhero-audit-notification-sent', today)
    saveAuditData({
      score: computed.auditResult.score,
      topSuggestion: topSuggestion.text.replace(/<[^>]*>/g, ''),
      language: lang,
      filter
    })
  }, [endOfPeriod, suggestions, computed.auditResult.score, language, filter])

  if (computed.totalTxCount === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-4">
        <BarChart3 className="w-12 h-12 opacity-20" />
        <p className="text-sm font-medium">{t('emptyStats')}</p>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoMetricCard
          title={t('averageMonthlyIncome')}
          value={formatCurrency(computed.totalIncome, language as 'id' | 'en')}
          icon={TrendingUp}
          colorClass="bg-green-500/10 text-green-600 dark:text-green-400"
          secondaryValue={formatCurrency(computed.dailyAvgIncome, language as 'id' | 'en')}
          secondaryLabel={language === 'id' ? '/hari rata-rata' : '/day avg'}
          description={language === 'id'
            ? 'Total pemasukan dari semua transaksi masuk periode ini'
            : 'Total income from all incoming transactions this period'}
          trend={computed.totalIncome > 0 ? 'up' : 'neutral'}
        />
        <InfoMetricCard
          title={t('averageMonthlyExpense')}
          value={formatCurrency(computed.totalExpense, language as 'id' | 'en')}
          icon={Wallet}
          colorClass="bg-destructive/10 text-destructive"
          secondaryValue={formatCurrency(computed.dailyAvgExpense, language as 'id' | 'en')}
          secondaryLabel={language === 'id'
            ? `/hari · ${computed.expenseRatio.toFixed(0)}% dr pemasukan`
            : `/day · ${computed.expenseRatio.toFixed(0)}% of income`}
          description={language === 'id'
            ? 'Total pengeluaran dari semua transaksi keluar periode ini'
            : 'Total expenses from all outgoing transactions this period'}
          trend={computed.expenseRatio > 80 ? 'down' : computed.expenseRatio > 50 ? 'neutral' : 'up'}
        />
        <InfoMetricCard
          title={t('averageTransactionValue')}
          value={formatCurrency(computed.avgTxValue, language as 'id' | 'en')}
          icon={DollarSign}
          colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          secondaryValue={`${computed.totalTxCount}×`}
          secondaryLabel={language === 'id' ? 'total transaksi dicatat' : 'total transactions recorded'}
          description={language === 'id'
            ? 'Rata-rata nominal per transaksi (pemasukan & pengeluaran)'
            : 'Average amount per transaction (income & expenses)'}
        />
        <InfoMetricCard
          title={t('avgMonthlySavings')}
          value={`${(computed.totalIncome - computed.totalExpense) >= 0 ? '+' : ''}${formatCurrency(computed.totalIncome - computed.totalExpense, language as 'id' | 'en')}`}
          icon={PiggyBank}
          colorClass="bg-purple-500/10 text-purple-600 dark:text-purple-400"
          secondaryValue={`${computed.savingsRate.toFixed(1)}%`}
          secondaryLabel={language === 'id' ? 'rasio tabungan' : 'savings rate'}
          description={language === 'id'
            ? 'Sisa pemasukan setelah dikurangi pengeluaran periode ini'
            : 'Remaining income after deducting expenses this period'}
          trend={computed.savingsRate >= 25 ? 'up' : computed.savingsRate > 0 ? 'neutral' : 'down'}
        />
      </div>

      <OutstandingCard language={language} t={t} />

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-foreground text-lg font-bold flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" />{t('categoryComparison')}</CardTitle>
            <div className="relative no-print" ref={chartDropdownRef}>
              <button onClick={() => setIsChartStyleOpen(!isChartStyleOpen)}
                className="px-3.5 py-2 bg-muted/40 hover:bg-muted/70 text-foreground border border-border/80 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-sm hover:shadow active:scale-95"
              >
                {chartStyle === 'bar' ? <BarChart3 className="w-4 h-4 text-primary" /> : <PieChart className="w-4 h-4 text-primary" />}
                <span>{chartStyle === 'bar' ? t('chartBar') : t('chartPie')}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isChartStyleOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isChartStyleOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-[175px] bg-background/95 border border-border rounded-xl shadow-xl backdrop-blur-md z-50 p-1 flex flex-col gap-0.5"
                  >
                    {(['bar', 'pie'] as const).map((m) => {
                      const isActive = chartStyle === m
                      const Icon = m === 'bar' ? BarChart3 : PieChart
                      return (
                        <button key={m} onClick={() => { setChartStyle(m); setIsChartStyleOpen(false) }}
                          className={`w-full px-3 py-2 rounded-lg text-left text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-2 ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'}`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{m === 'bar' ? t('chartBar') : t('chartPie')}</span>
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {computed.categoryData.length > 0 ? (
            chartStyle === 'bar'
              ? <BudgetComparisonChart data={computed.categoryData} language={language} t={t} />
              : <PieComparisonChart data={computed.categoryData} language={language} t={t} />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
              <BarChart3 className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">{t('noBudgetData')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {computed.categoryData.length > 0 && (
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground text-lg font-bold flex items-center gap-2"><Target className="w-5 h-5 text-primary" />{t('budgetDetail')}</CardTitle>
          </CardHeader>
          <CardContent>
            <VarianceDataTable data={computed.categoryData} language={language} t={t} />
          </CardContent>
        </Card>
      )}

      {computed.unbudgetedCategories.length > 0 && (
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground text-lg font-bold flex items-center gap-2"><Wallet className="w-5 h-5 text-primary" />{t('unbudgetedCategories')}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{t('noBudgetData')}</p>
          </CardHeader>
          <CardContent>
            <UnbudgetedCategoryTable data={computed.unbudgetedCategories} language={language} t={t} />
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground text-lg font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />{t('auditorScoreCard')}
            {endOfPeriod && <span className="text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">{language === 'id' ? 'Akhir Periode' : 'Period End'}</span>}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">{t('auditScoreDesc')}</p>
        </CardHeader>
        <CardContent>
          <AuditScorecard audit={computed.auditResult} language={language} t={t} suggestions={endOfPeriod ? suggestions : []} />
        </CardContent>
      </Card>
    </motion.div>
  )
}
