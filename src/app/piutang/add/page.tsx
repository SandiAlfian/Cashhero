"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Plus, Tag } from "lucide-react"
import { useLanguageStore } from "@/store/useLanguageStore"
import { useTrackedOutflowsStore, JENIS_OPTIONS } from "@/store/useTrackedOutflowsStore"
import { parseNum, formatInputVal, getTranslation, CURRENCY_SYMBOLS } from "@/lib/format"
import { useSettingsStore } from "@/store/useSettingsStore"
import { JENIS_INFO, CUSTOM_KEY } from "@/lib/piutang"
import Link from "next/link"

export default function AddPiutangPage() {
  const router = useRouter()
  const language = useLanguageStore((s) => s.language)
  const activeCurrency = useSettingsStore((s) => s.currency)
  const addItem = useTrackedOutflowsStore((s) => s.addItem)
  const t = (key: string) => getTranslation(language, key)

  const isId = language === 'id'

  const [jenis, setJenis] = React.useState('piutang')
  const [customJenis, setCustomJenis] = React.useState('')
  const [personName, setPersonName] = React.useState('')
  const [amount, setAmount] = React.useState('')
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = React.useState('')
  const [note, setNote] = React.useState('')

  const finalJenis = jenis === CUSTOM_KEY ? customJenis.trim() : jenis
  const parsed = parseNum(amount)
  const isValid = finalJenis.length > 0 && personName.trim().length > 0 && parsed > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    addItem({
      jenis: finalJenis,
      personName: personName.trim(),
      amount: parsed,
      date,
      dueDate,
      note: note.trim(),
    })
    router.push('/piutang')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="max-w-lg mx-auto"
    >
      {/* Back */}
      <Link href="/piutang"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('piutang')}
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-sm">
          <Plus className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{t('addNewOutflow')}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isId ? 'Lengkapi detail transaksi non-pengeluaran baru' : 'Complete the new non-expense transaction details'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Jenis Picker */}
        <div>
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">{t('outflowJenis')}</label>
          <div className="grid grid-cols-2 gap-2">
            {[...JENIS_OPTIONS, CUSTOM_KEY].map((key) => {
              const isActive = jenis === key
              const info = key !== CUSTOM_KEY ? JENIS_INFO[key] : null
              const Icon = key === CUSTOM_KEY ? Tag : (info?.icon || Tag)
              const label = key === CUSTOM_KEY
                ? (isId ? 'Lainnya' : 'Other')
                : (isId
                    ? { piutang: 'Piutang', deposit: 'Deposit', kasbon: 'Kasbon', temporary: 'Sementara' }[key] || key
                    : { piutang: 'Receivable', deposit: 'Deposit', kasbon: 'Advance', temporary: 'Temporary' }[key] || key)
              return (
                <button key={key} type="button" onClick={() => setJenis(key)}
                  className={`flex flex-col items-start gap-0.5 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-primary/5 border-primary text-foreground'
                      : 'bg-card border-border/60 text-muted-foreground hover:border-border hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-bold">{label}</span>
                  {info && <span className="text-[9px] text-muted-foreground/60 leading-tight">{isId ? info.desc_id : info.desc_en}</span>}
                </button>
              )
            })}
          </div>
          {jenis === CUSTOM_KEY && (
            <input
              type="text"
              value={customJenis}
              onChange={(e) => setCustomJenis(e.target.value)}
              placeholder={isId ? 'Ketik jenis baru...' : 'Type new type...'}
              className="w-full mt-2 px-3 py-2.5 bg-muted/30 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              autoFocus
            />
          )}
        </div>

        {/* Person Name */}
        <div>
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">{t('outflowPerson')}</label>
          <input
            type="text"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            placeholder={isId ? 'Nama orang atau entitas' : 'Person or entity name'}
            className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>

        {/* Amount */}
        <div className="grid gap-1.5">
          <label className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80">{t('outflowAmount')}</label>
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
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">{t('outflowDate')}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">{t('outflowDueDate')}</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">{t('outflowNote')}</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={isId ? 'Catatan tambahan' : 'Additional notes'}
            className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Link href="/piutang"
            className="flex-1 py-2.5 bg-muted/40 hover:bg-muted/70 text-foreground border border-border/80 rounded-xl text-xs font-bold text-center transition-all duration-200 active:scale-95"
          >
            {t('cancel')}
          </Link>
          <button type="submit" disabled={!isValid}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer ${
              isValid ? 'bg-primary text-primary-foreground hover:brightness-110' : 'bg-muted/40 text-muted-foreground/40 cursor-not-allowed'
            }`}
          >
            {t('save')}
          </button>
        </div>
      </form>
    </motion.div>
  )
}
