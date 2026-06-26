"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Plus, Wallet, Pencil, Trash2, CheckCircle2 } from "lucide-react"
import { useLanguageStore } from "@/store/useLanguageStore"
import { useTrackedOutflowsStore } from "@/store/useTrackedOutflowsStore"
import { useTransactionStore } from "@/store/useTransactionStore"
import { formatCurrency, getTranslation } from "@/lib/format"
import { PiutangInfoCard } from "@/components/piutang/PiutangInfoCard"
import { ModalBayar } from "@/components/piutang/ModalBayar"
import { RepaymentEditForm } from "@/components/piutang/RepaymentEditForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PiutangDetailPage() {
  const params = useParams()
  const router = useRouter()
  const language = useLanguageStore((s) => s.language)
  const items = useTrackedOutflowsStore((s) => s.items)
  const removeItem = useTrackedOutflowsStore((s) => s.removeItem)
  const removeRepayment = useTrackedOutflowsStore((s) => s.removeRepayment)
  const updateRepaymentStore = useTrackedOutflowsStore((s) => s.updateRepayment)
  const settleItem = useTrackedOutflowsStore((s) => s.settleItem)
  const addTransaction = useTransactionStore((s) => s.addTransaction)
  const t = (key: string) => getTranslation(language, key)
  const isId = language === "id"

  const item = React.useMemo(() => items.find((i) => i.id === params.id), [items, params.id])

  const [isEditing, setIsEditing] = React.useState(false)
  const [showPaymentModal, setShowPaymentModal] = React.useState(false)
  const [showSettleConfirm, setShowSettleConfirm] = React.useState(false)
  const [editingRepaymentId, setEditingRepaymentId] = React.useState<string | null>(null)

  if (!item) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
        <Wallet className="w-12 h-12 opacity-20" />
        <p className="text-sm font-medium">{isId ? "Item tidak ditemukan" : "Item not found"}</p>
      </motion.div>
    )
  }

  const handleDelete = () => {
    removeItem(item.id)
    router.push("/piutang")
  }

  const handleSettleConfirm = () => {
    if (item && item.remainingAmount > 0) {
      addTransaction({
        type: 'in',
        category: 'Piutang',
        amount: item.remainingAmount,
        note: `${isId ? 'Pelunasan' : 'Settlement'} — ${item.personName}`,
        date: new Date().toISOString().slice(0, 10),
      })
    }
    settleItem(item.id)
    setShowSettleConfirm(false)
  }

  const handleEditRepayment = (repaymentId: string) => {
    setEditingRepaymentId(repaymentId === editingRepaymentId ? null : repaymentId)
  }

  const handleSaveRepayment = (repaymentId: string, updates: { amount?: number; date?: string; note?: string }) => {
    updateRepaymentStore(item.id, repaymentId, updates)
    setEditingRepaymentId(null)
  }

  const handleDeleteRepayment = (repaymentId: string) => {
    removeRepayment(item.id, repaymentId)
    setEditingRepaymentId(null)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto"
    >
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => router.push("/piutang")}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("piutang")}
        </button>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsEditing(!isEditing)}
            className="p-2 hover:bg-muted/60 rounded-xl transition-all cursor-pointer"
            title={isId ? "Edit" : "Edit"}
          >
            <Pencil className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={handleDelete}
            className="p-2 hover:bg-destructive/10 rounded-xl transition-all cursor-pointer"
            title={isId ? "Hapus" : "Delete"}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </button>
        </div>
      </div>

      <PiutangInfoCard
        item={item}
        isEditing={isEditing}
        onSaved={() => setIsEditing(false)}
        onSettleConfirm={() => setShowSettleConfirm(true)}
      />

      {showSettleConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSettleConfirm(false) }}
        >
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-background border border-border rounded-2xl shadow-2xl p-6 max-w-sm w-full"
          >
            <h3 className="text-sm font-bold text-foreground mb-2">{isId ? "Konfirmasi Pelunasan" : "Confirm Settlement"}</h3>
            <p className="text-xs text-muted-foreground mb-4">
              {isId
                ? `Tandai "${item.personName}" sebagai lunas? Sisa: ${formatCurrency(item.remainingAmount, language as "id" | "en")}`
                : `Mark "${item.personName}" as fully paid? Remaining: ${formatCurrency(item.remainingAmount, language as "id" | "en")}`}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowSettleConfirm(false)}
                className="flex-1 py-2 bg-muted/40 hover:bg-muted/70 text-foreground border border-border/80 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {t("cancel")}
              </button>
              <button onClick={handleSettleConfirm}
                className="flex-1 py-2 bg-green-500 text-white rounded-xl text-xs font-bold hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isId ? "Lunas" : "Paid"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <Card className="bg-card border-border shadow-sm mb-4">
        <CardHeader className="pb-3 border-b border-border/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              {t("paymentHistory") || (isId ? "Riwayat Pembayaran" : "Payment History")}
            </CardTitle>
            {item.status === "active" && (
              <button onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-[10px] font-bold hover:brightness-110 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("recordPayment") || (isId ? "Catat Bayar" : "Record Payment")}
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {item.repayments.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 text-center py-6">
              {isId ? "Belum ada pembayaran tercatat" : "No payments recorded yet"}
            </p>
          ) : (
            <div className="space-y-1">
              {item.repayments.map((r) => (
                <div key={r.id}>
                  {editingRepaymentId === r.id ? (
                    <RepaymentEditForm
                      repayment={r}
                      onSave={(updates) => handleSaveRepayment(r.id, updates)}
                      onDelete={() => handleDeleteRepayment(r.id)}
                      onCancel={() => setEditingRepaymentId(null)}
                    />
                  ) : (
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/20 transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground">
                            {formatCurrency(r.amount, language as "id" | "en")}
                          </p>
                          {r.note && <p className="text-[9px] text-muted-foreground/60 truncate">{r.note}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-muted-foreground/60">
                          {new Date(r.date).toLocaleDateString(isId ? "id-ID" : "en-US", { day: "numeric", month: "short" })}
                        </span>
                        <button onClick={() => handleEditRepayment(r.id)}
                          className="p-1 hover:bg-muted rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        >
                          <Pencil className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {item.repayments.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border/20 flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-semibold">
                {isId ? "Total Dibayar" : "Total Paid"}
              </span>
              <span className="font-bold text-foreground font-number">
                {formatCurrency(item.amount - item.remainingAmount, language as "id" | "en")}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {item.status === "active" && (
        <button onClick={() => setShowSettleConfirm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/20 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer mb-6"
        >
          <CheckCircle2 className="w-4 h-4" />
          {isId ? "Tandai Lunas" : "Mark as Fully Paid"}
        </button>
      )}

      <ModalBayar
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        itemId={item.id}
        maxAmount={item.remainingAmount}
      />
    </motion.div>
  )
}
