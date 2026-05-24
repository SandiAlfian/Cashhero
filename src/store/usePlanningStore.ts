import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface BudgetLimit {
  id: string
  category: string
  limit: number
}

export interface SavingGoal {
  id: string
  title: string
  target: number
  collected: number
  iconName: 'ShieldCheck' | 'Plane' | 'Laptop' | 'Home' | 'PiggyBank'
}

interface PlanningState {
  budgets: BudgetLimit[]
  goals: SavingGoal[]
  addBudget: (category: string, limit: number) => void
  updateBudget: (id: string, category: string, limit: number) => void
  deleteBudget: (id: string) => void
  addGoal: (title: string, target: number, collected: number, iconName: SavingGoal['iconName']) => void
  updateGoal: (id: string, title: string, target: number, collected: number, iconName: SavingGoal['iconName']) => void
  deleteGoal: (id: string) => void
}

export const usePlanningStore = create<PlanningState>()(
  persist(
    (set) => ({
      budgets: [],
      goals: [],
      addBudget: (category, limit) =>
        set((state) => ({
          budgets: [
            ...state.budgets,
            {
              id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
              category,
              limit,
            }
          ]
        })),
      updateBudget: (id, category, limit) =>
        set((state) => ({
          budgets: state.budgets.map((b) => b.id === id ? { ...b, category, limit } : b)
        })),
      deleteBudget: (id) =>
        set((state) => ({
          budgets: state.budgets.filter((b) => b.id !== id)
        })),
      addGoal: (title, target, collected, iconName) =>
        set((state) => ({
          goals: [
            ...state.goals,
            {
              id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
              title,
              target,
              collected,
              iconName,
            }
          ]
        })),
      updateGoal: (id, title, target, collected, iconName) =>
        set((state) => ({
          goals: state.goals.map((g) => g.id === id ? { ...g, title, target, collected, iconName } : g)
        })),
      deleteGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id)
        })),
    }),
    {
      name: 'cashhero-planning-persistent',
    }
  )
)
