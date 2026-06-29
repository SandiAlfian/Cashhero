"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Button } from "@/components/ui/button"
import { useTransactionStore } from "@/store/useTransactionStore"
import { usePlanningStore } from "@/store/usePlanningStore"
import { useLanguageStore } from "@/store/useLanguageStore"
import { formatCurrency } from "@/lib/format"
import { motion, AnimatePresence } from "framer-motion"
import { Tag, Wallet, FileText, Layers } from "lucide-react"
import type { Transaction } from "@/store/useTransactionStore"

interface EditTransactionDialogProps {
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onToast: (msg: string) => void
  onSaved?: (id: string) => void
}

export function EditTransactionDialog({ transaction, open, onOpenChange, onToast, onSaved }: EditTransactionDialogProps) {
  const updateTransaction = useTransactionStore((state) => state.updateTransaction)
  const renameCategory = useTransactionStore((state) => state.renameCategory)
  const transactions = useTransactionStore((state) => state.transactions)
  const budgets = usePlanningStore((state) => state.budgets)
  const { language } = useLanguageStore()

  const [category, setCategory] = React.useState('')
  const [amount, setAmount] = React.useState('')
  const [displayAmount, setDisplayAmount] = React.useState('')
  const [note, setNote] = React.useState('')
  const [isFocused, setIsFocused] = React.useState(false)
  const [renameAll, setRenameAll] = React.useState(false)

  React.useEffect(() => {
    if (transaction) {
      setCategory(transaction.category)
      setAmount(String(transaction.amount))
      setDisplayAmount(new Intl.NumberFormat("id-ID").format(transaction.amount))
      setNote(transaction.note)
      setRenameAll(false)
    }
  }, [transaction])

  const filteredCategories = React.useMemo(() => {
    const query = category.trim().toLowerCase()
    if (query.length < 1) return []

    const budgetCats = budgets
      .map((b) => b.category.trim())
      .filter((cat) => cat && cat.toLowerCase().includes(query))

    const historyCats = transactions
      .map((t) => t.category.trim())
      .filter((cat) => cat && cat.toLowerCase() !== "saldo awal" && cat.toLowerCase().includes(query))

    const combinedMap = new Map<string, 'budget' | 'history'>()
    historyCats.forEach((cat) => combinedMap.set(cat, 'history'))
    budgetCats.forEach((cat) => combinedMap.set(cat, 'budget'))

    return Array.from(combinedMap.entries()).map(([name, source]) => ({ name, source })).slice(0, 5)
  }, [transactions, budgets, category])

  const oldCategory = transaction?.category || ''
  const categoryChanged = category.trim() !== oldCategory
  const hasOtherWithOldCat = categoryChanged && oldCategory && transactions.some((t) => t.id !== transaction?.id && t.category === oldCategory)

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "")
    setAmount(rawVal)
    if (rawVal === "") {
      setDisplayAmount("")
      return
    }
    setDisplayAmount(new Intl.NumberFormat("id-ID").format(Number(rawVal)))
  }

  const handleSave = () => {
    if (!transaction) return
    const trimmedCat = category.trim()
    if (!trimmedCat || !amount) return

    updateTransaction(transaction.id, {
      category: trimmedCat,
      amount: Number(amount),
      note: note.trim(),
    })

    if (renameAll && categoryChanged && oldCategory) {
      renameCategory(oldCategory, trimmedCat)
    }

    onOpenChange(false)
    onSaved?.(transaction.id)
    onToast(
      language === 'id'
        ? 'Transaksi berhasil diperbarui!'
        : 'Transaction updated successfully!'
    )
  }

  if (!transaction) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border border-border/40 shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-border/10">
          <DialogHeader className="p-0">
            <DialogTitle className="text-lg font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
              <span className="p-1.5 rounded-xl bg-primary/10 border border-primary/15 text-primary shadow-sm">
                <FileText className="w-[18px] h-[18px]" />
              </span>
              {language === 'id' ? 'Edit Transaksi' : 'Edit Transaction'}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground/70 mt-1">
              {language === 'id' ? 'Ubah detail transaksi yang sudah tercatat.' : 'Modify details of the recorded transaction.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid gap-1.5 relative">
            <label className="font-semibold text-[11px] uppercase tracking-[0.08em] text-muted-foreground/70 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              {language === 'id' ? 'Kategori' : 'Category'}
            </label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              placeholder={language === 'id' ? 'Makanan, Transport, dll' : 'Food, Transport, etc.'}
              className="bg-muted/25 border-border/40 text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-primary/25 h-11 rounded-xl text-[14px] w-full"
            />
            <AnimatePresence>
              {isFocused && category.trim().length >= 1 && filteredCategories.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.12, ease: "easeOut" }}
                  className="absolute z-50 left-0 right-0 top-full mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-border/40 bg-background/98 shadow-lg backdrop-blur-md overflow-hidden flex flex-col py-1"
                >
                  {filteredCategories.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setCategory(item.name)
                        setIsFocused(false)
                      }}
                      className="w-full text-left px-4 py-2.5 text-[14px] hover:bg-primary/8 hover:text-primary transition-colors cursor-pointer font-medium text-foreground/90 flex items-center justify-between group"
                    >
                      <span className="group-hover:translate-x-0.5 transition-transform duration-150">{item.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border uppercase tracking-wider font-semibold transition-colors duration-150 ${
                        item.source === 'budget'
                          ? 'text-primary/80 bg-primary/8 border-primary/15 group-hover:bg-primary/15'
                          : 'text-muted-foreground/60 bg-muted/30 border-border/40 group-hover:bg-primary/10 group-hover:text-primary/70'
                      }`}>
                        {item.source === 'budget'
                          ? (language === 'id' ? 'Anggaran' : 'Budget')
                          : (language === 'id' ? 'Riwayat' : 'History')}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid gap-1.5">
            <label className="font-semibold text-[11px] uppercase tracking-[0.08em] text-muted-foreground/70 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" />
              {language === 'id' ? 'Jumlah' : 'Amount'}
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-muted-foreground/40 font-semibold text-base select-none tracking-tight">Rp</span>
              <CurrencyInput
                placeholder="0"
                value={displayAmount}
                onChange={handleAmountChange}
                className="pl-11 pr-4 bg-muted/25 border-border/40 focus-visible:ring-primary/25 font-bold text-lg text-foreground tracking-tight h-11 rounded-xl w-full"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <label className="font-semibold text-[11px] uppercase tracking-[0.08em] text-muted-foreground/70 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              {language === 'id' ? 'Catatan' : 'Note'}
            </label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={language === 'id' ? 'Deskripsi transaksi...' : 'Transaction description...'}
              className="bg-muted/25 border-border/40 text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-primary/25 h-11 rounded-xl text-[14px] w-full"
            />
          </div>

          {hasOtherWithOldCat && (
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/8 border border-amber-500/20 cursor-pointer select-none group hover:bg-amber-500/12 transition-colors">
              <input
                type="checkbox"
                checked={renameAll}
                onChange={(e) => setRenameAll(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-400/30 cursor-pointer"
              />
              <div className="flex items-start gap-2">
                <Layers className="w-4 h-4 text-amber-500/70 mt-0.5 shrink-0" />
                <span className="text-[13px] font-medium text-muted-foreground leading-relaxed">
                  {language === 'id'
                    ? `Perbarui semua transaksi "${oldCategory}" menjadi "${category.trim()}"`
                    : `Update all "${oldCategory}" transactions to "${category.trim()}"`}
                </span>
              </div>
            </label>
          )}
        </div>

        <div className="px-6 py-4 bg-muted/10 border-t border-border/10 flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground/70 hover:text-foreground text-[13px] font-bold h-10 px-5 rounded-xl hover:bg-muted/50 transition-all"
          >
            {language === 'id' ? 'Batal' : 'Cancel'}
          </Button>
          <Button
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-bold h-10 px-6 rounded-xl shadow-sm transition-all"
          >
            {language === 'id' ? 'Simpan Perubahan' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
