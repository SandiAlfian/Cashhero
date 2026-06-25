import type { Transaction } from "@/store/useTransactionStore"
import { Variants } from "framer-motion"

export type HistoryFilter = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'customPeriod'

export interface GroupedRow {
  id: string
  label: string
  labelEn: string
  startDate: Date
  endDate: Date
  transactions: Transaction[]
  income: number
  expense: number
  net: number
  txCount: number
}

export const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
}

export const itemVariant: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

export function getPeriodSubLabel(filter: HistoryFilter, language: string): string {
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
}

export function filterTransactionsByPeriod(
  transactions: Transaction[],
  filter: HistoryFilter,
  startDate?: string,
  endDate?: string
): Transaction[] {
  const today = new Date()

  return transactions.filter((tx) => {
    const txDate = new Date(tx.date)

    switch (filter) {
      case 'daily': {
        const start = new Date(today)
        start.setHours(0, 0, 0, 0)
        const end = new Date(today)
        end.setHours(23, 59, 59, 999)
        return txDate >= start && txDate <= end
      }
      case 'weekly': {
        const start = new Date(today.getFullYear(), today.getMonth(), 1)
        start.setHours(0, 0, 0, 0)
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        end.setHours(23, 59, 59, 999)
        return txDate >= start && txDate <= end
      }
      case 'monthly':
      case 'quarterly': {
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
}

function calculateGroupIncome(txs: Transaction[]): number {
  return txs.filter(t => t.type === 'in' && t.category !== 'Tabungan').reduce((sum, t) => sum + t.amount, 0)
}

function calculateGroupExpense(txs: Transaction[]): number {
  return txs.filter(t => t.type === 'out').reduce((sum, t) => sum + t.amount, 0)
}

const MONTHS_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

export function buildWeeklyGroups(transactions: Transaction[], currentYear: number, currentMonth: number): GroupedRow[] {
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

    const inc = calculateGroupIncome(txs)
    const exp = calculateGroupExpense(txs)

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

export function buildMonthlyGroups(transactions: Transaction[], currentYear: number): GroupedRow[] {
  return Array.from({ length: 12 }).map((_, mIdx) => {
    const sDate = new Date(currentYear, mIdx, 1, 0, 0, 0, 0)
    const eDate = new Date(currentYear, mIdx + 1, 0, 23, 59, 59, 999)

    const txs = transactions.filter((t) => {
      const d = new Date(t.date)
      return d.getFullYear() === currentYear && d.getMonth() === mIdx
    })

    const inc = calculateGroupIncome(txs)
    const exp = calculateGroupExpense(txs)

    return {
      id: `m-${mIdx + 1}`,
      label: MONTHS_ID[mIdx],
      labelEn: MONTHS_EN[mIdx],
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

export function buildQuarterlyGroups(transactions: Transaction[], currentYear: number): GroupedRow[] {
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

    const inc = calculateGroupIncome(txs)
    const exp = calculateGroupExpense(txs)

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

export function calculateFilteredTotals(transactions: Transaction[]) {
  const totalIn = transactions
    .filter((t) => t.type === 'in' && t.category !== 'Tabungan')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const totalOut = transactions
    .filter((t) => t.type === 'out')
    .reduce((acc, curr) => acc + curr.amount, 0)

  return { totalIn, totalOut, balance: totalIn - totalOut }
}
