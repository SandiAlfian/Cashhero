import type { Transaction } from "@/store/useTransactionStore"
import type { BudgetLimit } from "@/store/usePlanningStore"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CashFlowDataPoint {
  date: string
  dateEn: string
  income: number
  expense: number
}

export interface DonutDataPoint {
  category: string
  categoryEn: string
  amount: number
  color: string
  percentage: number
}

export interface CategoryMonthData {
  category: string
  limit: number
  periodBudget: number
  periodActual: number
  variance: number
  usagePercent: number
  status: 'optimal' | 'frugal' | 'overbudget' | 'critical'
}

export interface UnbudgetedCategoryData {
  category: string
  txCount: number
  avgPerTransaction: number
  totalSpent: number
}

export interface AuditResult {
  score: number
  savingsRateScore: number
  budgetComplianceScore: number
  volatilityScore: number
  savingsRate: number
  complianceRate: number
  volatility: number
  hasBudgets: boolean
  dataQuality: number
}

export interface AuditSuggestion {
  icon: React.ElementType
  color: string
  text: string
}

export interface ComputedData {
  avgTxValue: number
  savingsRate: number
  totalTxCount: number
  dayCount: number
  totalIncome: number
  totalExpense: number
  dailyAvgIncome: number
  dailyAvgExpense: number
  expenseRatio: number
  categoryData: CategoryMonthData[]
  unbudgetedCategories: UnbudgetedCategoryData[]
  auditResult: AuditResult
}

export type PeriodFilter = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'customPeriod'

export interface ChartDimensions {
  svgWidth: number
  svgHeight: number
  paddingX: number
  paddingY: number
  chartWidth: number
  chartHeight: number
}

export interface NetFlowData {
  values: number[]
  scaleMax: number
  yZero: number
}

