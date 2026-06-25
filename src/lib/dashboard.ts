import type { Transaction } from "@/store/useTransactionStore"
import {
  DAYS_ID, DAYS_EN,
  MONTHS_ID, MONTHS_EN,
  MONTHS_FULL_ID, MONTHS_FULL_EN,
} from "./statistics"

export type DashboardPeriodFilter = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'customPeriod'

export interface CfDataPoint {
  date: string
  dateEn: string
  income: number
  expense: number
}

export function filterTransactions(
  transactions: Transaction[],
  filter: DashboardPeriodFilter,
  startDate: string,
  endDate: string
): Transaction[] {
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
      const diff = today.getDate() - day + (day === 0 ? -6 : 1)
      const startOfWeek = new Date(today)
      startOfWeek.setDate(diff)
      startOfWeek.setHours(0, 0, 0, 0)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 7)
      return txDate >= startOfWeek && txDate < endOfWeek
    }
    if (filter === 'monthly') {
      return txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear()
    }
    if (filter === 'quarterly') {
      const quarter = Math.floor(today.getMonth() / 3)
      const startMonth = quarter * 3
      return txDate.getMonth() >= startMonth && txDate.getMonth() < startMonth + 3 && txDate.getFullYear() === today.getFullYear()
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
}

export function buildPeriodSubLabel(filter: DashboardPeriodFilter, language: string): string {
  switch (filter) {
    case 'daily': return language === 'id' ? 'Hari ini' : 'Today'
    case 'weekly': return language === 'id' ? 'Minggu ini' : 'This week'
    case 'monthly': return language === 'id' ? 'Bulan ini' : 'This month'
    case 'quarterly': return language === 'id' ? 'Kuartal ini' : 'This quarter'
    case 'customPeriod': return language === 'id' ? 'Periode Terpilih' : 'Selected Period'
    default: return language === 'id' ? 'Total keseluruhan' : 'Overall total'
  }
}

export function buildCashFlowData(
  transactions: Transaction[],
  filter: DashboardPeriodFilter,
  language: string
): CfDataPoint[] {
  if (filter === 'daily') {
    const hourlyIncome = Array(24).fill(0)
    const hourlyExpense = Array(24).fill(0)

    transactions.forEach((tx) => {
      const d = new Date(tx.date)
      const hr = d.getHours()
      if (tx.type === 'in') hourlyIncome[hr] += tx.amount
      else hourlyExpense[hr] += tx.amount
    })

    const pts: CfDataPoint[] = []
    for (let h = 0; h < 24; h++) {
      const label = `${String(h).padStart(2, '0')}:00`
      pts.push({ date: label, dateEn: label, income: hourlyIncome[h], expense: hourlyExpense[h] })
    }
    return pts
  }

  if (filter === 'weekly') {
    const dailyIncome = Array(7).fill(0)
    const dailyExpense = Array(7).fill(0)

    transactions.forEach((tx) => {
      const d = new Date(tx.date)
      let dayIdx = d.getDay()
      dayIdx = dayIdx === 0 ? 6 : dayIdx - 1
      if (tx.type === 'in') dailyIncome[dayIdx] += tx.amount
      else dailyExpense[dayIdx] += tx.amount
    })

    return DAYS_ID.map((dId, idx) => ({
      date: dId,
      dateEn: DAYS_EN[idx],
      income: dailyIncome[idx],
      expense: dailyExpense[idx],
    }))
  }

  if (filter === 'monthly') {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const totalDays = new Date(year, month + 1, 0).getDate()

    const dailyIncome = Array(totalDays).fill(0)
    const dailyExpense = Array(totalDays).fill(0)

    transactions.forEach((tx) => {
      const d = new Date(tx.date)
      if (d.getMonth() === month && d.getFullYear() === year) {
        const dayIdx = d.getDate() - 1
        if (tx.type === 'in') dailyIncome[dayIdx] += tx.amount
        else dailyExpense[dayIdx] += tx.amount
      }
    })

    const mLabelId = MONTHS_ID[month]
    const mLabelEn = MONTHS_EN[month]
    const pts: CfDataPoint[] = []
    for (let day = 1; day <= totalDays; day++) {
      pts.push({
        date: `${day} ${mLabelId}`,
        dateEn: `${mLabelEn} ${day}`,
        income: dailyIncome[day - 1],
        expense: dailyExpense[day - 1],
      })
    }
    return pts
  }

  if (filter === 'quarterly') {
    const today = new Date()
    const quarter = Math.floor(today.getMonth() / 3)
    const startMonth = quarter * 3

    const monthlyIncome = Array(3).fill(0)
    const monthlyExpense = Array(3).fill(0)

    transactions.forEach((tx) => {
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
        date: MONTHS_FULL_ID[actualMonth],
        dateEn: MONTHS_FULL_EN[actualMonth],
        income: monthlyIncome[idx],
        expense: monthlyExpense[idx],
      })
    }
    return pts
  }

  const grouped: Record<string, { income: number; expense: number; dateRaw: string }> = {}
  transactions.forEach((tx) => {
    const d = new Date(tx.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!grouped[key]) grouped[key] = { income: 0, expense: 0, dateRaw: tx.date }
    if (tx.type === 'in') grouped[key].income += tx.amount
    else grouped[key].expense += tx.amount
  })

  const sorted = Object.keys(grouped).sort()
  const pts: CfDataPoint[] = sorted.map((k) => {
    const v = grouped[k]
    const d = new Date(v.dateRaw)
    const day = String(d.getDate()).padStart(2, '0')
    return {
      date: `${day} ${MONTHS_ID[d.getMonth()]}`,
      dateEn: `${MONTHS_EN[d.getMonth()]} ${day}`,
      income: v.income,
      expense: v.expense,
    }
  })
  if (pts.length === 1) {
    return [{ date: language === 'id' ? 'Mulai' : 'Start', dateEn: 'Start', income: 0, expense: 0 }, ...pts]
  }
  return pts
}

export const PERIOD_FILTERS: DashboardPeriodFilter[] = [
  'daily', 'weekly', 'monthly', 'quarterly', 'customPeriod',
] as const
