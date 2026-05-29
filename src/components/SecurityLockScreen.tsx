"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Fingerprint, Lock, Delete, X, Check } from "lucide-react"
import { useSettingsStore } from "@/store/useSettingsStore"
import { useLanguageStore } from "@/store/useLanguageStore"

// Helper to convert Base64 string to ArrayBuffer
const base64ToBuffer = (base64: string): ArrayBuffer => {
  const binary = window.atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

const bufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

export function SecurityLockScreen() {
  const [mounted, setMounted] = React.useState(false)
  const [enteredPin, setEnteredPin] = React.useState("")
  const [confirmPin, setConfirmPin] = React.useState("")
  const [setupStep, setSetupStep] = React.useState<"enter" | "confirm">("enter")
  const [shake, setShake] = React.useState(false)
  const [isUnlocked, setIsUnlocked] = React.useState(false)
  const [completelyRemoved, setCompletelyRemoved] = React.useState(false)
  const [showSetupConfirm, setShowSetupConfirm] = React.useState(false)
  const [forceShowSetup, setForceShowSetup] = React.useState(false)

  // Custom Biometric Simulator states
  const [showSimulatedScan, setShowSimulatedScan] = React.useState(false)
  const [isScanning, setIsScanning] = React.useState(false)
  const [scanProgress, setScanProgress] = React.useState(0)
  const [scanSuccess, setScanSuccess] = React.useState(false)
  const [scanError, setScanError] = React.useState(false)

  const securityPIN = useSettingsStore((state) => state.securityPIN)
  const pinCode = useSettingsStore((state) => state.pinCode)
  const hasSetupSecurity = useSettingsStore((state) => state.hasSetupSecurity)
  const biometricsRegistered = useSettingsStore((state) => state.biometricsRegistered)
  const username = useSettingsStore((state) => state.username)
  const language = useLanguageStore((state) => state.language)

  // New store variables for secure biometrics ID and simulation flag
  const biometricCredentialId = useSettingsStore((state) => state.biometricCredentialId)
  const isBiometricsSimulated = useSettingsStore((state) => state.isBiometricsSimulated)
  
  const setPinCode = useSettingsStore((state) => state.setPinCode)
  const setHasSetupSecurity = useSettingsStore((state) => state.setHasSetupSecurity)
  const setSecurityPIN = useSettingsStore((state) => state.setSecurityPIN)
  const setBiometricsRegistered = useSettingsStore((state) => state.setBiometricsRegistered)

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(12)
    }
  }

  // Handle Scanning Progress
  React.useEffect(() => {
    let interval: NodeJS.Timeout
    if (isScanning && !scanSuccess) {
      interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            setScanSuccess(true)
            triggerHaptic()
            // Long success vibration
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([40, 50, 60])
            }
            // Unlock screen after visual success
            setTimeout(() => {
              setIsUnlocked(true)
              setTimeout(() => {
                setCompletelyRemoved(true)
                setShowSimulatedScan(false)
              }, 600)
            }, 500)
            return 100
          }
          // Tiny vibration tick during scanning
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(8)
          }
          return prev + 10 // Fill progress over 1 second (100ms * 10)
        })
      }, 100)
    } else if (!isScanning && !scanSuccess) {
      setScanProgress(0)
    }
    return () => clearInterval(interval)
  }, [isScanning, scanSuccess])

  const handleScanStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (scanSuccess) return
    setIsScanning(true)
    setScanError(false)
    triggerHaptic()
  }

  const handleScanEnd = () => {
    if (scanSuccess) return
    setIsScanning(false)
    if (scanProgress < 100) {
      setScanProgress(0)
      setScanError(true)
      triggerHaptic()
      // Error vibration
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100])
      }
      setTimeout(() => setScanError(false), 1500)
    }
  }

  const handleBiometricAuth = React.useCallback(async () => {
    if (typeof window === 'undefined') return

    // If registered as simulated, trigger custom overlay immediately
    if (isBiometricsSimulated) {
      setShowSimulatedScan(true)
      return
    }

    // If native biometrics but credential id is missing, fall back to simulation
    if (!window.PublicKeyCredential || !biometricCredentialId) {
      setShowSimulatedScan(true)
      return
    }

    try {
      const challenge = new Uint8Array(32)
      window.crypto.getRandomValues(challenge)
      
      const credIdBuffer = base64ToBuffer(biometricCredentialId)
      
      const options: CredentialRequestOptions = {
        publicKey: {
          challenge,
          rpId: window.location.hostname,
          timeout: 60000,
          allowCredentials: [{
            id: credIdBuffer,
            type: 'public-key'
          }],
          userVerification: "required"
        }
      }
      
      const credential = await navigator.credentials.get(options)
      if (credential) {
        triggerHaptic()
        setIsUnlocked(true)
        setTimeout(() => setCompletelyRemoved(true), 600)
      }
    } catch (err: unknown) {
      console.error("WebAuthn Auth Error:", err)
      // Do NOT fallback to simulation if they actually have a real biometric id.
      // If they cancel, they can just use PIN.
    }
  }, [isBiometricsSimulated, biometricCredentialId])

  React.useEffect(() => {
    setMounted(true)
    
    // Always trigger setup confirm on initial load if security is not set up
    if (!hasSetupSecurity) {
      setShowSetupConfirm(true)
      setForceShowSetup(true)
    }

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
                const rpId = window.location.hostname

                const credential = await navigator.credentials.create({
                  publicKey: {
                    challenge,
                    rp: { name: "Cashhero", id: rpId },
                    user: { id: challenge, name: username, displayName: username },
                    pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
                    authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
                    timeout: 60000
                  }
                }) as PublicKeyCredential | null

                if (credential) {
                  const credIdBase64 = bufferToBase64(credential.rawId)
                  setBiometricsRegistered(true)
                  useSettingsStore.getState().setIsBiometricsSimulated(false)
                  useSettingsStore.getState().setBiometricCredentialId(credIdBase64)
                }
              } catch (err) {
                console.error("WebAuthn initial setup failed", err)
                // Biometrics setup skipped or failed natively
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

  if (!mounted || completelyRemoved) return null
  if (!securityPIN && !forceShowSetup) return null

  return (
    <>
      <AnimatePresence>
        {!isUnlocked && (
          <motion.div
            key="main-lock-screen"
            initial={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "-100%", transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/98 dark:bg-zinc-950/98 backdrop-blur-2xl text-foreground overflow-hidden select-none font-sans"
        >
          {showSetupConfirm ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="max-w-md w-full px-6 text-center flex flex-col items-center gap-6 md:p-8"
            >
              {/* Premium Lock Shield Visual with Ambient Glow */}
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 dark:bg-primary/25 blur-2xl rounded-full scale-150 animate-pulse" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-rose-600 text-white flex items-center justify-center shadow-lg shadow-primary/20">
                  <Lock className="w-8 h-8 animate-pulse" />
                </div>
              </div>

              <div className="space-y-2.5">
                <h2 className="text-2xl font-black text-foreground tracking-tight sm:text-3xl font-manrope">
                  {language === 'id' ? 'Aktifkan PIN Keamanan?' : 'Enable Security PIN?'}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
                  {language === 'id' 
                    ? 'Amankan data transaksi, catatan keuangan, dan alokasi budget Anda dari akses tidak sah dengan 6 digit PIN. Anda juga dapat menggunakan sidik jari/biometrik setelahnya.'
                    : 'Protect your financial logs, budgets, and transactions from unauthorized access with a 6-digit PIN. You can also use fingerprint/biometrics afterwards.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full mt-3.5">
                <button
                  onClick={() => {
                    triggerHaptic()
                    // Disable securityPIN in store so user doesn't get prompted
                    setSecurityPIN(false)
                    // Unlock the screen
                    setIsUnlocked(true)
                    setTimeout(() => setCompletelyRemoved(true), 600)
                  }}
                  className="flex-1 order-2 sm:order-1 bg-muted/40 hover:bg-muted/75 text-foreground border border-border/40 font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-2xl transition-all cursor-pointer select-none active:scale-[0.96]"
                >
                  {language === 'id' ? 'Nanti Saja' : 'Maybe Later'}
                </button>
                <button
                  onClick={() => {
                    triggerHaptic()
                    setSecurityPIN(true)
                    setShowSetupConfirm(false)
                  }}
                  className="flex-1 order-1 sm:order-2 bg-primary text-primary-foreground hover:bg-primary/95 shadow-lg shadow-primary/15 font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-2xl transition-all cursor-pointer select-none active:scale-[0.96]"
                >
                  {language === 'id' ? 'Ya, Buat PIN' : 'Yes, Create PIN'}
                </button>
              </div>
            </motion.div>
          ) : (
            /* Lock Screen Body */
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
                        ? 'Masukkan 6 digit PIN keamanan atau gunakan sidik jari untuk masuk.'
                        : 'Enter your 6-digit security PIN or scan fingerprint to access.')
                    : (setupStep === 'enter'
                        ? (language === 'id' ? 'Buat 6 digit PIN untuk mengamankan data Anda.' : 'Create a 6-digit PIN to secure your data.')
                        : (language === 'id' ? 'Konfirmasi ulang 6 digit PIN Anda.' : 'Please confirm your 6-digit PIN.'))}
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
          )}
        </motion.div>
      )}
      </AnimatePresence>

      {/* Custom Biometric Simulator Modal Overlay */}
      <AnimatePresence>
        {showSimulatedScan && (
          <motion.div
            key="simulated-scan-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-background/95 dark:bg-zinc-950/95 backdrop-blur-2xl px-6 pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="bg-card border border-border/40 max-w-sm w-full p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 relative"
            >
              {/* Close button */}
              <button
                onClick={() => {
                  triggerHaptic()
                  setShowSimulatedScan(false)
                  setIsScanning(false)
                  setScanProgress(0)
                }}
                className="absolute top-4 right-4 p-1.5 hover:bg-muted/80 rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Title */}
              <div className="text-center space-y-1.5">
                <h3 className="text-lg font-black tracking-tight text-foreground uppercase">
                  {language === 'id' ? 'Pemindai Biometrik' : 'Biometric Scanner'}
                </h3>
                <p className="text-[11px] font-bold uppercase text-primary/80 tracking-wider">
                  {isBiometricsSimulated 
                    ? (language === 'id' ? 'Mode Simulasi Aktif' : 'Simulation Mode Active')
                    : (language === 'id' ? 'Pemindai Hardware Fallback' : 'Hardware Fallback Active')}
                </p>
              </div>

              {/* Pulse & Scanner Circle */}
              <div className="relative my-4 flex items-center justify-center">
                {/* Ambient glow in background */}
                <div className={`absolute inset-0 blur-2xl rounded-full scale-125 transition-all duration-500 ${
                  scanSuccess 
                    ? "bg-emerald-500/25" 
                    : scanError 
                      ? "bg-destructive/25" 
                      : isScanning 
                        ? "bg-primary/30" 
                        : "bg-primary/10"
                }`} />

                {/* Pulsing ring outer */}
                <div className={`absolute -inset-4 rounded-full border transition-all duration-300 ${
                  scanSuccess
                    ? "border-emerald-500/35 scale-105"
                    : scanError
                      ? "border-destructive/35"
                      : isScanning
                        ? "border-primary/45 scale-110 animate-ping"
                        : "border-border/30"
                }`} />

                {/* Fingerprint visual target button */}
                <motion.button
                  animate={scanError ? { x: [-6, 6, -6, 6, 0] } : {}}
                  transition={{ duration: 0.3 }}
                  onMouseDown={handleScanStart}
                  onMouseUp={handleScanEnd}
                  onMouseLeave={handleScanEnd}
                  onTouchStart={handleScanStart}
                  onTouchEnd={handleScanEnd}
                  className={`w-28 h-28 rounded-full flex flex-col items-center justify-center relative cursor-pointer outline-none select-none transition-all duration-300 border shadow-inner ${
                    scanSuccess
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-500"
                      : scanError
                        ? "bg-destructive/10 border-destructive text-destructive"
                        : isScanning
                          ? "bg-primary/20 border-primary scale-[0.96] text-primary"
                          : "bg-muted/30 border-border/80 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                  title="Sentuh dan tahan sidik jari"
                >
                  {/* SVG circular progress ring */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                    <circle
                      cx="56"
                      cy="56"
                      r="52"
                      className="stroke-muted/10 stroke-2 fill-none"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="52"
                      className={`stroke-[3px] fill-none transition-all duration-100 ${
                        scanSuccess 
                          ? "stroke-emerald-500" 
                          : scanError 
                            ? "stroke-destructive" 
                            : "stroke-primary"
                      }`}
                      strokeDasharray="326.7"
                      strokeDashoffset={326.7 - (326.7 * scanProgress) / 100}
                    />
                  </svg>

                  {scanSuccess ? (
                    <Check className="w-10 h-10 animate-bounce" />
                  ) : (
                    <Fingerprint className={`w-12 h-12 transition-all ${
                      isScanning ? "scale-110 drop-shadow-[0_0_8px_rgba(129,11,56,0.5)]" : ""
                    }`} />
                  )}
                </motion.button>
              </div>

              {/* Status helper text */}
              <div className="text-center h-10 max-w-[240px]">
                <p className={`text-xs font-semibold leading-relaxed transition-all ${
                  scanSuccess 
                    ? "text-emerald-500" 
                    : scanError 
                      ? "text-destructive" 
                      : isScanning 
                        ? "text-primary" 
                        : "text-muted-foreground"
                }`}>
                  {scanSuccess
                    ? (language === 'id' ? 'Autentikasi Berhasil!' : 'Authentication Successful!')
                    : scanError
                      ? (language === 'id' ? 'Gagal! Tahan jari selama 1 detik penuh.' : 'Failed! Hold finger for a full 1 second.')
                      : isScanning
                        ? (language === 'id' ? `Memindai... ${scanProgress}%` : `Scanning... ${scanProgress}%`)
                        : (language === 'id' 
                            ? 'Sentuh dan tahan ikon sidik jari untuk memverifikasi.' 
                            : 'Touch and hold the fingerprint icon to verify.')}
                </p>
              </div>

              {/* Use PIN Fallback */}
              <button
                onClick={() => {
                  triggerHaptic()
                  setShowSimulatedScan(false)
                  setIsScanning(false)
                  setScanProgress(0)
                }}
                className="w-full bg-muted/40 hover:bg-muted/70 text-foreground py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer select-none active:scale-[0.98] text-center"
              >
                {language === 'id' ? 'Gunakan PIN Keamanan' : 'Use Security PIN'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

