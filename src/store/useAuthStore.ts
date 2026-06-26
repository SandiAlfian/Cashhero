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
  setUser: (user: AuthUser | null, idToken?: string) => void
  setIdToken: (token: string) => void
  setLastSyncAt: (date: string) => void
  setIsSyncing: (syncing: boolean) => void
  setBackupAvailable: (available: boolean) => void
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

      setUser: (user, idToken) =>
        set({ user, idToken: idToken ?? '' }),

      setIdToken: (token) => set({ idToken: token }),

      setLastSyncAt: (date) => set({ lastSyncAt: date }),

      setIsSyncing: (syncing) => set({ isSyncing: syncing }),

      setBackupAvailable: (available) => set({ backupAvailable: available }),

      logout: () => set({ user: null, idToken: '', lastSyncAt: null, backupAvailable: false }),
    }),
    { name: 'cashhero-auth-store' }
  )
)
