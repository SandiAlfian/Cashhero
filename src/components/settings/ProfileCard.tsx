"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { User, Edit3, Save, CheckCircle2, CloudUpload, CloudDownload, RefreshCw, LogOut, AlertCircle, UserRoundCheck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { localT, itemVariants, getInitials } from "@/lib/settings"
import { BackupDetailModal } from "./BackupDetailModal"
import { RestoreDetailModal } from "./RestoreDetailModal"

const provider = new GoogleAuthProvider()
provider.addScope('email')
provider.addScope('profile')

interface ProfileCardProps {
  triggerToast: (msg: string) => void
}

export function ProfileCard({ triggerToast }: ProfileCardProps) {
  const { language } = useLanguageStore()
  const username = useSettingsStore((state) => state.username)
  const email = useSettingsStore((state) => state.email)
  const setProfile = useSettingsStore((state) => state.setProfile)
  const { user, lastSyncAt, isSyncing, backupAvailable, setUser, setLastSyncAt, setBackupAvailable, logout } = useAuthStore()

  const [mounted, setMounted] = React.useState(false)
  const [isEditingProfile, setIsEditingProfile] = React.useState(false)
  const [nameInput, setNameInput] = React.useState("")
  const [emailInput, setEmailInput] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [showBackupModal, setShowBackupModal] = React.useState(false)
  const [showRestoreModal, setShowRestoreModal] = React.useState(false)
  const [backupLoading, setBackupLoading] = React.useState(false)
  const [restoreLoading, setRestoreLoading] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    setNameInput(username)
    setEmailInput(email)
  }, [username, email])

  // Check backup availability on mount when user is logged in
  React.useEffect(() => {
    if (!user || !useAuthStore.getState().idToken) return
    let cancelled = false
    const token = useAuthStore.getState().idToken
    fetch('/api/backup/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setBackupAvailable(!!data.exists)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [user?.uid]) // eslint-disable-line react-hooks/exhaustive-deps

  const t = React.useCallback((key: keyof typeof localT['id']) => {
    if (!mounted) return localT['id'][key]
    return localT[language]?.[key] || localT['id'][key]
  }, [mounted, language])

  const handleSaveProfile = () => {
    if (!nameInput.trim()) return
    setProfile(nameInput, emailInput)
    setIsEditingProfile(false)
    triggerToast(t("profileUpdated"))
  }

  const handleCancelEdit = () => {
    setIsEditingProfile(false)
    setNameInput(username)
    setEmailInput(email)
  }

  function friendlyError(msg: string): string {
    const m = msg.toLowerCase()
    if (m.includes('popup') || m.includes('closed') || m.includes('blocked'))
      return language === 'id' ? 'Popup login ditutup atau diblokir. Izinkan popup untuk situs ini.' : 'Login popup closed or blocked. Please allow popups for this site.'
    if (m.includes('expired'))
      return language === 'id' ? 'Sesi masuk telah berakhir. Silakan masuk kembali.' : 'Your session has expired. Please sign in again.'
    if (m.includes('invalid') || m.includes('verification failed') || m.includes('token'))
      return language === 'id' ? 'Sesi tidak valid. Silakan masuk kembali.' : 'Invalid session. Please sign in again.'
    if (m.includes('500') || m.includes('server error') || m.includes('not available'))
      return language === 'id' ? 'Layanan sedang terganggu. Silakan coba beberapa saat lagi.' : 'Service temporarily unavailable. Please try again later.'
    if (m.includes('network') || m.includes('fetch') || m.includes('abort') || m.includes('timeout'))
      return language === 'id' ? 'Koneksi gagal. Periksa jaringan Anda.' : 'Connection failed. Check your network.'
    if (m.includes('firestore') || m.includes('database'))
      return language === 'id' ? 'Layanan penyimpanan cloud tidak tersedia.' : 'Cloud storage service unavailable.'
    return language === 'id' ? 'Sinkronisasi gagal. Silakan coba lagi.' : 'Sync failed. Please try again.'
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
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody?.error || `Server returned ${res.status}`)
      }
      const data = await res.json()

      setUser({ uid: data.uid, email: data.email, name: data.name, picture: data.picture }, token)

      setProfile(data.name, data.email)
      setNameInput(data.name)
      setEmailInput(data.email)

      const restoreRes = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      })
      const restoreData = await restoreRes.json()
      setBackupAvailable(!!restoreData.exists)
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string }
      setError(err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request'
        ? (language === 'id' ? 'Popup login ditutup atau diblokir. Izinkan popup untuk situs ini.' : 'Login popup closed or blocked. Please allow popups for this site.')
        : friendlyError(err?.message || ''))
    }
  }

  const handleBackup = async () => {
    const token = useAuthStore.getState().idToken
    if (!token) return
    setBackupLoading(true)
    setShowBackupModal(false)
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
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody?.error || `Server returned ${res.status}`)
      }
      const data = await res.json()
      setLastSyncAt(data.backedUpAt)
      setBackupAvailable(true)
      triggerToast(language === 'id' ? 'Data berhasil dicadangkan ke cloud!' : 'Data backed up to cloud successfully!')
    } catch (e) {
      setError(friendlyError((e as Error)?.message || ''))
    } finally {
      setBackupLoading(false)
    }
  }

  const handleRestoreConfirm = async (backupData: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    setRestoreLoading(true)
    try {
      const d = backupData
      if (d.settings) useSettingsStore.setState({ ...d.settings })
      if (d.transactions) useTransactionStore.setState({ transactions: d.transactions })
      if (d.budgets) usePlanningStore.setState({ budgets: d.budgets })
      if (d.goals) usePlanningStore.setState({ goals: d.goals })
      if (d.autoLogRules) useAutoLogStore.setState({ rules: d.autoLogRules })
      if (d.trackedOutflows) {
        useTrackedOutflowsStore.setState({ items: d.trackedOutflows })
      } else if (d.transactions) {
        const piutangTx = d.transactions.filter(
          (tx: any) => tx.type === 'out' && tx.category?.toLowerCase().includes('piutang')
        )
        if (piutangTx.length > 0) {
          const migrated = piutangTx.map((tx: any) => ({
            id: crypto.randomUUID(),
            jenis: 'piutang',
            personName: tx.note || tx.category,
            amount: tx.amount,
            remainingAmount: tx.amount,
            date: tx.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
            dueDate: '',
            note: `${tx.category}${tx.note && tx.note !== tx.category ? ` — ${tx.note}` : ''}`,
            status: 'active' as const,
            repayments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }))
          useTrackedOutflowsStore.setState({ items: migrated })
        }
      }
      if (d.portfolioAssets) usePortfolioStore.setState({ assets: d.portfolioAssets })
      setLastSyncAt(d.backedUpAt)
      setShowRestoreModal(false)
      triggerToast(language === 'id' ? 'Data berhasil dipulihkan dari cloud!' : 'Data restored from cloud successfully!')
    } catch (e) {
      setError(friendlyError((e as Error)?.message || ''))
    } finally {
      setRestoreLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const auth = getFirebaseAuth()
      await auth.signOut()
    } catch { /* ignore */ }
    logout()
    setError(null)
  }

  const formatSyncTime = (iso: string | null) => {
    if (!iso) return null
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
      <motion.div variants={itemVariants} className="h-full">
        <Card className="bg-card/25 backdrop-blur-md border border-border/40 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 group hover:border-primary/20 h-full flex flex-col">
          <CardHeader className="pb-3 border-b border-border/20 bg-muted/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground text-lg font-bold flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                {language === 'id' ? 'Profil & Identitas' : 'Profile & Identity'}
              </CardTitle>
              <span className="text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full select-none">
                {language === 'id' ? 'Aktif' : 'Active'}
              </span>
            </div>
            <CardDescription className="text-xs">
              {language === 'id' ? 'Kelola informasi profil dan sinkronisasi akun Google.' : 'Manage profile information and Google account sync.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 flex-1 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              {/* User Profile Summary */}
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-muted/20 border border-border/10">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-rose-700 dark:from-rose-500 dark:to-violet-600 flex items-center justify-center font-black text-white shadow-md text-base select-none shrink-0 transition-transform duration-300 group-hover:scale-105">
                  {getInitials(username)}
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm leading-tight">{username}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{email || "user@cashhero.app"}</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-3.5">
                <div className="grid gap-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-muted-foreground/80 tracking-wider">
                    {t("fullName")}
                  </label>
                  <input
                    type="text"
                    disabled={!isEditingProfile}
                    value={isEditingProfile ? nameInput : username}
                    onChange={(e) => setNameInput(e.target.value)}
                    className={`bg-muted/10 border rounded-lg px-3 py-2 text-xs font-semibold w-full transition-all duration-200 ${isEditingProfile
                      ? "border-primary/50 text-foreground bg-muted/20 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                      : "border-border/30 text-muted-foreground cursor-not-allowed opacity-80"
                    }`}
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-muted-foreground/80 tracking-wider">
                    {t("email")}
                  </label>
                  <input
                    type="email"
                    disabled={!isEditingProfile}
                    value={isEditingProfile ? emailInput : (email || "user@cashhero.app")}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className={`bg-muted/10 border rounded-lg px-3 py-2 text-xs font-semibold w-full transition-all duration-200 ${isEditingProfile
                      ? "border-primary/50 text-foreground bg-muted/20 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                      : "border-border/30 text-muted-foreground cursor-not-allowed opacity-80"
                    }`}
                  />
                </div>
              </div>

              {/* Google Sync Section — visible only in edit mode */}
              {isEditingProfile && (
                <div className="pt-2 border-t border-border/10">
                  {/* Section Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/70">
                      {language === 'id' ? 'SINKRONISASI GOOGLE' : 'GOOGLE SYNC'}
                    </span>
                    {user && (
                      <span className="ml-auto text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-2.5 h-2.5 inline-block mr-0.5 -mt-0.5" />
                        {language === 'id' ? 'Terhubung' : 'Connected'}
                      </span>
                    )}
                  </div>

                  {user ? (
                    /* Signed in — show sync controls */
                    <div className="space-y-3">
                      {/* Google user info */}
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border border-blue-500/15">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white shadow-sm text-sm select-none shrink-0 overflow-hidden">
                          {user.picture ? (
                            <img src={user.picture} alt="" className="w-full h-full object-cover" />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-foreground text-xs leading-tight truncate">{user.name}</h4>
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{user.email}</p>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      </div>

                      {/* Auto-sync info */}
                      <div className="flex items-center gap-1.5 px-0.5">
                        <UserRoundCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          {language === 'id' ? 'Profil otomatis diperbarui dari akun Google.' : 'Profile auto-updated from Google account.'}
                        </span>
                      </div>

                      {/* Sync status */}
                      <div className="flex items-center justify-between text-[9px] text-muted-foreground px-0.5 py-1.5 border-b border-border/10">
                        <span className="flex items-center gap-1">
                          <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin text-blue-500' : ''}`} />
                          {language === 'id' ? 'Terakhir' : 'Last sync'}: {isSyncing
                            ? (language === 'id' ? 'Menyinkronkan...' : 'Syncing...')
                            : (lastSyncAt ? formatSyncTime(lastSyncAt) : (language === 'id' ? 'Belum pernah' : 'Never'))
                          }
                        </span>
                        <span className={`flex items-center gap-1 font-semibold ${backupAvailable ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                          {backupAvailable ? (
                            <><CheckCircle2 className="w-2.5 h-2.5" /> {language === 'id' ? 'Cadangan tersedia' : 'Backup available'}</>
                          ) : (
                            <><CloudUpload className="w-2.5 h-2.5" /> {language === 'id' ? 'Belum ada cadangan' : 'No backup yet'}</>
                          )}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowBackupModal(true)}
                          disabled={isSyncing}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-blue-500 text-white hover:bg-blue-500/90 py-2.5 px-3 rounded-xl font-bold text-[11px] transition-all duration-200 cursor-pointer shadow-lg shadow-blue-500/20 disabled:opacity-55 disabled:cursor-not-allowed select-none active:scale-[0.97]"
                        >
                          {isSyncing ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CloudUpload className="w-3.5 h-3.5" />
                          )}
                          <span>{language === 'id' ? 'Cadangkan' : 'Backup'}</span>
                        </button>
                        <button
                          onClick={() => setShowRestoreModal(true)}
                          disabled={isSyncing || !backupAvailable}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-muted/20 hover:bg-muted/40 border border-border/40 text-foreground py-2.5 px-3 rounded-xl font-bold text-[11px] transition-all duration-200 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed select-none active:scale-[0.97]"
                        >
                          <CloudDownload className="w-3.5 h-3.5" />
                          <span>{language === 'id' ? 'Pulihkan' : 'Restore'}</span>
                        </button>
                        <button
                          onClick={handleLogout}
                          disabled={isSyncing}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-transparent hover:bg-rose-500/10 border border-border/20 hover:border-rose-500/30 text-muted-foreground/60 hover:text-rose-500 py-2.5 px-3 rounded-xl font-bold text-[11px] transition-all duration-200 cursor-pointer disabled:opacity-50 select-none active:scale-[0.97]"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{language === 'id' ? 'Putuskan' : 'Disconnect'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Not signed in — show connect button */
                    <div className="space-y-3">
                      <div className="flex flex-col items-center gap-3 py-3 px-2 rounded-xl bg-muted/10 border border-dashed border-border/20">
                        <svg viewBox="0 0 48 48" className="w-8 h-8 opacity-70">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                          <path fill="#FBBC05" d="M10.54 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.87 7.35 2.56 10.56l7.98-5.97z" />
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                        <div className="text-center">
                          <p className="text-[10px] font-semibold text-muted-foreground">
                            {language === 'id' ? 'Hubungkan akun Google untuk cadangan cloud' : 'Connect Google account for cloud backup'}
                          </p>
                        </div>
                        <button
                          onClick={handleGoogleSignIn}
                          className="flex items-center gap-2 bg-blue-500 text-white hover:bg-blue-500/90 py-2 px-4 rounded-lg font-bold text-[10px] transition-all duration-200 cursor-pointer shadow-lg shadow-blue-500/20 select-none"
                        >
                          <svg viewBox="0 0 48 48" className="w-3.5 h-3.5">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                            <path fill="#FBBC05" d="M10.54 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.87 7.35 2.56 10.56l7.98-5.97z" />
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z" />
                          </svg>
                          {language === 'id' ? 'Masuk dengan Google' : 'Sign in with Google'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Error banner inside edit mode */}
                  {error && (
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 mt-3">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span className="text-[9px] font-bold text-rose-500 leading-tight">{error}</span>
                        <button
                          onClick={() => setError(null)}
                          className="text-[8px] text-rose-500/70 hover:text-rose-500 font-semibold underline text-left"
                        >
                          {language === 'id' ? 'Tutup' : 'Dismiss'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom buttons */}
            {isEditingProfile ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCancelEdit}
                  className="w-full bg-muted/30 hover:bg-muted/50 border border-border text-foreground py-2.5 px-3 rounded-lg font-bold text-xs transition-all duration-200 cursor-pointer text-center select-none"
                >
                  {language === 'id' ? 'Batal' : 'Cancel'}
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 px-3 rounded-lg font-bold text-xs transition-all duration-200 cursor-pointer text-center shadow-md flex items-center justify-center gap-1.5 select-none"
                >
                  <Save className="w-3.5 h-3.5" />
                  {language === 'id' ? 'Simpan' : 'Save'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="w-full bg-muted/40 hover:bg-muted/65 border border-border text-foreground py-2.5 px-4 rounded-lg font-bold text-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 select-none group/btn"
                >
                  <Edit3 className="w-3.5 h-3.5 text-muted-foreground group-hover/btn:text-primary transition-colors" />
                  {t("editProfile")}
                </button>
                {user && !isEditingProfile && (
                  <div className="flex items-center justify-center gap-1.5 text-[9px] text-emerald-500/80 font-semibold">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    {language === 'id'
                      ? `Terhubung dengan Google${lastSyncAt ? ` · ${formatSyncTime(lastSyncAt)}` : ''}`
                      : `Connected with Google${lastSyncAt ? ` · ${formatSyncTime(lastSyncAt)}` : ''}`
                    }
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Backup Detail Modal */}
      <BackupDetailModal
        open={showBackupModal}
        onOpenChange={setShowBackupModal}
        onConfirm={handleBackup}
        loading={backupLoading}
      />

      {/* Restore Detail Modal */}
      <RestoreDetailModal
        open={showRestoreModal}
        onOpenChange={setShowRestoreModal}
        loading={restoreLoading}
        onApplyData={handleRestoreConfirm}
      />
    </>
  )
}
