"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"
import type { InvestmentAsset } from "@/store/usePortfolioStore"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  t: (k: string) => string
  formatCurrency: (amount: number, lang: 'id' | 'en') => string
  language: 'id' | 'en'
  assetToDelete: InvestmentAsset | null
  onExecuteDelete: (liquidate: boolean) => void
  onCancel: () => void
}

export function DeleteConfirmDialog({
  open, onOpenChange, t, formatCurrency, language,
  assetToDelete, onExecuteDelete, onCancel,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto scrollbar-none bg-background/95 border-border text-foreground backdrop-blur-xl p-6 shadow-2xl rounded-xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-foreground text-lg font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary animate-pulse" />
            {t('liquidateConfirm')}
          </DialogTitle>
        </DialogHeader>

        {assetToDelete && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              {t('liquidateDesc').replace('[nilai]', formatCurrency(assetToDelete.initialCapital + assetToDelete.realizedGainLoss, language))}
            </p>

            <div className="flex flex-col gap-2.5 mt-2">
              {(assetToDelete.initialCapital + assetToDelete.realizedGainLoss) > 0 && (
                <button
                  onClick={() => onExecuteDelete(true)}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-green-500/30 bg-green-500/5 hover:bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold transition-all cursor-pointer shadow-sm text-left"
                >
                  <div>
                    <span className="block text-sm font-extrabold">{t('liquidateOption')}</span>
                    <span className="text-[10px] text-muted-foreground font-semibold mt-0.5 block">
                      {language === 'id'
                        ? `Saldo Tunai akan bertambah +${formatCurrency(assetToDelete.initialCapital + assetToDelete.realizedGainLoss, language)}`
                        : `Cash Balance will increase by +${formatCurrency(assetToDelete.initialCapital + assetToDelete.realizedGainLoss, language)}`}
                    </span>
                  </div>
                  <span>&rarr;</span>
                </button>
              )}

              <button
                onClick={() => onExecuteDelete(false)}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/10 hover:bg-muted/20 text-foreground text-xs font-bold transition-all cursor-pointer text-left"
              >
                <div>
                  <span className="block text-sm font-extrabold">{t('deleteOnlyOption')}</span>
                  <span className="text-[10px] text-muted-foreground font-semibold mt-0.5 block">
                    {language === 'id'
                      ? "Hapus aset dan HAPUS semua riwayat transaksi terkait agar saldo kembali semula"
                      : "Remove asset and DELETE all related transaction history to restore your balance"}
                  </span>
                </div>
                <span>&rarr;</span>
              </button>
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-2 border-t border-border/40">
              <Button
                variant="ghost"
                onClick={onCancel}
                className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors text-xs font-semibold rounded-lg px-4 py-2"
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
