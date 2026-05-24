import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AssetType = 'stocks' | 'crypto' | 'other'

export interface AssetHistoryLog {
  id: string
  date: string
  amount: number
  type: 'profit' | 'loss' | 'capital_change' | 'liquidation'
  note: string
}

export interface InvestmentAsset {
  id: string
  name: string
  type: AssetType
  initialCapital: number
  realizedGainLoss: number // positive for gain, negative for loss
  lastUpdated: string
  history?: AssetHistoryLog[]
}

interface PortfolioState {
  assets: InvestmentAsset[]
  addAsset: (
    name: string, 
    type: AssetType, 
    initialCapital: number, 
    realizedGainLoss: number,
    historyLogs?: Omit<AssetHistoryLog, 'id' | 'date'>[],
    id?: string
  ) => void
  updateAsset: (id: string, data: Partial<Omit<InvestmentAsset, 'id' | 'lastUpdated' | 'history'>>) => void
  deleteAsset: (id: string) => void
  addAssetHistoryLog: (
    assetId: string, 
    amount: number, 
    type: 'profit' | 'loss' | 'capital_change' | 'liquidation', 
    note: string
  ) => void
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      assets: [],
      addAsset: (name, type, initialCapital, realizedGainLoss, historyLogs, id) =>
        set((state) => {
          const finalLogs: AssetHistoryLog[] = (historyLogs || []).map((log) => ({
            ...log,
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
            date: new Date().toISOString(),
          }))

          return {
            assets: [
              ...state.assets,
              {
                id: id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9)),
                name,
                type,
                initialCapital,
                realizedGainLoss,
                lastUpdated: new Date().toISOString(),
                history: finalLogs,
              }
            ]
          }
        }),
      updateAsset: (id, data) =>
        set((state) => ({
          assets: state.assets.map((asset) =>
            asset.id === id
              ? {
                  ...asset,
                  ...data,
                  lastUpdated: new Date().toISOString(),
                }
              : asset
          ),
        })),
      deleteAsset: (id) =>
        set((state) => ({
          assets: state.assets.filter((asset) => asset.id !== id),
        })),
      addAssetHistoryLog: (assetId, amount, type, note) =>
        set((state) => ({
          assets: state.assets.map((asset) =>
            asset.id === assetId
              ? {
                  ...asset,
                  history: [
                    ...(asset.history || []),
                    {
                      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
                      date: new Date().toISOString(),
                      amount,
                      type,
                      note,
                    }
                  ],
                  lastUpdated: new Date().toISOString(),
                }
              : asset
          )
        })),
    }),
    {
      name: 'cashhero-portfolio-dynamic-v2' // Diubah versi namanya agar cache persist local tidak konflik dengan data model lama
    }
  )
)
