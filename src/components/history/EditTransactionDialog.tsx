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
import { Check } from "lucide-react"
import type { Transaction } from "@/store/useTransactionStore"

interface EditTransactionDialogProps {
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onToast: (msg: string) => void
}

export function EditTransactionDialog({ transaction, open, onOpenChange, onToast }: EditTransactionDialogProps) {
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
    onToast(
      language === 'id'
        ? 'Transaksi berhasil diperbarui!'
        : 'Transaction updated successfully!'
    )
  }

  if (!transaction) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border border-border/50 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
            {language === 'id' ? 'Edit Transaksi' : 'Edit Transaction'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {language === 'id' ? 'Ubah detail transaksi yang sudah tercatat.' : 'Modify details of the recorded transaction.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5 relative">
            <label className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80">
              {language === 'id' ? 'Kategori' : 'Category'}
            </label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              placeholder={language === 'id' ? 'Makanan, Transport, dll' : 'Food, Transport, etc.'}
              className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary h-11 rounded-lg text-sm w-full"
            />
            <AnimatePresence>
              {isFocused && category.trim().length >= 1 && filteredCategories.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute z-50 left-0 right-0 top-full mt-1.5 max-h-52 overflow-y-auto rounded-lg border border-border bg-background/98 shadow-xl backdrop-blur-md overflow-hidden flex flex-col py-1"
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
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer font-medium text-foreground flex items-center justify-between group"
                    >
                      <span className="group-hover:translate-x-0.5 transition-transform duration-150">{item.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border border-border/50 uppercase tracking-wider font-semibold transition-colors duration-150 ${
                        item.source === 'budget'
                          ? 'text-primary bg-primary/10 border-primary/20 group-hover:bg-primary/20 group-hover:text-primary'
                          : 'text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'
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
            <label className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80">
              {language === 'id' ? 'Jumlah' : 'Amount'}
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-muted-foreground/60 font-semibold text-base select-none">Rp</span>
              <CurrencyInput
                placeholder="0"
                value={displayAmount}
                onChange={handleAmountChange}
                className="pl-11 pr-4 bg-muted/30 border-border focus-visible:ring-primary font-bold text-lg text-foreground tracking-wide h-11 rounded-lg w-full"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <label className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80">
              {language === 'id' ? 'Catatan' : 'Note'}
            </label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={language === 'id' ? 'Deskripsi transaksi...' : 'Transaction description...'}
              className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary h-11 rounded-lg text-sm w-full"
            />
          </div>

          {hasOtherWithOldCat && (
            <label className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/40 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={renameAll}
                onChange={(e) => setRenameAll(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
              <span className="text-xs font-medium text-muted-foreground leading-relaxed">
                {language === 'id'
                  ? `Juga perbarui semua transaksi dengan kategori "${oldCategory}" menjadi "${category.trim()}"`
                  : `Also update all transactions with category "${oldCategory}" to "${category.trim()}"`}
              </span>
            </label>
          )}
        </div>

        <div className="flex items-center gap-3 justify-end pt-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground text-sm font-bold h-10 px-4 rounded-lg"
          >
            {language === 'id' ? 'Batal' : 'Cancel'}
          </Button>
          <Button
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold h-10 px-5 rounded-lg shadow-sm"
          >
            {language === 'id' ? 'Simpan' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
