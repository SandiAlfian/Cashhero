import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type MainCurrency = 'IDR' | 'USD' | 'EUR' | 'SGD' | 'JPY'

export interface SettingsState {
  username: string
  email: string
  currency: MainCurrency
  defaultHistoryFilter: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'customPeriod'
  autoLogging: boolean
  securityPIN: boolean
  pinCode: string
  biometricsRegistered: boolean
  isSidebarCollapsed: boolean
  hasSetupSecurity: boolean
  biometricCredentialId?: string
  isBiometricsSimulated?: boolean
  isNotificationEnabled: boolean
  isBackgroundPushEnabled: boolean
  fcmToken: string
  exchangeRates: Record<MainCurrency, number>
  lastRatesUpdate: string
  ratesSource: 'api' | 'offline'
  setProfile: (username: string, email: string) => void
  setCurrency: (currency: MainCurrency) => void
  setDefaultHistoryFilter: (filter: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'customPeriod') => void
  setAutoLogging: (enabled: boolean) => void
  setSecurityPIN: (enabled: boolean) => void
  setPinCode: (pin: string) => void
  setBiometricsRegistered: (registered: boolean) => void
  setBiometricCredentialId: (id: string) => void
  setIsBiometricsSimulated: (simulated: boolean) => void
  toggleSidebar: () => void
  setHasSetupSecurity: (setup: boolean) => void
  setNotificationEnabled: (enabled: boolean) => void
  setBackgroundPushEnabled: (enabled: boolean) => void
  setFcmToken: (token: string) => void
  fetchExchangeRates: () => Promise<void>
  resetAllData: () => void
}

// Fixed Exchange Rates relative to IDR (Base currency is always stored in IDR)
export const EXCHANGE_RATES: Record<MainCurrency, number> = {
  IDR: 1,
  USD: 17825,
  EUR: 20650,
  SGD: 13950,
  JPY: 112
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
      biometricCredentialId: '',
      isBiometricsSimulated: false,
      isNotificationEnabled: false,
      isBackgroundPushEnabled: false,
      fcmToken: '',
      exchangeRates: {
        IDR: 1,
        USD: 17825,
        EUR: 20650,
        SGD: 13950,
        JPY: 112
      },
      lastRatesUpdate: '',
      ratesSource: 'offline',
      setProfile: (username, email) => set({ username, email }),
      setCurrency: (currency) => set({ currency }),
      setDefaultHistoryFilter: (defaultHistoryFilter) => set({ defaultHistoryFilter }),
      setAutoLogging: (autoLogging) => set({ autoLogging }),
      setSecurityPIN: (securityPIN) => set({ securityPIN }),
      setPinCode: (pinCode) => set({ pinCode }),
      setBiometricsRegistered: (biometricsRegistered) => set({ biometricsRegistered }),
      setBiometricCredentialId: (biometricCredentialId) => set({ biometricCredentialId }),
      setIsBiometricsSimulated: (isBiometricsSimulated) => set({ isBiometricsSimulated }),
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setHasSetupSecurity: (hasSetupSecurity) => set({ hasSetupSecurity }),
      setNotificationEnabled: (isNotificationEnabled) => set({ isNotificationEnabled }),
      setBackgroundPushEnabled: (isBackgroundPushEnabled: boolean) => set({ isBackgroundPushEnabled }),
      setFcmToken: (fcmToken: string) => set({ fcmToken }),
      fetchExchangeRates: async () => {
        try {
          const res = await fetch('https://open.er-api.com/v6/latest/IDR', { cache: 'no-store' })
          if (!res.ok) throw new Error('API request failed')
          const data = await res.json()
          if (data && data.result === 'success' && data.rates) {
            const rates = data.rates
            const newRates: Record<MainCurrency, number> = {
              IDR: 1,
              USD: rates.USD ? Math.round(1 / rates.USD) : 17825,
              EUR: rates.EUR ? Math.round(1 / rates.EUR) : 20650,
              SGD: rates.SGD ? Math.round(1 / rates.SGD) : 13950,
              JPY: rates.JPY ? Math.round(1 / rates.JPY) : 112,
            }
            
            // Mutate global constant for immediate non-reactive usage
            Object.assign(EXCHANGE_RATES, newRates)

            set({
              exchangeRates: newRates,
              lastRatesUpdate: new Date().toISOString(),
              ratesSource: 'api'
            })
          }
        } catch {
          // Gagal memuat kurs real-time, menggunakan default offline
          const fallbackRates = {
            IDR: 1,
            USD: 17825,
            EUR: 20650,
            SGD: 13950,
            JPY: 112
          }
          Object.assign(EXCHANGE_RATES, fallbackRates)
          set({
            exchangeRates: fallbackRates,
            ratesSource: 'offline'
          })
        }
      },
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
