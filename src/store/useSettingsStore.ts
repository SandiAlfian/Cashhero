import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type MainCurrency = 'IDR' | 'USD' | 'EUR' | 'SGD' | 'JPY'

export interface SettingsState {
  username: string
  email: string
  currency: MainCurrency
  defaultHistoryFilter: 'daily' | 'weekly' | 'monthly'
  autoLogging: boolean
  securityPIN: boolean
  pinCode: string
  biometricsRegistered: boolean
  isSidebarCollapsed: boolean
  hasSetupSecurity: boolean
  setProfile: (username: string, email: string) => void
  setCurrency: (currency: MainCurrency) => void
  setDefaultHistoryFilter: (filter: 'daily' | 'weekly' | 'monthly') => void
  setAutoLogging: (enabled: boolean) => void
  setSecurityPIN: (enabled: boolean) => void
  setPinCode: (pin: string) => void
  setBiometricsRegistered: (registered: boolean) => void
  toggleSidebar: () => void
  setHasSetupSecurity: (setup: boolean) => void
  resetAllData: () => void
}

// Fixed Exchange Rates relative to IDR (Base currency is always stored in IDR)
export const EXCHANGE_RATES: Record<MainCurrency, number> = {
  IDR: 1,
  USD: 16000,
  EUR: 17500,
  SGD: 12000,
  JPY: 102
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      username: 'Cashhero Finance',
      email: 'user@cashhero.app',
      currency: 'IDR',
      defaultHistoryFilter: 'weekly',
      autoLogging: true,
      securityPIN: true,
      pinCode: '',
      biometricsRegistered: false,
      isSidebarCollapsed: false,
      hasSetupSecurity: false,
      setProfile: (username, email) => set({ username, email }),
      setCurrency: (currency) => set({ currency }),
      setDefaultHistoryFilter: (defaultHistoryFilter) => set({ defaultHistoryFilter }),
      setAutoLogging: (autoLogging) => set({ autoLogging }),
      setSecurityPIN: (securityPIN) => set({ securityPIN }),
      setPinCode: (pinCode) => set({ pinCode }),
      setBiometricsRegistered: (biometricsRegistered) => set({ biometricsRegistered }),
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setHasSetupSecurity: (hasSetupSecurity) => set({ hasSetupSecurity }),
      resetAllData: () => {
        if (typeof window !== 'undefined') {
          // Clear all Cashhero local storage keys
          localStorage.removeItem('cashhero-transactions')
          localStorage.removeItem('cashhero-portfolio-dynamic-v2')
          localStorage.removeItem('cashhero-planning-persistent')
          localStorage.removeItem('cashhero-language')
          localStorage.removeItem('cashhero-settings')
          
          // Clear standard browser cache dynamically
          if ('caches' in window) {
            caches.keys().then((names) => {
              for (const name of names) caches.delete(name)
            })
          }
          sessionStorage.clear()
          
          // Reload page to re-initialize stores
          window.location.reload()
        }
      }
    }),
    {
      name: 'cashhero-settings',
    }
  )
)
