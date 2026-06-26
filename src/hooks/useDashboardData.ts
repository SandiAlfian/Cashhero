"use client"

import { useMemo } from "react"
import { useTransactionStore } from "@/store/useTransactionStore"
import { usePortfolioStore } from "@/store/usePortfolioStore"
import { usePlanningStore } from "@/store/usePlanningStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { useTrackedOutflowsStore } from "@/store/useTrackedOutflowsStore"
import {
  type DashboardPeriodFilter,
  filterTransactions,
  buildCashFlowData,
  buildPeriodSubLabel,
} from "@/lib/dashboard"
import type { InvestmentAsset } from "@/store/usePortfolioStore"

export function useDashboardData(filter: DashboardPeriodFilter, startDate: string, endDate: string) {
  const transactions = useTransactionStore((state) => state.transactions)
  const { assets } = usePortfolioStore()
  const goals = usePlanningStore((state) => state.goals)
  const activeCurrency = useSettingsStore((state) => state.currency)
  const trackedItems = useTrackedOutflowsStore((state) => state.items)

  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, filter, startDate, endDate),
    [transactions, filter, startDate, endDate]
  )

  const periodSubLabel = useMemo(() => buildPeriodSubLabel(filter, 'id'), [filter])

  const overallIn = useMemo(
    () => transactions.filter((t) => t.type === 'in' && t.category !== 'Tabungan' && t.category !== 'Piutang').reduce((acc, curr) => acc + curr.amount, 0),
    [transactions]
  )
  const overallOut = useMemo(
    () => transactions.filter((t) => t.type === 'out' && t.category !== 'Piutang').reduce((acc, curr) => acc + curr.amount, 0),
    [transactions]
  )

  const totalReceivables = useMemo(
    () => trackedItems.filter((i) => i.status === 'active').reduce((sum, i) => sum + i.remainingAmount, 0),
    [trackedItems]
  )

  const balance = useMemo(
    () => overallIn - overallOut - totalReceivables,
    [overallIn, overallOut, totalReceivables]
  )

  const totalIn = useMemo(
    () => filteredTransactions.filter((t) => t.type === 'in' && t.category !== 'Tabungan' && t.category !== 'Piutang').reduce((acc, curr) => acc + curr.amount, 0),
    [filteredTransactions]
  )
  const totalOut = useMemo(
    () => filteredTransactions.filter((t) => t.type === 'out' && t.category !== 'Piutang').reduce((acc, curr) => acc + curr.amount, 0),
    [filteredTransactions]
  )

  const totalInvestment = useMemo(
    () => assets.reduce((acc, a) => acc + (a.initialCapital + a.realizedGainLoss), 0),
    [assets]
  )

  const totalSavings = useMemo(
    () => goals.reduce((acc, goal) => acc + goal.collected, 0),
    [goals]
  )

  const netWorth = balance + totalInvestment + totalSavings + totalReceivables
  const recentTransactions = transactions.slice(0, 5)

  return {
    transactions,
    filteredTransactions,
    assets,
    goals,
    activeCurrency,
    periodSubLabel,
    totalIn,
    totalOut,
    balance,
    totalInvestment,
    totalSavings,
    totalReceivables,
    netWorth,
    recentTransactions,
  }
}

export function useDashboardCashFlowData(
  transactions: import("@/store/useTransactionStore").Transaction[],
  filter: DashboardPeriodFilter,
  language: string
) {
  return useMemo(() => buildCashFlowData(transactions, filter, language), [transactions, filter, language])
}

export function usePeriodLabel(filter: DashboardPeriodFilter, language: string) {
  return useMemo(() => buildPeriodSubLabel(filter, language), [filter, language])
}

export function useAssetNeedsUpdate() {
  const { assets } = usePortfolioStore()

  const checkAssetNeedsUpdate = (asset: InvestmentAsset) => {
    if (asset.type !== 'stocks' && asset.type !== 'crypto') return false
    const diffDays = (Date.now() - new Date(asset.lastUpdated).getTime()) / (1000 * 60 * 60 * 24)
    return diffDays >= 7
  }

  const assetsNeedingUpdate = useMemo(() => assets.filter(checkAssetNeedsUpdate), [assets])
  const showBanner = assetsNeedingUpdate.length > 0

  const oldestUpdateDate = useMemo(
    () =>
      assetsNeedingUpdate.reduce(
        (oldest, current) =>
          new Date(current.lastUpdated).getTime() < new Date(oldest).getTime() ? current.lastUpdated : oldest,
        assetsNeedingUpdate[0]?.lastUpdated || new Date().toISOString()
      ),
    [assetsNeedingUpdate]
  )

  return { assetsNeedingUpdate, showBanner, oldestUpdateDate, checkAssetNeedsUpdate }
}
