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
  startDate: string          // ISO date string
  lastExecutedDate: string | null
  isActive: boolean
}

interface AutoLogState {
  rules: AutoLogRule[]
  ruleCategories: string[]
  addRule: (rule: Omit<AutoLogRule, 'id' | 'lastExecutedDate'>) => void
  updateRule: (id: string, data: Omit<AutoLogRule, 'id' | 'lastExecutedDate'>) => void
  deleteRule: (id: string) => void
  toggleRuleActive: (id: string) => void
  updateLastExecuted: (id: string, date: string) => void
}

const addCategoryToList = (existing: string[], newCat: string): string[] => {
  const trimmed = newCat.trim()
  if (!trimmed) return existing
  if (existing.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return existing
  return [...existing, trimmed]
}

export const useAutoLogStore = create<AutoLogState>()(
  persist(
    (set) => ({
      rules: [],
      ruleCategories: [],

      addRule: (rule) =>
        set((state) => ({
          rules: [
            ...state.rules,
            {
              ...rule,
              id: crypto.randomUUID(),
              lastExecutedDate: null,
            },
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
    }),
    { name: 'cashhero-autolog-store' }
  )
)
