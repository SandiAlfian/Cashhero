import { useMemo } from "react"
import type { Transaction } from "@/store/useTransactionStore"
import type { BudgetLimit } from "@/store/usePlanningStore"
import {
  filterByPeriod,
  calculateTotals,
  buildCashFlowData,
  buildDonutData,
  getDaysInPeriod,
  computeStatistics,
  getPeriodSubLabel,
  buildMonthDetailData,
  type PeriodFilter,
} from "@/lib/statistics"

export function useStatisticsCore(
  transactions: Transaction[],
  filter: PeriodFilter,
  startDate: string,
  endDate: string,
  language: string
) {
  const periodSubLabel = useMemo(
    () => getPeriodSubLabel(filter, language),
    [filter, language]
  )

  const filteredTransactions = useMemo(
    () => filterByPeriod(transactions, filter, startDate, endDate),
    [transactions, filter, startDate, endDate]
  )

  const totals = useMemo(
    () => calculateTotals(filteredTransactions),
    [filteredTransactions]
  )

  const displayCashFlow = useMemo(
    () => buildCashFlowData(filteredTransactions, filter, language),
    [filteredTransactions, filter, language]
  )

  const { donutData, totalSpent } = useMemo(
    () => buildDonutData(filteredTransactions, language),
    [filteredTransactions, language]
  )

  return {
    periodSubLabel,
    filteredTransactions,
    totals,
    displayCashFlow,
    donutData,
    totalSpent,
  }
}

export function useAverageAnalysis(
  filteredTransactions: Transaction[],
  budgets: BudgetLimit[],
  filter: PeriodFilter,
  startDate: string,
  endDate: string,
  _language: string // eslint-disable-line @typescript-eslint/no-unused-vars
) {
  const daysInPeriod = useMemo(
    () => getDaysInPeriod(filter, startDate, endDate),
    [filter, startDate, endDate]
  )

  const computed = useMemo(
    () => computeStatistics(filteredTransactions, budgets, daysInPeriod, filter, startDate, endDate),
    [filteredTransactions, budgets, daysInPeriod, filter, startDate, endDate]
  )

  return { daysInPeriod, computed }
}

export function useQuarterlyDetail(
  transactions: Transaction[],
  selectedMonthIndex: number | null
) {
  const monthDetail = useMemo(() => {
    if (selectedMonthIndex === null) return null
    const m = buildMonthDetailData(transactions, selectedMonthIndex)
    return {
      ...m,
      monthlyFlow: m.monthDailyFlow,
    }
  }, [transactions, selectedMonthIndex])

  return monthDetail
}
