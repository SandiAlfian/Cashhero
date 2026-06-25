"use client"

import { Button } from "@/components/ui/button"
import { Wallet, TrendingUp, Coins, ShieldAlert, History, Edit2, Trash2, Plus } from "lucide-react"
import { formatRelativeDate } from "@/lib/format"
import type { InvestmentAsset } from "@/store/usePortfolioStore"

interface Props {
  t: (k: string) => string
  formatCurrency: (amount: number, lang: 'id' | 'en') => string
  language: 'id' | 'en'
  assets: InvestmentAsset[]
  onStartAdd: () => void
  onStartEdit: (asset: InvestmentAsset) => void
  onDelete: (asset: InvestmentAsset) => void
  onStartPartialLiquidation: (asset: InvestmentAsset) => void
  onShowHistory: (asset: InvestmentAsset) => void
  checkAssetNeedsUpdate: (asset: InvestmentAsset) => boolean
  onClose: () => void
}

export function AssetListView({
  t, formatCurrency, language, assets,
  onStartAdd, onStartEdit, onDelete,
  onStartPartialLiquidation, onShowHistory,
  checkAssetNeedsUpdate, onClose,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center pb-2 border-b border-border/60">
        <h3 className="text-sm font-bold text-foreground">
          {language === 'id' ? 'Daftar Aset Investasi' : 'Investment Assets List'}
        </h3>
        <button
          onClick={onStartAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('addAsset')}</span>
        </button>
      </div>

      <div className="max-h-[350px] overflow-y-auto pr-1 space-y-3">
        {assets.length > 0 ? (
          assets.map((asset) => {
            const netVal = asset.initialCapital + asset.realizedGainLoss
            const isProfit = asset.realizedGainLoss >= 0
            const needsUpdate = checkAssetNeedsUpdate(asset)

            let IconComponent = Wallet
            if (asset.type === 'stocks') IconComponent = TrendingUp
            if (asset.type === 'crypto') IconComponent = Coins

            return (
              <div
                key={asset.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col gap-2.5 ${
                  needsUpdate
                    ? 'border-primary/40 bg-primary/5 hover:border-primary/60'
                    : 'border-border/80 bg-muted/10 hover:border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${
                      asset.type === 'stocks'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : asset.type === 'crypto'
                          ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                          : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                    }`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-2 flex-wrap">
                        {asset.name}
                        <span className="text-[9px] font-semibold text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded border border-border/40">
                          {asset.type === 'stocks' ? t('stocks') : asset.type === 'crypto' ? t('crypto') : t('otherType')}
                        </span>
                      </h4>
                      <span className="text-[10px] text-muted-foreground">
                        {t('lastUpdated')}: {formatRelativeDate(asset.lastUpdated, language)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onShowHistory(asset)}
                      className="p-1.5 hover:bg-primary/10 rounded-lg text-primary/70 hover:text-primary transition-colors cursor-pointer"
                      title={language === 'id' ? 'Riwayat Penyesuaian' : 'Adjustment History'}
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onStartPartialLiquidation(asset)}
                      className="p-1.5 hover:bg-green-500/10 rounded-lg text-green-600 dark:text-green-400 hover:text-green-700 transition-colors cursor-pointer"
                      title={language === 'id' ? 'Likuidasi Sebagian' : 'Partial Liquidation'}
                    >
                      <Coins className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onStartEdit(asset)}
                      className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title={t('editAsset')}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(asset)}
                      className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                      title={t('deleteAssetConfirm')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-muted/30 p-2 rounded-lg text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase font-semibold mb-0.5">{t('initialCapital')}</span>
                    <span className="font-semibold text-foreground">{formatCurrency(asset.initialCapital, language)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase font-semibold mb-0.5">{t('realizedGainLoss')}</span>
                    <span className={`font-semibold ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                      {isProfit ? '+' : ''}{formatCurrency(asset.realizedGainLoss, language)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase font-semibold mb-0.5">{t('netInvestmentValue')}</span>
                    <span className="font-bold text-foreground">{formatCurrency(netVal, language)}</span>
                  </div>
                </div>

                {needsUpdate && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg self-start">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{t('weeklyRecommended')}</span>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="py-8 text-center flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-xl">
            <Wallet className="w-8 h-8 text-muted-foreground/40 animate-pulse" />
            <p className="text-muted-foreground text-xs font-semibold">{t('noAssets')}</p>
          </div>
        )}
      </div>

      <div className="flex justify-end mt-4">
        <Button
          onClick={onClose}
          className="bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer shadow-md text-xs font-semibold rounded-lg px-5 py-2"
        >
          {language === 'id' ? 'Selesai' : 'Done'}
        </Button>
      </div>
    </div>
  )
}
