"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Coins } from "lucide-react"
import { CURRENCY_SYMBOLS } from "@/lib/statistics"
import type { InvestmentAsset } from "@/store/usePortfolioStore"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  t: (k: string) => string
  formatCurrency: (amount: number, lang: 'id' | 'en') => string
  formatInputVal: (val: string) => string
  parseNum: (str: string) => number
  language: 'id' | 'en'
  activeCurrency: string
  liqAsset: InvestmentAsset | null
  partialLiqAmountInput: string
  onAmountChange: (val: string) => void
  onExecute: () => void
  onClose: () => void
}

export function PartialLiquidationDialog({
  open, onOpenChange, t, formatCurrency, formatInputVal, parseNum,
  language, activeCurrency,
  liqAsset, partialLiqAmountInput, onAmountChange, onExecute, onClose,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-background/95 border-border text-foreground backdrop-blur-xl p-6 shadow-2xl rounded-xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-foreground text-lg font-bold tracking-tight flex items-center gap-2">
            <Coins className="w-5 h-5 text-green-600 dark:text-green-400" />
            {language === 'id' ? 'Likuidasi Sebagian Aset' : 'Partial Asset Liquidation'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {language === 'id'
              ? "Tarik sebagian modal investasi Anda kembali ke Saldo Tunai aktif."
              : "Withdraw a portion of your investment capital back to your active Cash Balance."}
          </DialogDescription>
        </DialogHeader>

        {liqAsset && (
          <div className="flex flex-col gap-4">
            <div className="p-3.5 bg-muted/30 rounded-xl border border-border/40 text-xs flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === 'id' ? 'Nama Aset:' : 'Asset Name:'}</span>
                <span className="font-bold text-foreground">{liqAsset.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === 'id' ? 'Nilai Bersih Saat Ini:' : 'Current Net Value:'}</span>
                <span className="font-bold text-foreground">
                  {formatCurrency(liqAsset.initialCapital + liqAsset.realizedGainLoss, language)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {language === 'id' ? 'Nominal Likuidasi' : 'Liquidation Amount'} ({CURRENCY_SYMBOLS[activeCurrency] || 'Rp'})
              </label>
              <CurrencyInput
                placeholder="0"
                value={partialLiqAmountInput}
                onChange={(e) => onAmountChange(formatInputVal(e.target.value))}
                className="bg-muted/40 border-border text-foreground text-sm py-2 px-3 rounded-lg focus:ring-primary font-number"
              />
              {parseNum(partialLiqAmountInput) > (liqAsset.initialCapital + liqAsset.realizedGainLoss) && (
                <span className="text-[10px] font-bold text-destructive">
                  {language === 'id'
                    ? "Nominal melebihi nilai bersih aset saat ini!"
                    : "Amount exceeds current net value of this asset!"}
                </span>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-2 border-t border-border/40">
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors text-xs font-semibold rounded-lg px-4 py-2"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={onExecute}
                disabled={
                  parseNum(partialLiqAmountInput) <= 0 ||
                  parseNum(partialLiqAmountInput) > (liqAsset.initialCapital + liqAsset.realizedGainLoss)
                }
                className="bg-green-600 text-white hover:bg-green-700 cursor-pointer shadow-md text-xs font-semibold rounded-lg px-5 py-2 disabled:opacity-55 disabled:cursor-not-allowed"
              >
                {language === 'id' ? 'Likuidasi' : 'Liquidate'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
