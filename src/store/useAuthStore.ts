import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  uid: string
  email: string
  name: string
  picture?: string
}

interface AuthState {
  user: AuthUser | null
  idToken: string
  lastSyncAt: string | null
  isSyncing: boolean
  backupAvailable: boolean
  backupConsentAt: string | null
  setUser: (user: AuthUser | null, idToken?: string) => void
  setIdToken: (token: string) => void
  setLastSyncAt: (date: string) => void
  setIsSyncing: (syncing: boolean) => void
  setBackupAvailable: (available: boolean) => void
  setBackupConsent: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      idToken: '',
      lastSyncAt: null,
      isSyncing: false,
      backupAvailable: false,
      backupConsentAt: null,

      setUser: (user, idToken) =>
        set({ user, idToken: idToken ?? '' }),

      setIdToken: (token) => set({ idToken: token }),

      setLastSyncAt: (date) => set({ lastSyncAt: date }),

      setIsSyncing: (syncing) => set({ isSyncing: syncing }),

      setBackupAvailable: (available) => set({ backupAvailable: available }),

      setBackupConsent: () => set({ backupConsentAt: new Date().toISOString() }),

      logout: () => set({ user: null, idToken: '', lastSyncAt: null, backupAvailable: false, backupConsentAt: null }),
    }),
    { name: 'cashhero-auth-store' }
  )
)
