"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Lock, X } from "lucide-react"
import { useSettingsStore } from "@/store/useSettingsStore"
import { localT } from "@/lib/settings"

interface PinModalProps {
  show: boolean
  onClose: () => void
  language: string
  t: (key: keyof typeof localT['id']) => string
  triggerToast: (msg: string) => void
}

export function PinModal({ show, onClose, language, t, triggerToast }: PinModalProps) {
  const setPinCode = useSettingsStore((state) => state.setPinCode)
  const setSecurityPIN = useSettingsStore((state) => state.setSecurityPIN)

  const [pinStep, setPinStep] = React.useState<"new" | "confirm">("new")
  const [tempPin, setTempPin] = React.useState("")
  const [enteredPinDigits, setEnteredPinDigits] = React.useState("")

  const resetPinModal = () => {
    setPinStep("new")
    setTempPin("")
    setEnteredPinDigits("")
  }

  const handlePinDigitClick = (digit: string) => {
    if (enteredPinDigits.length >= 6) return
    const nextDigits = enteredPinDigits + digit
    setEnteredPinDigits(nextDigits)

    if (nextDigits.length === 6) {
      if (pinStep === "new") {
        setTempPin(nextDigits)
        setTimeout(() => {
          setPinStep("confirm")
          setEnteredPinDigits("")
        }, 300)
      } else {
        if (nextDigits === tempPin) {
          setPinCode(nextDigits)
          setSecurityPIN(true)
          setTimeout(() => {
            onClose()
            triggerToast(t("pinSuccess"))
            resetPinModal()
          }, 350)
        } else {
          setTimeout(() => {
            triggerToast(t("pinMismatch"))
            setEnteredPinDigits("")
          }, 300)
        }
      }
    }
  }

  const handlePinBackspace = () => {
    setEnteredPinDigits(enteredPinDigits.slice(0, -1))
  }

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 dark:bg-zinc-950/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="relative bg-card text-card-foreground border border-border/80 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 flex flex-col items-center"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-muted/40 hover:bg-muted/70 flex items-center justify-center text-foreground hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
              <Lock className="w-5 h-5" />
            </div>

            <h3 className="text-base font-extrabold text-center text-foreground">
              {pinStep === "new" ? t("setNewPinTitle") : t("confirmNewPinTitle")}
            </h3>
            <p className="text-xs text-muted-foreground text-center mt-1 max-w-[240px]">
              {pinStep === "new"
                ? (language === 'id' ? 'Buat 6 digit sandi PIN pengaman.' : 'Create a 6-digit security PIN code.')
                : (language === 'id' ? 'Masukkan kembali PIN untuk validasi.' : 'Re-enter the PIN code for validation.')}
            </p>

            <div className="flex gap-4 justify-center items-center py-5 my-1">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const filled = enteredPinDigits.length > idx
                return (
                  <div
                    key={idx}
                    className={`w-3 h-3 rounded-full border transition-all duration-200 ${filled
                      ? "bg-primary border-primary scale-110 shadow-sm"
                      : "border-muted-foreground/30 bg-muted/30"
                    }`}
                  />
                )
              })}
            </div>

            <div className="grid grid-cols-3 gap-x-5 gap-y-3.5 justify-items-center w-full max-w-[240px] my-1">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  onClick={() => handlePinDigitClick(num)}
                  className="w-14 h-14 rounded-full border border-border/30 bg-muted/10 hover:bg-muted/20 text-foreground font-black text-lg flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-sm"
                >
                  {num}
                </button>
              ))}
              <div className="w-14 h-14" />
              <button
                onClick={() => handlePinDigitClick("0")}
                className="w-14 h-14 rounded-full border border-border/30 bg-muted/10 hover:bg-muted/20 text-foreground font-black text-lg flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-sm"
              >
                0
              </button>
              <button
                onClick={handlePinBackspace}
                disabled={enteredPinDigits.length === 0}
                className="w-14 h-14 rounded-full text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
