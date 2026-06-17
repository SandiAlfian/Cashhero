import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AutoLogFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface AutoLogRule {
  id: string
  title: string
  amount: number
  type: 'in' | 'out'
  category: string
  note: string
  frequency: AutoLogFrequency
  startDate: string
  lastExecutedDate: string | null
  isActive: boolean
}

export interface PendingRecurring {
  id: string
  ruleId: string
  title: string
  amount: number
  type: 'in' | 'out'
  category: string
  frequency: AutoLogFrequency
  dueDate: string
  createdAt: string
}

interface AutoLogState {
  rules: AutoLogRule[]
  ruleCategories: string[]
  pendingItems: PendingRecurring[]
  addRule: (rule: Omit<AutoLogRule, 'id' | 'lastExecutedDate'>) => void
  updateRule: (id: string, data: Omit<AutoLogRule, 'id' | 'lastExecutedDate'>) => void
  deleteRule: (id: string) => void
  toggleRuleActive: (id: string) => void
  updateLastExecuted: (id: string, date: string) => void
  setPendingItems: (items: PendingRecurring[]) => void
  addPendingItem: (item: PendingRecurring) => void
  removePendingItem: (id: string) => void
  confirmPending: (id: string) => { ruleId: string; dueDate: string } | null
  skipPending: (id: string) => { ruleId: string; dueDate: string } | null
  rejectPending: (id: string) => string | null
}

const addCategoryToList = (existing: string[], newCat: string): string[] => {
  const trimmed = newCat.trim()
  if (!trimmed) return existing
  if (existing.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return existing
  return [...existing, trimmed]
}

export const useAutoLogStore = create<AutoLogState>()(
  persist(
    (set, get) => ({
      rules: [],
      ruleCategories: [],
      pendingItems: [],

      addRule: (rule) =>
        set((state) => ({
          rules: [
            ...state.rules,
            { ...rule, id: crypto.randomUUID(), lastExecutedDate: null },
          ],
          ruleCategories: addCategoryToList(state.ruleCategories, rule.category),
        })),

      updateRule: (id, data) =>
        set((state) => ({
          rules: state.rules.map((r) => (r.id === id ? { ...r, ...data } : r)),
          ruleCategories: addCategoryToList(state.ruleCategories, data.category),
        })),

      deleteRule: (id) =>
        set((state) => ({
          rules: state.rules.filter((r) => r.id !== id),
          pendingItems: state.pendingItems.filter((p) => p.ruleId !== id),
        })),

      toggleRuleActive: (id) =>
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === id ? { ...r, isActive: !r.isActive } : r
          ),
        })),

      updateLastExecuted: (id, date) =>
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === id ? { ...r, lastExecutedDate: date } : r
          ),
        })),

      setPendingItems: (items) => set({ pendingItems: items }),

      addPendingItem: (item) =>
        set((state) => {
          if (state.pendingItems.some((p) => p.id === item.id || (p.ruleId === item.ruleId && p.dueDate === item.dueDate))) return state
          return { pendingItems: [...state.pendingItems, item] }
        }),

      removePendingItem: (id) =>
        set((state) => ({
          pendingItems: state.pendingItems.filter((p) => p.id !== id),
        })),

      confirmPending: (id) => {
        const state = get()
        const item = state.pendingItems.find((p) => p.id === id)
        if (!item) return null
        set({ pendingItems: state.pendingItems.filter((p) => p.id !== id) })
        return { ruleId: item.ruleId, dueDate: item.dueDate }
      },

      skipPending: (id) => {
        const state = get()
        const item = state.pendingItems.find((p) => p.id === id)
        if (!item) return null
        set({ pendingItems: state.pendingItems.filter((p) => p.id !== id) })
        return { ruleId: item.ruleId, dueDate: item.dueDate }
      },

      rejectPending: (id) => {
        const state = get()
        const item = state.pendingItems.find((p) => p.id === id)
        if (!item) return null
        // Deactivate the rule
        const rule = state.rules.find((r) => r.id === item.ruleId)
        if (rule) {
          const updated = state.rules.map((r) =>
            r.id === item.ruleId ? { ...r, isActive: false } : r
          )
          set({ rules: updated, pendingItems: state.pendingItems.filter((p) => p.id !== id) })
        }
        return item.ruleId
      },
    }),
    { name: 'cashhero-autolog-store' }
  )
)
