"use client"

import * as React from "react"
import { X } from "lucide-react"
import { useLanguageStore } from "@/store/useLanguageStore"
import { useTrackedOutflowsStore } from "@/store/useTrackedOutflowsStore"
import { parseNum, formatInputVal, getTranslation, CURRENCY_SYMBOLS } from "@/lib/format"
import { useSettingsStore } from "@/store/useSettingsStore"
import { motion, AnimatePresence } from "framer-motion"

interface Props {
  open: boolean
  onClose: () => void
  itemId: string
  maxAmount: number
}

export function ModalBayar({ open, onClose, itemId, maxAmount }: Props) {
  const language = useLanguageStore((s) => s.language)
  const activeCurrency = useSettingsStore((s) => s.currency)
  const addRepayment = useTrackedOutflowsStore((s) => s.addRepayment)
  const t = (key: string) => getTranslation(language, key)

  const [amount, setAmount] = React.useState('')
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = React.useState('')

  const isId = language === 'id'

  React.useEffect(() => {
    if (open) {
      setAmount('')
      setDate(new Date().toISOString().slice(0, 10))
      setNote('')
    }
  }, [open])

  const parsed = parseNum(amount)
  const isValid = parsed > 0 && parsed <= maxAmount

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    addRepayment(itemId, parsed, date, note)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-border/60">
              <h2 className="text-sm font-bold text-foreground">{t('recordPayment')}</h2>
              <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-xl transition-colors cursor-pointer">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid gap-1.5">
                <label className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80">
                  {t('paymentAmount')}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-muted-foreground/60 font-semibold text-sm select-none">
                    {CURRENCY_SYMBOLS[activeCurrency] || 'Rp'}
                  </span>
                  <input
                    type="text" inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(formatInputVal(e.target.value))}
                    placeholder="0"
                    className="pl-8 pr-3 bg-muted/20 border-border/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 font-bold text-sm text-foreground tracking-wide h-10 rounded-lg w-full placeholder-muted-foreground/45"
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                  {isId ? `Maks: ${maxAmount.toLocaleString('id-ID')}` : `Max: ${maxAmount.toLocaleString('en-US')}`}
                </p>
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">{t('paymentDate')}</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">{t('paymentNote')}</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={isId ? 'Angsuran ke-1' : 'Installment 1'}
                  className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 bg-muted/40 hover:bg-muted/70 text-foreground border border-border/80 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95"
                >
                  {t('cancel')}
                </button>
                <button type="submit" disabled={!isValid}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                    isValid ? 'bg-primary text-primary-foreground hover:brightness-110' : 'bg-muted/40 text-muted-foreground/40 cursor-not-allowed'
                  }`}
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
