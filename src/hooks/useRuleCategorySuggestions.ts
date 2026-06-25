import { useMemo } from "react"
import type { AutoLogRule } from "@/store/useAutoLogStore"
import type { BudgetLimit } from "@/store/usePlanningStore"

interface SuggestionItem {
  name: string
  source: 'budget' | 'history'
}

export function useRuleCategorySuggestions(
  query: string,
  transactions: Array<{ type: string; category: string }>,
  budgets: BudgetLimit[],
  rules: AutoLogRule[],
  ruleCategories: string[]
): SuggestionItem[] {
  return useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 1) return []

    const budgetCats = budgets
      .map((b) => b.category.trim())
      .filter((cat) => cat && cat.toLowerCase().includes(q))

    const historyCats = transactions
      .map((t) => t.category.trim())
      .filter((cat) => cat && cat.toLowerCase() !== "saldo awal" && cat.toLowerCase().includes(q))

    const ruleCats = rules
      .map((r) => r.category.trim())
      .filter((cat) => cat && cat.toLowerCase().includes(q))

    const persistentRuleCats = (ruleCategories || [])
      .map((cat) => cat.trim())
      .filter((cat) => cat && cat.toLowerCase().includes(q))

    const combinedMap = new Map<string, 'budget' | 'history'>()

    persistentRuleCats.forEach((cat) => { combinedMap.set(cat, 'history') })
    ruleCats.forEach((cat) => { combinedMap.set(cat, 'history') })
    historyCats.forEach((cat) => { combinedMap.set(cat, 'history') })
    budgetCats.forEach((cat) => { combinedMap.set(cat, 'budget') })

    return Array.from(combinedMap.entries()).map(([name, source]) => ({
      name,
      source
    })).slice(0, 5)
  }, [transactions, budgets, rules, ruleCategories, query])
}
