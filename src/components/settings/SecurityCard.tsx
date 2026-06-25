"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Shield, Lock, Key, Fingerprint } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguageStore } from "@/store/useLanguageStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { localT, itemVariants, bufferToBase64 } from "@/lib/settings"
import { PinModal } from "./PinModal"

interface SecurityCardProps {
  triggerToast: (msg: string) => void
}

export function SecurityCard({ triggerToast }: SecurityCardProps) {
  const { language } = useLanguageStore()
  const securityPIN = useSettingsStore((state) => state.securityPIN)
  const biometricsRegistered = useSettingsStore((state) => state.biometricsRegistered)
  const setSecurityPIN = useSettingsStore((state) => state.setSecurityPIN)

  const setBiometricsRegistered = useSettingsStore((state) => state.setBiometricsRegistered)
  const setBiometricCredentialId = useSettingsStore((state) => state.setBiometricCredentialId)
  const setIsBiometricsSimulated = useSettingsStore((state) => state.setIsBiometricsSimulated)
  const setHasSetupSecurity = useSettingsStore((state) => state.setHasSetupSecurity)

  const [mounted, setMounted] = React.useState(false)
  const [showPinModal, setShowPinModal] = React.useState(false)

  React.useEffect(() => { setMounted(true) }, [])

  const t = React.useCallback((key: keyof typeof localT['id']) => {
    if (!mounted) return localT['id'][key]
    return localT[language]?.[key] || localT['id'][key]
  }, [mounted, language])

  const handleRegisterBiometrics = async () => {
    if (typeof window === "undefined") return

    const isSecureOrigin = window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'

    if (window.PublicKeyCredential && isSecureOrigin) {
      try {
        const challenge = new Uint8Array(32)
        window.crypto.getRandomValues(challenge)
        const userId = new Uint8Array(16)
        window.crypto.getRandomValues(userId)
        const rpId = window.location.hostname
        const email = useSettingsStore.getState().email
        const username = useSettingsStore.getState().username

        const options: CredentialCreationOptions = {
          publicKey: {
            challenge,
            rp: { name: "Cashhero", id: rpId },
            user: {
              id: userId,
              name: email || "user@cashhero.app",
              displayName: username || "Cashhero User"
            },
            pubKeyCredParams: [
              { type: "public-key", alg: -7 },
              { type: "public-key", alg: -257 }
            ],
            timeout: 60000,
            authenticatorSelection: {
              authenticatorAttachment: "platform",
              userVerification: "required"
            }
          }
        }

        const credential = await navigator.credentials.create(options) as PublicKeyCredential | null
        if (credential) {
          const credIdBase64 = bufferToBase64(credential.rawId)
          setBiometricsRegistered(true)
          setIsBiometricsSimulated(false)
          setBiometricCredentialId(credIdBase64)
          setHasSetupSecurity(true)
          triggerToast(t("biometricRegisterSuccess"))
        }
        return
      } catch (err: unknown) {
        console.error("WebAuthn Registration Error:", err)
        triggerToast(
          language === 'id'
            ? "Pendaftaran biometrik gagal."
            : "Biometric registration failed."
        )
        return
      }
    }

    setBiometricsRegistered(true)
    setIsBiometricsSimulated(true)
    setBiometricCredentialId("")
    setHasSetupSecurity(true)
    triggerToast(
      language === 'id'
        ? "Mode Simulasi Biometrik diaktifkan karena browser/koneksi tidak mendukung WebAuthn."
        : "Biometrics Simulation Mode activated due to unsupported browser/connection."
    )
  }

  return (
    <motion.div variants={itemVariants}>
      <Card className="bg-card/25 backdrop-blur-md border border-border/40 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 group hover:border-primary/20 h-full flex flex-col">
        <CardHeader className="pb-3 border-b border-border/20 bg-muted/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground text-lg font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              {language === 'id' ? 'Keamanan & Akses' : 'Security & Access'}
            </CardTitle>
            <span className="text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full select-none">
              {securityPIN ? "PIN AKTIF" : "OFF"}
            </span>
          </div>
          <CardDescription className="text-xs">
            {language === 'id' ? 'Amankan data finansial Anda dengan otorisasi lokal.' : 'Protect your financial ledger with local authorization.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 flex-1 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/20 bg-muted/10">
              <div className="space-y-0.5 pr-2">
                <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  {t("securityPinToggle")}
                </h5>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  {t("securityPinToggleDesc")}
                </p>
              </div>
              <div
                onClick={() => {
                  if (!securityPIN) {
                    setShowPinModal(true)
                  } else {
                    setSecurityPIN(false)
                  }
                }}
                className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors duration-200 flex items-center shrink-0 ${securityPIN ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              >
                <motion.div
                  layout
                  className="w-4 h-4 bg-white rounded-full shadow-md"
                  animate={{ x: securityPIN ? 16 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </div>
            </div>

            {securityPIN && (
              <div className="p-3 rounded-xl border border-border/20 bg-muted/10 flex items-center justify-between gap-4">
                <div>
                  <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                    {t("pinRegistered")}
                  </h5>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {t("changePinDesc")}
                  </p>
                </div>
                <button
                  onClick={() => setShowPinModal(true)}
                  className="bg-muted hover:bg-muted/80 text-foreground border border-border/40 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all"
                >
                  {t("changePin")}
                </button>
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded-xl border border-border/20 bg-muted/10">
              <div className="space-y-0.5 pr-2">
                <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5 text-emerald-500" />
                  {t("biometricToggle")}
                </h5>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  {t("biometricToggleDesc")}
                </p>
              </div>
              <div
                onClick={() => {
                  if (!biometricsRegistered) {
                    handleRegisterBiometrics()
                  } else {
                    setBiometricsRegistered(false)
                  }
                }}
                className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors duration-200 flex items-center shrink-0 ${biometricsRegistered ? "bg-emerald-500" : "bg-muted-foreground/30"
                }`}
              >
                <motion.div
                  layout
                  className="w-4 h-4 bg-white rounded-full shadow-md"
                  animate={{ x: biometricsRegistered ? 16 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-emerald-500/10 bg-emerald-500/5 text-[10px] font-bold text-emerald-500 select-none">
            <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="uppercase tracking-wider">
              {securityPIN && biometricsRegistered
                ? t("pinAndBiometric")
                : securityPIN
                  ? (language === 'id' ? "PIN KEAMANAN AKTIF" : "SECURITY PIN ACTIVE")
                  : biometricsRegistered
                    ? (language === 'id' ? "BIOMETRIK SAJA" : "BIOMETRICS ONLY")
                    : (language === 'id' ? "SISTEM TIDAK TERKUNCI (TANPA PENGAMAN)" : "SYSTEM UNLOCKED (NO SECURITY)")}
            </span>
          </div>
        </CardContent>
      </Card>

      <PinModal
        show={showPinModal}
        onClose={() => setShowPinModal(false)}
        language={language}
        t={t}
        triggerToast={triggerToast}
      />
    </motion.div>
  )
}