export interface TooltipPosition {
  x: string | number
  y: string | number
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"] as const
export const MONTHS_FULL_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"] as const
export const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const
export const MONTHS_FULL_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const
export const DAYS_ID = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"] as const
export const DAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const
export const GRID_LINES = [0, 0.25, 0.5, 0.75, 1] as const
export const DONUT_COLORS = ["#810B38", "#F59E0B", "#3B82F6", "#8B5CF6", "#10B981", "#EC4899", "#06B6D4"] as const
export const SVG_WIDTH = 600
export const SVG_HEIGHT = 260
export const PADDING_X = 50
export const PADDING_Y = 30
export const CHART_DIMENSIONS: ChartDimensions = {
  svgWidth: SVG_WIDTH,
  svgHeight: SVG_HEIGHT,
  paddingX: PADDING_X,
  paddingY: PADDING_Y,
  chartWidth: SVG_WIDTH - PADDING_X * 2,
  chartHeight: SVG_HEIGHT - PADDING_Y * 2,
}
export const DONUT_RADIUS = 50
export const DONUT_STROKE_WIDTH = 14

export const CURRENCY_SYMBOLS: Record<string, string> = {
  IDR: 'Rp',
  USD: '$',
  EUR: '€',
  SGD: 'S$',
  JPY: '¥',
} as const

const CAT_MAP_TO_EN: Record<string, string> = {
  "Makanan": "Food",
  "Transport": "Transport",
  "Investasi": "Investment",
  "Tagihan": "Bills",
  "Hiburan": "Entertainment",
  "Belanja": "Shopping",
  "Lainnya": "Others",
  "Lain-lain": "Others",
}

const CAT_MAP_TO_ID: Record<string, string> = {
  "Food": "Makanan",
  "Transport": "Transport",
  "Investment": "Investasi",
  "Bills": "Tagihan",
  "Entertainment": "Hiburan",
  "Shopping": "Belanja",
  "Others": "Lainnya",
}

// ─── Category Helpers ─────────────────────────────────────────────────────────

export function getCategoryEn(cat: string): string {
  return CAT_MAP_TO_EN[cat] || cat
}

export function getCategoryId(cat: string): string {
  return CAT_MAP_TO_ID[cat] || cat
}

// ─── Period Sub-label ─────────────────────────────────────────────────────────

export function getPeriodSubLabel(filter: PeriodFilter, language: string): string {
  switch (filter) {
    case 'weekly': return language === 'id' ? 'Minggu ini' : 'This week'
    case 'monthly': return language === 'id' ? 'Bulan ini' : 'This month'
    case 'quarterly': return language === 'id' ? 'Kuartal ini' : 'This quarter'
    case 'yearly': return language === 'id' ? 'Tahun ini' : 'This year'
    case 'customPeriod': return language === 'id' ? 'Periode Terpilih' : 'Selected Period'
    default: return language === 'id' ? 'Total keseluruhan' : 'Overall total'
  }
}

// ─── Transaction Filtering ────────────────────────────────────────────────────

export function filterByPeriod(
  transactions: Transaction[],
  filter: PeriodFilter,
  startDate: string,
  endDate: string
): Transaction[] {
  const today = new Date()
  return transactions.filter((tx) => {
    const txDate = new Date(tx.date)
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
    if (filter === 'yearly') {
      return txDate.getFullYear() === today.getFullYear()
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

// ─── Totals ───────────────────────────────────────────────────────────────────

export function calculateTotals(transactions: Transaction[]) {
  const totalIn = transactions
    .filter(t => t.type === 'in' && t.category !== 'Tabungan')
    .reduce((acc, curr) => acc + curr.amount, 0)
  const totalOut = transactions
    .filter(t => t.type === 'out')
    .reduce((acc, curr) => acc + curr.amount, 0)
  return { totalIn, totalOut, netFlow: totalIn - totalOut }
}

// ─── Cash Flow Data Builder ───────────────────────────────────────────────────

export function buildCashFlowData(
  transactions: Transaction[],
  filter: PeriodFilter,
  language: string
): CashFlowDataPoint[] {
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
    const pts: CashFlowDataPoint[] = []
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
      if (d.getFullYear() === today.getFullYear() && mIdx >= startMonth && mIdx < startMonth + 3) {
        const offset = mIdx - startMonth
        if (tx.type === 'in') monthlyIncome[offset] += tx.amount
        else monthlyExpense[offset] += tx.amount
      }
    })
    const pts: CashFlowDataPoint[] = []
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

  // Fallback: customPeriod or otherwise
  const grouped: Record<string, { income: number; expense: number; dateRaw: string }> = {}
  transactions.forEach((tx) => {
    const d = new Date(tx.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!grouped[key]) grouped[key] = { income: 0, expense: 0, dateRaw: tx.date }
    if (tx.type === 'in') grouped[key].income += tx.amount
    else grouped[key].expense += tx.amount
  })
  const sorted = Object.keys(grouped).sort()
  const pts: CashFlowDataPoint[] = sorted.map(k => {
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

// ─── Donut Data Builder ───────────────────────────────────────────────────────

export function buildDonutData(transactions: Transaction[], _language: string): { expenses: Transaction[]; totalSpent: number; donutData: DonutDataPoint[] } { // eslint-disable-line @typescript-eslint/no-unused-vars
  const expenses = transactions.filter((t) => t.type === 'out' && t.category !== 'Tabungan')
  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0)

  const expensesByCategory = expenses.reduce((acc, t) => {
    const cat = t.category.trim()
    acc[cat] = (acc[cat] || 0) + t.amount
    return acc
  }, {} as Record<string, number>)

  const categoryList = Object.entries(expensesByCategory)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)

  const finalCategories: { category: string; categoryEn: string; amount: number }[] = []
  if (categoryList.length > 5) {
    const top4 = categoryList.slice(0, 4)
    const rest = categoryList.slice(4)
    const restAmount = rest.reduce((sum, item) => sum + item.amount, 0)
    top4.forEach((item) => {
      finalCategories.push({ category: item.category, categoryEn: item.category, amount: item.amount })
    })
    finalCategories.push({ category: "Lainnya", categoryEn: "Others", amount: restAmount })
  } else {
    categoryList.forEach((item) => {
      finalCategories.push({ category: item.category, categoryEn: item.category, amount: item.amount })
    })
  }

  const donutData: DonutDataPoint[] = finalCategories.map((item, idx) => {
    const percentage = totalSpent > 0 ? Math.round((item.amount / totalSpent) * 100) : 0
    return {
      category: getCategoryId(item.category),
      categoryEn: getCategoryEn(item.category),
      amount: item.amount,
      color: DONUT_COLORS[idx % DONUT_COLORS.length],
      percentage,
    }
  })

  return { expenses, totalSpent, donutData }
}

// ─── Days in Period ───────────────────────────────────────────────────────────

export function getDaysInPeriod(filter: PeriodFilter, startDate: string, endDate: string): number {
  const today = new Date()
  switch (filter) {
    case 'weekly': return 7
    case 'monthly': return new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    case 'quarterly': {
      const q = Math.floor(today.getMonth() / 3)
      let days = 0
      for (let m = q * 3; m < q * 3 + 3; m++) {
        days += new Date(today.getFullYear(), m + 1, 0).getDate()
      }
      return days
    }
    case 'yearly': {
      const y = today.getFullYear()
      return (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)) ? 366 : 365
    }
    case 'customPeriod': {
      const s = new Date(startDate)
      const e = new Date(endDate)
      return Math.max(1, Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    }
    default: return 30
  }
}

// ─── Full Computed Data (Category + Audit) ────────────────────────────────────

export function computeStatistics(
  filteredTransactions: Transaction[],
  budgets: BudgetLimit[],
  daysInPeriod: number,
  filter: PeriodFilter,
  startDate: string,
  endDate: string
): ComputedData {
  let totalIncome = 0, totalExpense = 0, totalTxCount = 0, totalAbsAmount = 0
  const expenseByCategory = new Map<string, number>()
  const expenseTxCountByCategory = new Map<string, number>()
  const dailyTotals = new Map<string, { income: number; expense: number }>()

  for (const tx of filteredTransactions) {
    if (tx.type === 'in') totalIncome += tx.amount
    else {
      totalExpense += tx.amount
      expenseByCategory.set(tx.category, (expenseByCategory.get(tx.category) || 0) + tx.amount)
      expenseTxCountByCategory.set(tx.category, (expenseTxCountByCategory.get(tx.category) || 0) + 1)
    }
    totalTxCount++
    totalAbsAmount += Math.abs(tx.amount)

    const day = tx.date.slice(0, 10)
    if (!dailyTotals.has(day)) dailyTotals.set(day, { income: 0, expense: 0 })
    const d = dailyTotals.get(day)!
    if (tx.type === 'in') d.income += tx.amount
    else d.expense += tx.amount
  }

  const dayCount = Math.max(1, daysInPeriod)
  const periodFactor = dayCount / 30
  const avgTxValue = totalTxCount > 0 ? totalAbsAmount / totalTxCount : 0
  const savingsRate = totalIncome > 0 ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100) : 0

  // Category data
  const allExpenseCategories = Array.from(expenseByCategory.keys())
  const budgetMap = new Map(budgets.map((b) => [b.category, b.limit]))
  const categoryData: CategoryMonthData[] = allExpenseCategories.map((cat) => {
    const periodActual = expenseByCategory.get(cat) || 0
    const budgetLimit = budgetMap.get(cat) || 0
    const periodBudget = budgetLimit * periodFactor
    const variance = periodBudget - periodActual
    const usagePercent = periodBudget > 0 ? (periodActual / periodBudget) * 100 : 0
    let status: CategoryMonthData['status'] = 'optimal'
    if (budgetLimit === 0) status = 'frugal'
    else if (usagePercent > 100) status = 'critical'
    else if (usagePercent > 85) status = 'overbudget'
    else if (usagePercent > 50) status = 'frugal'
    if (budgetLimit === 0 && periodActual === 0) status = 'optimal'
    return { category: cat, limit: budgetLimit, periodBudget, periodActual, variance, usagePercent, status }
  }).sort((a, b) => b.periodActual - a.periodActual)

  // Financial Health Score
  const benchmarkRate = 25
  const savingsRateScore = Math.min(40, Math.max(0, (savingsRate / benchmarkRate) * 40))

  const budgetedCategoriesOnly = categoryData.filter((cd) => cd.limit > 0)
  const hasBudgets = budgetedCategoriesOnly.length > 0
  const compliantCategories = budgetedCategoriesOnly.filter((c) => c.status !== 'critical' && c.status !== 'overbudget').length
  const complianceRate = hasBudgets ? compliantCategories / budgetedCategoriesOnly.length : 0.5
  const budgetComplianceScore = hasBudgets ? complianceRate * 35 : 17.5

  // Volatility
  const pStart = (() => {
    const d = new Date()
    switch (filter) {
      case 'weekly': { const day = d.getDay(); const s = new Date(d); s.setDate(d.getDate() - day + (day === 0 ? -6 : 1)); s.setHours(0, 0, 0, 0); return s }
      case 'monthly': return new Date(d.getFullYear(), d.getMonth(), 1)
      case 'quarterly': return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1)
      case 'yearly': return new Date(d.getFullYear(), 0, 1)
      case 'customPeriod': return new Date(startDate)
      default: return new Date(d.getFullYear(), d.getMonth(), 1)
    }
  })()
  const pEnd = filter === 'customPeriod' ? new Date(endDate) : new Date()
  const fullDailyExpense: number[] = []
  const padN = (n: number) => String(n).padStart(2, '0')
  const cursor = new Date(pStart)
  cursor.setHours(0, 0, 0, 0)
  const end = new Date(pEnd)
  end.setHours(23, 59, 59, 999)
  while (cursor <= end) {
    const key = `${cursor.getFullYear()}-${padN(cursor.getMonth() + 1)}-${padN(cursor.getDate())}`
    fullDailyExpense.push(dailyTotals.get(key)?.expense || 0)
    cursor.setDate(cursor.getDate() + 1)
  }
  let totalDiff = 0
  for (let i = 1; i < fullDailyExpense.length; i++) {
    totalDiff += Math.abs(fullDailyExpense[i] - fullDailyExpense[i - 1])
  }
  const mad = fullDailyExpense.length > 1 ? totalDiff / (fullDailyExpense.length - 1) : 0
  const meanExp = fullDailyExpense.reduce((a, b) => a + b, 0) / Math.max(1, fullDailyExpense.length)
  const cv = meanExp > 0 ? mad / (mad + meanExp) : 0
  const volatilityScore = Math.min(25, Math.max(0, (1 - Math.min(1, cv)) * 25))

  const unbudgetedCategories: UnbudgetedCategoryData[] = categoryData
    .filter((cd) => cd.limit === 0)
    .map((cd) => {
      const totalCatExpense = expenseByCategory.get(cd.category) || 0
      const txCount = expenseTxCountByCategory.get(cd.category) || 0
      return {
        category: cd.category,
        txCount,
        avgPerTransaction: txCount > 0 ? totalCatExpense / txCount : 0,
        totalSpent: totalCatExpense,
      }
    })

  const budgetedCategories = categoryData.filter((cd) => cd.limit > 0)
  const totalScore = Math.min(100, Math.round(savingsRateScore + budgetComplianceScore + volatilityScore))
  const dailyAvgIncome = dayCount > 0 ? totalIncome / dayCount : 0
  const dailyAvgExpense = dayCount > 0 ? totalExpense / dayCount : 0
  const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0

  return {
    avgTxValue,
    savingsRate,
    totalTxCount,
    dayCount,
    totalIncome,
    totalExpense,
    dailyAvgIncome,
    dailyAvgExpense,
    expenseRatio,
    categoryData: budgetedCategories,
    unbudgetedCategories,
    auditResult: {
      score: totalScore,
      savingsRateScore: Math.round(savingsRateScore),
      budgetComplianceScore: Math.round(budgetComplianceScore),
      volatilityScore: Math.round(volatilityScore),
      savingsRate,
      complianceRate,
      volatility: cv,
      hasBudgets,
      dataQuality: Math.min(1, dayCount / 7),
    },
  }
}

// ─── Suggestions Engine ───────────────────────────────────────────────────────

type SuggestionIcons = {
  AlertTriangle: React.ElementType
  Target: React.ElementType
  PiggyBank: React.ElementType
  CheckCircle: React.ElementType
  Activity: React.ElementType
  BarChart3: React.ElementType
}

export function generateSuggestions(
  computed: ComputedData,
  language: string,
  icons: SuggestionIcons,
  fmtCurrency: (amount: number, lang: string) => string
): AuditSuggestion[] {
  const result: AuditSuggestion[] = []
  const lang = language as 'id' | 'en'
  const isId = lang === 'id'
  const a = computed.auditResult
  const _fmt = (n: number) => fmtCurrency(n, lang)

  if (computed.totalExpense > computed.totalIncome && computed.totalIncome > 0) {
    const deficit = computed.totalExpense - computed.totalIncome
    const dailyDeficit = deficit / Math.max(1, computed.dayCount)
    result.push({
      icon: icons.AlertTriangle, color: 'text-destructive',
      text: isId
        ? `Defisit ${_fmt(deficit)} (${_fmt(dailyDeficit)}/hari). Pengeluaran melebihi pemasukan — risiko utang. Segera tekan pengeluaran tidak perlu.`
        : `Deficit ${_fmt(deficit)} (${_fmt(dailyDeficit)}/day). Spending exceeds income — debt risk. Cut unnecessary expenses immediately.`
    })
  }

  const criticalOver = computed.categoryData.filter((c) => c.status === 'critical')
  if (criticalOver.length > 0) {
    const worst = criticalOver.sort((a, b) => a.variance - b.variance)[0]
    result.push({
      icon: icons.Target, color: 'text-destructive',
      text: isId
        ? `"${worst.category}" melebihi anggaran ${worst.usagePercent.toFixed(0)}% (${_fmt(Math.abs(worst.variance))}). Evaluasi ulang alokasi anggaran kategori ini.`
        : `"${worst.category}" exceeds budget by ${worst.usagePercent.toFixed(0)}% (${_fmt(Math.abs(worst.variance))}). Re-evaluate this category budget.`
    })
  }

  if (computed.savingsRate > 0 && computed.savingsRate < 25) {
    const gapTarget = 25 - computed.savingsRate
    const dailyIncome = computed.totalIncome / Math.max(1, computed.dayCount)
    const extraSavePerDay = dailyIncome * (gapTarget / 100)
    const monthlyExtra = extraSavePerDay * 30
    const yearlyExtra = extraSavePerDay * 365
    result.push({
      icon: icons.PiggyBank, color: 'text-green-500',
      text: isId
        ? `Rasio tabungan ${computed.savingsRate.toFixed(1)}% (target ideal ≥25%). Tambah ${_fmt(extraSavePerDay)}/hari → ~${_fmt(monthlyExtra)}/bulan → ~${_fmt(yearlyExtra)}/tahun.`
        : `Savings rate ${computed.savingsRate.toFixed(1)}% (ideal target ≥25%). Save ${_fmt(extraSavePerDay)}/day → ~${_fmt(monthlyExtra)}/month → ~${_fmt(yearlyExtra)}/year.`
    })
  } else if (computed.savingsRate >= 25) {
    result.push({
      icon: icons.CheckCircle, color: 'text-green-500',
      text: isId
        ? `Rasio tabungan ${computed.savingsRate.toFixed(1)}% — sangat baik! Pertahankan konsistensi ini dan pertimbangkan investasi jangka panjang.`
        : `Savings rate ${computed.savingsRate.toFixed(1)}% — excellent! Maintain consistency and consider long-term investments.`
    })
  }

  const underBudget = computed.categoryData.filter((c) => c.variance > 0 && c.usagePercent < 50)
  if (underBudget.length > 0 && result.length < 3) {
    const best = underBudget.sort((a, b) => b.variance - a.variance)[0]
    result.push({
      icon: icons.CheckCircle, color: 'text-green-500',
      text: isId
        ? `"${best.category}" hemat ${_fmt(best.variance)} (${best.usagePercent.toFixed(0)}% terpakai). Alokasikan surplus ke dana darurat atau investasi.`
        : `"${best.category}" saved ${_fmt(best.variance)} (${best.usagePercent.toFixed(0)}% used). Allocate surplus to emergency fund or investments.`
    })
  }

  if (result.length < 3) {
    if (a.volatility > 0.5) {
      result.push({
        icon: icons.Activity, color: 'text-purple-500',
        text: isId
          ? `Pengeluaran harian sangat fluktuatif (${(a.volatility * 100).toFixed(0)}%). Buat jadwal belanja rutin untuk menstabilkan arus kas.`
          : `Daily expenses are highly volatile (${(a.volatility * 100).toFixed(0)}%). Create a regular spending schedule to stabilize cash flow.`
      })
    } else if (a.volatility < 0.2 && computed.totalExpense > 0) {
      result.push({
        icon: icons.Activity, color: 'text-green-500',
        text: isId
          ? `Pengeluaran harian stabil (${(a.volatility * 100).toFixed(0)}%). Pola konsisten — tanda manajemen keuangan yang disiplin!`
          : `Daily expenses are stable (${(a.volatility * 100).toFixed(0)}%). Consistent pattern — a sign of disciplined financial management!`
      })
    }
  }

  if (!a.hasBudgets && computed.totalExpense > 0 && result.length < 3) {
    result.push({
      icon: icons.BarChart3, color: 'text-blue-500',
      text: isId
        ? `Anda belum memiliki anggaran kategori. Tetapkan batas anggaran di menu Perencanaan untuk kontrol pengeluaran lebih baik.`
        : `You haven't set any category budgets. Set budget limits in the Planning menu for better spending control.`
    })
  }

  return result.slice(0, 3)
}

// ─── Chart Math ───────────────────────────────────────────────────────────────

export function getCoordinates(
  index: number,
  val: number,
  maxVal: number,
  dataLength: number,
  dims: ChartDimensions
): { x: number; y: number } {
  const x = dims.paddingX + (index / Math.max(1, dataLength - 1)) * dims.chartWidth
  const y = dims.paddingY + dims.chartHeight - (val / maxVal) * dims.chartHeight
  return { x, y }
}

export function createLinePath(points: { x: number; y: number }[]): string {
  return points.reduce((path, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`
  }, "")
}

export function createAreaPath(points: { x: number; y: number }[], dims: ChartDimensions): string {
  if (points.length === 0) return ""
  const linePath = createLinePath(points)
  const firstX = points[0].x
  const lastX = points[points.length - 1].x
  const baseY = dims.paddingY + dims.chartHeight
  return `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`
}

export function calculateChartMetrics(
  displayCashFlow: CashFlowDataPoint[],
  chartMode: string,
  dims: ChartDimensions
) {
  const maxTransValue = displayCashFlow.reduce((max, d) => {
    if (chartMode === 'stacked') return Math.max(max, d.income + d.expense)
    return Math.max(max, d.income, d.expense)
  }, 0)
  const maxVal = maxTransValue > 0 ? maxTransValue * 1.15 : 1000000

  const netFlowData: NetFlowData = (() => {
    const values = displayCashFlow.map(d => d.income - d.expense)
    const maxNet = Math.max(...values, 1)
    const minNet = Math.min(...values, -1)
    const absMax = Math.max(Math.abs(maxNet), Math.abs(minNet))
    return {
      values,
      scaleMax: absMax * 1.15,
      yZero: dims.paddingY + dims.chartHeight / 2,
    }
  })()

  const incomePoints = displayCashFlow.map((d, i) => getCoordinates(i, d.income, maxVal, displayCashFlow.length, dims))
  const expensePoints = displayCashFlow.map((d, i) => getCoordinates(i, d.expense, maxVal, displayCashFlow.length, dims))

  const incomePath = createLinePath(incomePoints)
  const expensePath = createLinePath(expensePoints)
  const incomeArea = createAreaPath(incomePoints, dims)
  const expenseArea = createAreaPath(expensePoints, dims)

  return { maxTransValue, maxVal, netFlowData, incomePoints, expensePoints, incomePath, expensePath, incomeArea, expenseArea }
}

export function buildTooltipData(
  activeIndex: number | null,
  displayCashFlow: CashFlowDataPoint[],
  incomePoints: { x: number; y: number }[],
  expensePoints: { x: number; y: number }[],
  chartMode: string,
  maxVal: number,
  chartHeight: number,
  paddingY: number,
  netFlowData: NetFlowData
) {
  if (activeIndex === null || !displayCashFlow[activeIndex]) return null

  const d = displayCashFlow[activeIndex]
  let minY: number

  if (chartMode === 'stacked') {
    const totalHeight = ((d.income + d.expense) / maxVal) * chartHeight
    minY = paddingY + chartHeight - totalHeight
  } else if (chartMode === 'netFlow') {
    const netVal = d.income - d.expense
    const yVal = netFlowData.yZero - (netVal / netFlowData.scaleMax) * (chartHeight / 2)
    minY = Math.min(yVal, netFlowData.yZero)
  } else {
    const incY = paddingY + chartHeight - (d.income / maxVal) * chartHeight
    const expY = paddingY + chartHeight - (d.expense / maxVal) * chartHeight
    minY = Math.min(incY, expY)
  }

  return { minY }
}

export function buildTooltipTransform(
  activeIndex: number | null,
  displayCashFlow: CashFlowDataPoint[],
  incomePoints: { x: number; y: number }[],
  expensePoints: { x: number; y: number }[],
  activeMinY: number
): TooltipPosition {
  if (activeIndex === null || !displayCashFlow[activeIndex] || !incomePoints[activeIndex] || !expensePoints[activeIndex]) {
    return { x: 0, y: 0 }
  }
  const isFirst = activeIndex === 0
  const isLast = activeIndex === displayCashFlow.length - 1
  const showBelow = activeMinY < 70

  let xVal: string | number = "-50%"
  const yVal: string | number = showBelow ? "15px" : "-115%"

  if (isLast || isFirst) {
    xVal = "0%"
  }

  return { x: xVal, y: yVal }
}

export function buildTooltipStyle(
  activeIndex: number | null,
  displayCashFlow: CashFlowDataPoint[],
  incomePoints: { x: number; y: number }[],
  _expensePoints: { x: number; y: number }[],
  svgWidth: number,
  svgHeight: number,
  activeMinY: number
): React.CSSProperties {
  if (activeIndex === null || !displayCashFlow[activeIndex] || !incomePoints[activeIndex] || !_expensePoints[activeIndex]) {
    return {}
  }

  const xPos = (incomePoints[activeIndex].x / svgWidth) * 100
  const isFirst = activeIndex === 0
  const isLast = activeIndex === displayCashFlow.length - 1
  const yPct = (activeMinY / svgHeight) * 100

  if (isLast) {
    return { right: "8px", left: "auto", top: `${yPct}%` }
  }
  if (isFirst) {
    return { left: "8px", top: `${yPct}%` }
  }
  return { left: `${xPos}%`, top: `${yPct}%` }
}

// ─── Month Detail Helpers ─────────────────────────────────────────────────────

export function getQuarterMonthDetail(index: number, _language: string) { // eslint-disable-line @typescript-eslint/no-unused-vars
  const today = new Date()
  const quarter = Math.floor(today.getMonth() / 3)
  const startMonth = quarter * 3
  const actualMonth = startMonth + index
  return {
    monthIndex: actualMonth,
    monthNameId: MONTHS_FULL_ID[actualMonth],
    monthNameEn: MONTHS_FULL_EN[actualMonth],
  }
}

export function buildMonthDetailData(transactions: Transaction[], selectedMonthIndex: number): {
  monthTransactions: Transaction[]
  monthIn: number
  monthOut: number
  monthNet: number
  monthDailyFlow: CashFlowDataPoint[]
} {
  const year = new Date().getFullYear()
  const monthTransactions = transactions.filter((tx) => {
    const d = new Date(tx.date)
    return d.getMonth() === selectedMonthIndex && d.getFullYear() === year
  })

  const monthIn = monthTransactions
    .filter(t => t.type === 'in' && t.category !== 'Tabungan')
    .reduce((acc, curr) => acc + curr.amount, 0)
  const monthOut = monthTransactions
    .filter(t => t.type === 'out')
    .reduce((acc, curr) => acc + curr.amount, 0)
  const monthNet = monthIn - monthOut

  const totalDays = new Date(year, selectedMonthIndex + 1, 0).getDate()
  const dailyIncome = Array(totalDays).fill(0)
  const dailyExpense = Array(totalDays).fill(0)

  monthTransactions.forEach((tx) => {
    const d = new Date(tx.date)
    const dayIdx = d.getDate() - 1
    if (tx.type === 'in') dailyIncome[dayIdx] += tx.amount
    else dailyExpense[dayIdx] += tx.amount
  })

  const mLabelId = MONTHS_ID[selectedMonthIndex]
  const mLabelEn = MONTHS_EN[selectedMonthIndex]
  const monthDailyFlow: CashFlowDataPoint[] = []
  for (let day = 1; day <= totalDays; day++) {
    monthDailyFlow.push({
      date: `${day} ${mLabelId}`,
      dateEn: `${mLabelEn} ${day}`,
      income: dailyIncome[day - 1],
      expense: dailyExpense[day - 1],
    })
  }

  return { monthTransactions, monthIn, monthOut, monthNet, monthDailyFlow }
}
