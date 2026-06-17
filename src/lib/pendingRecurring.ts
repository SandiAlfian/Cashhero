export interface PendingRecurringItem {
  id: string
  ruleId: string
  title: string
  amount: number
  type: 'in' | 'out'
  category: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  dueDate: string
  createdAt: string
}

const CACHE = 'cashhero-recurring'

export async function savePendingItems(items: PendingRecurringItem[]) {
  try {
    const cache = await caches.open(CACHE)
    cache.put('pending-items', new Response(JSON.stringify(items)))
  } catch { /* ignore */ }
}

export async function readPendingItems(): Promise<PendingRecurringItem[]> {
  try {
    const cache = await caches.open(CACHE)
    const res = await cache.match('pending-items')
    if (!res) return []
    return res.json()
  } catch {
    return []
  }
}

export async function removePendingItem(id: string) {
  const items = await readPendingItems()
  await savePendingItems(items.filter(i => i.id !== id))
}
