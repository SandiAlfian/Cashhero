"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogOut, CloudUpload, CloudDownload, RefreshCw, AlertCircle, CheckCircle2, UserRoundCheck } from "lucide-react"
import { useLanguageStore } from "@/store/useLanguageStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { useTransactionStore } from "@/store/useTransactionStore"
import { usePlanningStore } from "@/store/usePlanningStore"
import { useAutoLogStore } from "@/store/useAutoLogStore"
import { useTrackedOutflowsStore } from "@/store/useTrackedOutflowsStore"
import { usePortfolioStore } from "@/store/usePortfolioStore"
import { useAuthStore } from "@/store/useAuthStore"
import { getFirebaseAuth } from "@/lib/firebase"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { itemVariants } from "@/lib/settings"
import { ConfirmModal } from "@/components/ui/ConfirmModal"

const provider = new GoogleAuthProvider()
provider.addScope('email')
provider.addScope('profile')

export function SyncAccountCard({ triggerToast }: { triggerToast: (msg: string) => void }) {
  const { language } = useLanguageStore()
  const setProfile = useSettingsStore((s) => s.setProfile)
  const { user, lastSyncAt, isSyncing, setUser, setLastSyncAt, setIsSyncing, logout } = useAuthStore()
  const [backupExists, setBackupExists] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [showRestoreModal, setShowRestoreModal] = React.useState(false)
  const [restoreLoading, setRestoreLoading] = React.useState(false)

  const t = (key: string) => {
    const dict: Record<string, string> = {
      syncAccount: language === 'id' ? 'Sinkronisasi Akun' : 'Account Sync',
      syncDesc: language === 'id' ? 'Hubungkan akun Google untuk mencadangkan data secara aman dan isi profil otomatis.' : 'Connect Google to back up data securely and auto-fill your profile.',
      signIn: language === 'id' ? 'Masuk dengan Google' : 'Sign in with Google',
      signOut: language === 'id' ? 'Putuskan Akun' : 'Disconnect Account',
      backupNow: language === 'id' ? 'Cadangkan ke Cloud' : 'Backup to Cloud',
      restoreData: language === 'id' ? 'Pulihkan dari Cloud' : 'Restore from Cloud',
      syncing: language === 'id' ? 'Menyinkronkan...' : 'Syncing...',
      lastSync: language === 'id' ? 'Terakhir sinkron' : 'Last synced',
      never: language === 'id' ? 'Belum pernah' : 'Never',
      backupSuccess: language === 'id' ? 'Data berhasil dicadangkan ke cloud!' : 'Data backed up to cloud successfully!',
      restoreSuccess: language === 'id' ? 'Data berhasil dipulihkan dari cloud!' : 'Data restored from cloud successfully!',
      restoreTitle: language === 'id' ? 'Pulihkan Data dari Cloud' : 'Restore Data from Cloud',
      restoreMessage: language === 'id'
        ? 'Semua data lokal Anda akan ditimpa dengan data dari cloud. Tindakan ini tidak dapat dibatalkan. Pastikan Anda telah mencadangkan data lokal terlebih dahulu.'
        : 'All local data will be overwritten with cloud data. This action cannot be undone. Make sure you have backed up your local data first.',
      confirmRestore: language === 'id' ? 'Ya, Pulihkan Data' : 'Yes, Restore Data',
      cancel: language === 'id' ? 'Batal' : 'Cancel',
      noBackup: language === 'id' ? 'Belum ada cadangan di cloud. Lakukan pencadangan terlebih dahulu.' : 'No backup found in cloud. Please back up first.',
      popupBlocked: language === 'id' ? 'Popup ditutup atau diblokir. Izinkan popup untuk situs ini.' : 'Popup closed or blocked. Allow popups for this site.',
      syncError: language === 'id' ? 'Gagal menyinkronkan. Coba lagi.' : 'Sync failed. Please try again.',
      signedIn: language === 'id' ? 'Akun terhubung' : 'Account connected',
      googleAvatar: language === 'id' ? 'Foto Google' : 'Google photo',
      cloudAvailable: language === 'id' ? 'Cadangan cloud tersedia' : 'Cloud backup available',
      cloudUnavailable: language === 'id' ? 'Belum ada cadangan cloud' : 'No cloud backup yet',
      profileSynced: language === 'id' ? 'Profil & identitas otomatis diperbarui dari akun Google.' : 'Profile & identity auto-updated from Google account.',
    }
    return dict[key] || key
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    try {
      const auth = getFirebaseAuth()
      const result = await signInWithPopup(auth, provider)
      const token = await result.user.getIdToken()

      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      })
      if (!res.ok) throw new Error('Verification failed')
      const data = await res.json()

      setUser({ uid: data.uid, email: data.email, name: data.name, picture: data.picture }, token)

      // Auto-sync Google identity to profile
      setProfile(data.name, data.email)

      // Check if backup exists
      const restoreRes = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      })
      const restoreData = await restoreRes.json()
      if (restoreData.exists) {
        setBackupExists(true)
      }
    } catch (e: unknown) {
      const err = e as { code?: string }
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        setError(t('popupBlocked'))
      } else {
        setError(t('syncError'))
      }
    }
  }

  const handleBackup = async () => {
    const token = useAuthStore.getState().idToken
    if (!token) return
    setIsSyncing(true)
    setError(null)
    try {
      const settingsState = useSettingsStore.getState()
      const { fcmToken, exchangeRates, lastRatesUpdate, ratesSource, fetchExchangeRates, resetAllData, ...safeSettings } = settingsState

      const payload = {
        transactions: useTransactionStore.getState().transactions,
        settings: safeSettings,
        budgets: usePlanningStore.getState().budgets,
        goals: usePlanningStore.getState().goals,
        autoLogRules: useAutoLogStore.getState().rules,
        trackedOutflows: useTrackedOutflowsStore.getState().items,
        portfolioAssets: usePortfolioStore.getState().assets,
      }

      const res = await fetch('/api/backup/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Backup failed')
      const data = await res.json()
      setLastSyncAt(data.backedUpAt)
      setBackupExists(true)
      triggerToast(t('backupSuccess'))
    } catch {
      setError(t('syncError'))
    } finally {
      setIsSyncing(false)
    }
  }

  const handleRestoreConfirm = async () => {
    setShowRestoreModal(false)
    setRestoreLoading(true)
    const token = useAuthStore.getState().idToken
    if (!token) { setRestoreLoading(false); return }
    setIsSyncing(true)
    setError(null)
    try {
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Restore failed')
      const data = await res.json()
      if (data.exists && data.data) {
        const d = data.data
        if (d.settings) useSettingsStore.setState({ ...d.settings })
        if (d.transactions) useTransactionStore.setState({ transactions: d.transactions })
        if (d.budgets) usePlanningStore.setState({ budgets: d.budgets })
        if (d.goals) usePlanningStore.setState({ goals: d.goals })
        if (d.autoLogRules) useAutoLogStore.setState({ rules: d.autoLogRules })
        if (d.trackedOutflows) useTrackedOutflowsStore.setState({ items: d.trackedOutflows })
        if (d.portfolioAssets) usePortfolioStore.setState({ assets: d.portfolioAssets })
        setLastSyncAt(d.backedUpAt)
        triggerToast(t('restoreSuccess'))
      } else {
        triggerToast(t('noBackup'))
      }
    } catch {
      setError(t('syncError'))
    } finally {
      setIsSyncing(false)
      setRestoreLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const auth = getFirebaseAuth()
      await auth.signOut()
    } catch { /* ignore */ }
    logout()
    setBackupExists(false)
    setError(null)
  }

  const formatSyncTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return language === 'id' ? 'Baru saja' : 'Just now'
    if (diffMin < 60) return language === 'id' ? `${diffMin} menit lalu` : `${diffMin}m ago`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return language === 'id' ? `${diffHr} jam lalu` : `${diffHr}h ago`
    return d.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <>
      <motion.div variants={itemVariants}>
        <Card className="bg-card/25 backdrop-blur-md border border-border/40 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 group hover:border-blue-500/20 h-full flex flex-col">
          <CardHeader className="pb-3 border-b border-border/20 bg-muted/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground text-lg font-bold flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-500" />
                {t('syncAccount')}
              </CardTitle>
              {user && (
                <span className="text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full select-none">
                  <CheckCircle2 className="w-3 h-3 inline-block mr-0.5 -mt-0.5" />
                  {t('signedIn')}
                </span>
              )}
            </div>
            <CardDescription className="text-xs">{t('syncDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="p-5 flex-1 flex flex-col gap-4">

            {user ? (
              <>
                {/* User Info Card */}
                <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border border-blue-500/15">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white shadow-md text-base select-none shrink-0 overflow-hidden">
                    {user.picture ? (
                      <img src={user.picture} alt={t('googleAvatar')} className="w-full h-full object-cover" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-foreground text-sm leading-tight truncate">{user.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{user.email}</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                </div>

                {/* Profile sync info */}
                <div className="flex items-center gap-2 px-1 -mt-1">
                  <UserRoundCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{t('profileSynced')}</span>
                </div>

                {/* Sync Status */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1 py-1.5 border-b border-border/10">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-blue-500' : ''}`} />
                    {t('lastSync')}: {isSyncing ? t('syncing') : (lastSyncAt ? formatSyncTime(lastSyncAt) : t('never'))}
                  </span>
                  <span className={`flex items-center gap-1 font-semibold ${backupExists ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                    {backupExists ? (
                      <><CheckCircle2 className="w-3 h-3" /> {t('cloudAvailable')}</>
                    ) : (
                      <><CloudUpload className="w-3 h-3" /> {t('cloudUnavailable')}</>
                    )}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2.5 mt-1">
                  <Button
                    onClick={handleBackup}
                    disabled={isSyncing}
                    className="flex-1 h-10 text-xs font-bold rounded-xl bg-blue-500 text-white hover:bg-blue-500/90 shadow-lg shadow-blue-500/20 disabled:opacity-55 transition-all duration-200"
                  >
                    {isSyncing ? (
                      <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                    ) : (
                      <CloudUpload className="w-4 h-4 mr-1.5" />
                    )}
                    {isSyncing ? t('syncing') : t('backupNow')}
                  </Button>
                  <Button
                    onClick={() => setShowRestoreModal(true)}
                    disabled={isSyncing || !backupExists}
                    variant="outline"
                    className="flex-1 h-10 text-xs font-bold rounded-xl border-border/40 hover:bg-muted/30 disabled:opacity-55 transition-all duration-200"
                  >
                    <CloudDownload className="w-4 h-4 mr-1.5" />
                    {t('restoreData')}
                  </Button>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-muted-foreground/70 hover:text-rose-500 transition-colors mt-0.5 cursor-pointer disabled:opacity-50 py-1"
                >
                  <LogOut className="w-3 h-3" />
                  {t('signOut')}
                </button>
              </>
            ) : (
              /* Signed Out State */
              <div className="flex flex-col items-center gap-5 py-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 flex items-center justify-center">
                  <svg viewBox="0 0 48 48" className="w-7 h-7">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.54 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.87 7.35 2.56 10.56l7.98-5.97z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">{t('syncAccount')}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 max-w-[280px]">{t('syncDesc')}</p>
                </div>
                <Button
                  onClick={handleGoogleSignIn}
                  disabled={isSyncing}
                  className="h-10 text-sm font-bold rounded-xl bg-blue-500 text-white hover:bg-blue-500/90 shadow-lg shadow-blue-500/20 px-6 disabled:opacity-55 transition-all duration-200"
                >
                  <svg viewBox="0 0 48 48" className="w-4 h-4 mr-2.5">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.54 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.87 7.35 2.56 10.56l7.98-5.97z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  {t('signIn')}
                </Button>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-rose-500 leading-tight">{error}</span>
                  <button
                    onClick={() => setError(null)}
                    className="text-[9px] text-rose-500/70 hover:text-rose-500 font-semibold underline text-left"
                  >
                    {language === 'id' ? 'Tutup' : 'Dismiss'}
                  </button>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </motion.div>

      {/* Restore Confirmation Modal */}
      <ConfirmModal
        open={showRestoreModal}
        onOpenChange={setShowRestoreModal}
        onConfirm={handleRestoreConfirm}
        icon="shield"
        variant="warning"
        title={t('restoreTitle')}
        message={t('restoreMessage')}
        confirmLabel={t('confirmRestore')}
        cancelLabel={t('cancel')}
        loading={restoreLoading}
      />
    </>
  )
}
