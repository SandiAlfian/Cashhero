import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from './useAuthStore'

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
  USD: 17857,
  EUR: 20408,
  SGD: 13889,
  JPY: 111
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
        USD: 17857,
        EUR: 20408,
        SGD: 13889,
        JPY: 111
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
          const res = await fetch('https://api.frankfurter.dev/v1/latest?from=IDR&to=USD,EUR,SGD,JPY', { cache: 'no-store' })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          if (data && data.rates) {
            const rates = data.rates
            const newRates: Record<MainCurrency, number> = {
              IDR: 1,
              USD: rates.USD ? Math.round(1 / rates.USD) : 17857,
              EUR: rates.EUR ? Math.round(1 / rates.EUR) : 20408,
              SGD: rates.SGD ? Math.round(1 / rates.SGD) : 13889,
              JPY: rates.JPY ? Math.round(1 / rates.JPY) : 111,
            }

            Object.assign(EXCHANGE_RATES, newRates)

            set({
              exchangeRates: newRates,
              lastRatesUpdate: new Date().toISOString(),
              ratesSource: 'api'
            })
          } else {
            throw new Error('Invalid response structure')
          }
        } catch (err) {
            console.error('[ExchangeRates]', err)
          const fallbackRates = {
            IDR: 1,
            USD: 17857,
            EUR: 20408,
            SGD: 13889,
            JPY: 111
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
          // Sign out from Firebase and reset auth state
          import('@/lib/firebase').then(({ getFirebaseAuth }) => {
            try { getFirebaseAuth().signOut() } catch { /* ignore */ }
          })
          useAuthStore.getState().logout()

          // Clear all Cashhero local storage keys
          localStorage.removeItem('cashhero-transactions')
          localStorage.removeItem('cashhero-portfolio-dynamic-v2')
          localStorage.removeItem('cashhero-planning-persistent')
          localStorage.removeItem('cashhero-language')
          localStorage.removeItem('cashhero-settings')
          localStorage.removeItem('cashhero-tracked-outflows')
          localStorage.removeItem('cashhero-autolog-store')
          
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
