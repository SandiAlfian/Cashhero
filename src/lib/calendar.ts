import type { Transaction } from "@/store/useTransactionStore"

export interface CalendarCell {
  date: Date
  isCurrentMonth: boolean
  key: string
}

export interface DailySummary {
  income: number
  expense: number
  txCount: number
}

export interface MtdStats {
  income: number
  expense: number
  net: number
  activeDays: number
}

export const MONTH_NAMES_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

export const MONTH_NAMES_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

export const WEEK_DAYS_ID = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]

export const WEEK_DAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function buildGridCells(currentYear: number, currentMonth: number): CalendarCell[] {
  const firstDay = new Date(currentYear, currentMonth, 1)
  const dayOfWeek = firstDay.getDay()
  const startPadding = dayOfWeek === 0 ? 6 : dayOfWeek - 1

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const prevMonthLastDate = new Date(currentYear, currentMonth, 0).getDate()

  const cells: CalendarCell[] = []

  for (let i = startPadding - 1; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - 1, prevMonthLastDate - i)
    d.setHours(12, 0, 0, 0)
    cells.push({ date: d, isCurrentMonth: false, key: `prev-${prevMonthLastDate - i}` })
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(currentYear, currentMonth, i)
    d.setHours(12, 0, 0, 0)
    cells.push({ date: d, isCurrentMonth: true, key: `curr-${i}` })
  }

  const remaining = 42 - cells.length
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(currentYear, currentMonth + 1, i)
    d.setHours(12, 0, 0, 0)
    cells.push({ date: d, isCurrentMonth: false, key: `next-${i}` })
  }

  return cells
}

export function buildDailySummaryMap(transactions: Transaction[]): Record<string, DailySummary> {
  const map: Record<string, DailySummary> = {}
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
}

export function buildMtdStats(transactions: Transaction[], currentMonth: number, currentYear: number): MtdStats {
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

  return { income, expense, net: income - expense, activeDays: activeDates.size }
}
