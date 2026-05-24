"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Fingerprint, Lock, Delete } from "lucide-react"
import { useSettingsStore } from "@/store/useSettingsStore"
import { useLanguageStore } from "@/store/useLanguageStore"

export function SecurityLockScreen() {
  const [mounted, setMounted] = React.useState(false)
  const [enteredPin, setEnteredPin] = React.useState("")
  const [confirmPin, setConfirmPin] = React.useState("")
  const [setupStep, setSetupStep] = React.useState<"enter" | "confirm">("enter")
  const [shake, setShake] = React.useState(false)
  const [isUnlocked, setIsUnlocked] = React.useState(false)
  const [completelyRemoved, setCompletelyRemoved] = React.useState(false)

  const securityPIN = useSettingsStore((state) => state.securityPIN)
  const pinCode = useSettingsStore((state) => state.pinCode)
  const hasSetupSecurity = useSettingsStore((state) => state.hasSetupSecurity)
  const biometricsRegistered = useSettingsStore((state) => state.biometricsRegistered)
  const username = useSettingsStore((state) => state.username)
  const language = useLanguageStore((state) => state.language)
  
  const setPinCode = useSettingsStore((state) => state.setPinCode)
  const setHasSetupSecurity = useSettingsStore((state) => state.setHasSetupSecurity)
  const setBiometricsRegistered = useSettingsStore((state) => state.setBiometricsRegistered)

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(12)
    }
  }

  const handleBiometricAuth = React.useCallback(async () => {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) return
    try {
      const challenge = new Uint8Array(32)
      window.crypto.getRandomValues(challenge)
      
      const options: CredentialRequestOptions = {
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: "required"
        }
      }
      
      const credential = await navigator.credentials.get(options)
      if (credential) {
        triggerHaptic()
        setIsUnlocked(true)
        setTimeout(() => setCompletelyRemoved(true), 600)
      }
    } catch (err) {
      console.warn("Biometrics failed/cancelled:", err)
    }
  }, [])

  React.useEffect(() => {
    setMounted(true)
    if (securityPIN && hasSetupSecurity && biometricsRegistered) {
      // Trigger biometrics scan instantly on load for banking experience
      const timer = setTimeout(() => {
        handleBiometricAuth()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [securityPIN, hasSetupSecurity, biometricsRegistered, handleBiometricAuth])

  // Process PIN inputs
  const handleNumClick = async (num: string) => {
    if (enteredPin.length >= 6) return
    triggerHaptic()
    const nextPin = enteredPin + num
    setEnteredPin(nextPin)

    if (nextPin.length === 6) {
      if (!hasSetupSecurity) {
        if (setupStep === "enter") {
          setTimeout(() => {
            setConfirmPin(nextPin)
            setEnteredPin("")
            setSetupStep("confirm")
          }, 300)
        } else {
          if (nextPin === confirmPin) {
            setPinCode(nextPin)
            
            // Try to ask for biometrics
            if (typeof window !== 'undefined' && window.PublicKeyCredential) {
              try {
                const challenge = new Uint8Array(32)
                window.crypto.getRandomValues(challenge)
                const credential = await navigator.credentials.create({
                  publicKey: {
                    challenge,
                    rp: { name: "Cashhero" },
                    user: { id: challenge, name: username, displayName: username },
                    pubKeyCredParams: [{ type: "public-key", alg: -7 }],
                    authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
                    timeout: 60000
                  }
                })
                if (credential) setBiometricsRegistered(true)
              } catch (e) {
                console.warn("Biometrics setup skipped", e)
              }
            }
            
            setHasSetupSecurity(true)
            setTimeout(() => {
              setIsUnlocked(true)
              setTimeout(() => setCompletelyRemoved(true), 600)
            }, 300)
          } else {
            setTimeout(() => {
              setShake(true)
              triggerHaptic()
              setTimeout(() => {
                setShake(false)
                setEnteredPin("")
                setSetupStep("enter")
              }, 500)
            }, 200)
          }
        }
      } else {
        if (nextPin === pinCode) {
          setTimeout(() => {
            setIsUnlocked(true)
            setTimeout(() => setCompletelyRemoved(true), 600)
          }, 150)
        } else {
          setTimeout(() => {
            setShake(true)
            triggerHaptic()
            setTimeout(() => {
              setShake(false)
              setEnteredPin("")
            }, 500)
          }, 200)
        }
      }
    }
  }

  const handleBackspace = () => {
    triggerHaptic()
    setEnteredPin(enteredPin.slice(0, -1))
  }

  if (!mounted || !securityPIN || completelyRemoved) return null

  return (
    <AnimatePresence>
      {!isUnlocked && (
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "-100%", transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/98 dark:bg-zinc-950/98 backdrop-blur-2xl text-foreground overflow-hidden select-none font-sans"
        >
          {/* Lock Screen Body */}
          <div className="flex flex-col items-center justify-center max-w-sm w-full px-8 text-center gap-6">
            {/* Header Lock Icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner mb-2"
            >
              <Lock className="w-6 h-6 animate-pulse" />
            </motion.div>

            <div>
              <h2 className="text-xl font-extrabold text-foreground tracking-tight">
                {language === 'id' 
                  ? (hasSetupSecurity ? `Halo, ${username}` : "Buat PIN Baru") 
                  : (hasSetupSecurity ? `Hello, ${username}` : "Create New PIN")}
              </h2>
              <p className="text-xs text-muted-foreground mt-1.5 leading-normal h-8">
                {hasSetupSecurity
                  ? (language === 'id' 
                      ? "Masukkan 6 digit PIN keamanan atau gunakan sidik jari untuk masuk." 
                      : "Enter your 6-digit security PIN or scan fingerprint to access.")
                  : (setupStep === "enter"
                      ? (language === 'id' ? "Buat 6 digit PIN untuk mengamankan data Anda." : "Create a 6-digit PIN to secure your data.")
                      : (language === 'id' ? "Konfirmasi ulang 6 digit PIN Anda." : "Please confirm your 6-digit PIN."))}
              </p>
            </div>

            {/* PIN Progress Indicator Dots */}
            <motion.div 
              animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="flex gap-3.5 justify-center items-center py-4 my-2"
            >
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const filled = enteredPin.length > idx
                return (
                  <div
                    key={idx}
                    className={`w-3 h-3 rounded-full transition-all duration-200 border ${
                      shake
                        ? 'border-destructive bg-destructive'
                        : filled
                          ? 'bg-primary border-primary scale-110 shadow-sm shadow-primary/45'
                          : 'border-muted-foreground/30 bg-muted/20'
                    }`}
                  />
                )
              })}
            </motion.div>

            {/* Tactical PIN Keyboard */}
            <div className="grid grid-cols-3 gap-x-6 gap-y-4 justify-items-center w-full max-w-[260px] my-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumClick(num)}
                  className="w-16 h-16 rounded-full border border-border/40 bg-muted/10 hover:bg-muted/30 text-foreground font-black text-xl flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-sm"
                >
                  {num}
                </button>
              ))}

              {/* Column 10: Biometric Button (Conditional) */}
              {hasSetupSecurity && biometricsRegistered ? (
                <button
                  onClick={handleBiometricAuth}
                  className="w-16 h-16 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-sm"
                  title={language === 'id' ? "Autentikasi Sidik Jari" : "Biometric Scan"}
                >
                  <Fingerprint className="w-6 h-6 animate-pulse" />
                </button>
              ) : (
                <div className="w-16 h-16" />
              )}

              {/* Column 11: Number 0 */}
              <button
                onClick={() => handleNumClick("0")}
                className="w-16 h-16 rounded-full border border-border/40 bg-muted/10 hover:bg-muted/30 text-foreground font-black text-xl flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-sm"
              >
                0
              </button>

              {/* Column 12: Backspace Button */}
              <button
                onClick={handleBackspace}
                disabled={enteredPin.length === 0}
                className="w-16 h-16 rounded-full text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
                title={language === 'id' ? "Hapus" : "Backspace"}
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
