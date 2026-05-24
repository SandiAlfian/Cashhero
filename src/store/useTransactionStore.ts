import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { usePlanningStore } from './usePlanningStore'

export type TransactionType = 'in' | 'out'

export interface Transaction {
  id: string
  amount: number
  category: string
  note: string
  type: TransactionType
  date: string
  assetId?: string
}

interface TransactionState {
  transactions: Transaction[]
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'> & { date?: string }) => void
  deleteTransaction: (id: string) => void
  deleteAssetTransactions: (assetId: string, assetName: string) => void
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set) => ({
      transactions: [],
      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [
            {
              ...transaction,
              id: crypto.randomUUID(),
              date: transaction.date || new Date().toISOString(),
            },
            ...state.transactions,
          ],
        })),
      deleteTransaction: (id) =>
        set((state) => {
          const tx = state.transactions.find((t) => t.id === id)
          
          if (tx && tx.category === 'Tabungan') {
            const isSavingId = tx.note.startsWith("Menabung: ")
            const isSavingEn = tx.note.startsWith("Saving: ")
            
            if (isSavingId || isSavingEn) {
              const prefix = isSavingId ? "Menabung: " : "Saving: "
              const goalTitle = tx.note.replace(prefix, "").trim()
              
              const planningStore = usePlanningStore.getState()
              const goal = planningStore.goals.find((g) => g.title === goalTitle)
              
              if (goal) {
                // If tx was 'out' (deductCash = true), add back to goal
                // If tx was 'in' (deductCash = false), subtract from goal
                const newCollected = tx.type === 'out' 
                  ? Math.max(0, goal.collected - tx.amount)
                  : Math.max(0, goal.collected - tx.amount)
                
                planningStore.updateGoal(
                  goal.id, 
                  goal.title, 
                  goal.target, 
                  newCollected, 
                  goal.iconName
                )
              }
            }
          }

          return {
            transactions: state.transactions.filter((t) => t.id !== id),
          }
        }),
      deleteAssetTransactions: (assetId, assetName) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => {
            if (t.assetId) {
              return t.assetId !== assetId
            }
            if (t.category === 'Investasi') {
              const prefixes = [
                "Investasi Awal: ",
                "Initial Investment: ",
                "Likuidasi Investasi: ",
                "Investment Liquidation: ",
                "Likuidasi Sebagian: ",
                "Partial Liquidation: "
              ]
              const matchesExactName = prefixes.some(
                (prefix) => t.note.trim() === `${prefix}${assetName}`
              )
              return !matchesExactName
            }
            return true
          }),
        })),
    }),
    {
      name: 'cashhero-transactions',
    }
  )
)
