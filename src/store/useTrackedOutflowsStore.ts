"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const JENIS_OPTIONS = [
  'piutang',
  'deposit',
  'kasbon',
  'temporary',
] as const

export type JenisKey = (typeof JENIS_OPTIONS)[number] | (string & {})

export interface Repayment {
  id: string
  amount: number
  date: string
  note: string
}

export interface TrackedOutflow {
  id: string
  jenis: string
  personName: string
  amount: number
  remainingAmount: number
  date: string
  dueDate: string
  note: string
  status: 'active' | 'settled'
  repayments: Repayment[]
  createdAt: string
  updatedAt: string
}

interface TrackedState {
  items: TrackedOutflow[]
  addItem: (item: Omit<TrackedOutflow, 'id' | 'remainingAmount' | 'status' | 'repayments' | 'createdAt' | 'updatedAt'>) => void
  updateItem: (id: string, updates: Partial<TrackedOutflow>) => void
  removeItem: (id: string) => void
  addRepayment: (id: string, amount: number, date?: string, note?: string) => void
  updateRepayment: (itemId: string, repaymentId: string, updates: Partial<Repayment>) => void
  removeRepayment: (itemId: string, repaymentId: string) => void
  settleItem: (id: string) => void
  getActiveTotal: () => number
  getActiveByJenis: () => Record<string, number>
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export const useTrackedOutflowsStore = create<TrackedState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (input) => {
        const now = new Date().toISOString()
        const item: TrackedOutflow = {
          ...input,
          id: genId(),
          remainingAmount: input.amount,
          status: 'active',
          repayments: [],
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ items: [item, ...s.items] }))
      },

      updateItem: (id, updates) => {
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
          ),
        }))
      },

      removeItem: (id) => {
        set((s) => ({ items: s.items.filter((i) => i.id !== id) }))
      },

      addRepayment: (id, amount, date, note) => {
        const now = new Date().toISOString()
        const repayment: Repayment = {
          id: genId(),
          amount,
          date: date || now.slice(0, 10),
          note: note || '',
        }
        set((s) => ({
          items: s.items.map((i) => {
            if (i.id !== id) return i
            const remaining = Math.max(0, i.remainingAmount - amount)
            return {
              ...i,
              remainingAmount: remaining,
              status: remaining <= 0 ? 'settled' : i.status,
              repayments: [...i.repayments, repayment],
              updatedAt: now,
            }
          }),
        }))
      },

      updateRepayment: (itemId, repaymentId, updates) => {
        set((s) => ({
          items: s.items.map((i) => {
            if (i.id !== itemId) return i
            const oldRepayment = i.repayments.find((r) => r.id === repaymentId)
            if (!oldRepayment) return i
            const newRepayment = { ...oldRepayment, ...updates }
            const amountDiff = oldRepayment.amount - newRepayment.amount
            return {
              ...i,
              remainingAmount: Math.min(i.amount, Math.max(0, i.remainingAmount + amountDiff)),
              repayments: i.repayments.map((r) => r.id === repaymentId ? newRepayment : r),
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
      },

      removeRepayment: (itemId, repaymentId) => {
        set((s) => ({
          items: s.items.map((i) => {
            if (i.id !== itemId) return i
            const removed = i.repayments.find((r) => r.id === repaymentId)
            if (!removed) return i
            return {
              ...i,
              remainingAmount: Math.min(i.amount, i.remainingAmount + removed.amount),
              status: 'active',
              repayments: i.repayments.filter((r) => r.id !== repaymentId),
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
      },

      settleItem: (id) => {
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id
              ? { ...i, remainingAmount: 0, status: 'settled', updatedAt: new Date().toISOString() }
              : i
          ),
        }))
      },

      getActiveTotal: () => {
        return get().items
          .filter((i) => i.status === 'active')
          .reduce((sum, i) => sum + i.remainingAmount, 0)
      },

      getActiveByJenis: () => {
        const result: Record<string, number> = {}
        for (const i of get().items) {
          if (i.status === 'active') {
            result[i.jenis] = (result[i.jenis] || 0) + i.remainingAmount
          }
        }
        return result
      },
    }),
    { name: 'cashhero-tracked-outflows' }
  )
)
