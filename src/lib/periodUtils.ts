export type PeriodFilter = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'customPeriod'

export function isEndOfPeriod(filter: PeriodFilter): boolean {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const date = today.getDate()
  const month = today.getMonth()
  const year = today.getFullYear()

  switch (filter) {
    case 'weekly':
      return dayOfWeek === 0
    case 'monthly':
      return date === new Date(year, month + 1, 0).getDate()
    case 'quarterly': {
      const lastDays = [new Date(year, 3, 0).getDate(), new Date(year, 6, 0).getDate(), new Date(year, 9, 0).getDate(), new Date(year, 12, 0).getDate()]
      return lastDays.includes(date) && [2, 5, 8, 11].includes(month)
    }
    case 'yearly':
      return month === 11 && date === 31
    default:
      return false
  }
}

export async function saveAuditData(data: { score: number; topSuggestion: string; language: string; filter: PeriodFilter }) {
  try {
    const cache = await caches.open('cashhero-audit')
    cache.put('end-of-period-data', new Response(JSON.stringify({ ...data, savedAt: new Date().toISOString() })))
  } catch { /* cache not available */ }
}

export async function readAuditData(): Promise<{ score: number; topSuggestion: string; language: string; filter: PeriodFilter; savedAt: string } | null> {
  try {
    const cache = await caches.open('cashhero-audit')
    const res = await cache.match('end-of-period-data')
    if (!res) return null
    return res.json()
  } catch {
    return null
  }
}
