"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Wallet, Coins, Handshake } from "lucide-react"
import type { InvestmentAsset } from "@/store/usePortfolioStore"
import { useRouter } from "next/navigation"

interface Props {
  t: (k: string) => string
  mounted: boolean
  formatCurrency: (amount: number, lang: 'id' | 'en') => string
  language: 'id' | 'en'
  balance: number
  totalInvestment: number
  totalSavings: number
  totalReceivables: number
  netWorth: number
  assets: InvestmentAsset[]
  onOpenPortfolio: () => void
}

export function NetWorthSection({
  t, mounted, formatCurrency, language,
  balance, totalInvestment, totalSavings, totalReceivables, netWorth,
  assets, onOpenPortfolio,
}: Props) {
  const router = useRouter()
  return (
    <div className="grid gap-6 md:grid-cols-4">
      <Card className="md:col-span-2 bg-gradient-to-br from-primary/10 via-card to-card border-primary/20 shadow-sm relative overflow-hidden hover:shadow-md transition-all">
        <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
          <Wallet className="w-48 h-48 text-primary" />
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-primary/95 dark:text-rose-300 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-primary dark:text-rose-400" />
            {t('netWorth')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-extrabold text-foreground tracking-tight">
            {mounted ? formatCurrency(netWorth, language) : formatCurrency(0, language)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {language === 'id'
              ? "Saldo Tunai + Investasi + Tabungan + Piutang"
              : "Cash Balance + Investments + Savings + Receivables"}
          </p>
          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-border/40 text-xs flex-wrap">
            <div>
              <span className="text-muted-foreground block mb-0.5">{t('cashBalance')}</span>
              <span className="font-semibold text-foreground">{mounted ? formatCurrency(balance, language) : formatCurrency(0, language)}</span>
            </div>
            <div className="w-[1px] h-6 bg-border/60" />
            <div>
              <span className="text-muted-foreground block mb-0.5">{t('totalInvestment')}</span>
              <span className="font-semibold text-primary">{mounted ? formatCurrency(totalInvestment, language) : formatCurrency(0, language)}</span>
            </div>
            <div className="w-[1px] h-6 bg-border/60" />
            <button onClick={() => router.push('/planning')} className="cursor-pointer text-left group/save">
              <span className="text-muted-foreground block mb-0.5 group-hover/save:text-emerald-500 transition-colors">{language === 'id' ? 'Total Tabungan' : 'Total Savings'}</span>
              <span className="font-semibold text-green-500 group-hover/save:brightness-110 transition-all">{mounted ? formatCurrency(totalSavings, language) : formatCurrency(0, language)}</span>
            </button>
            <div className="w-[1px] h-6 bg-border/60" />
            <button onClick={() => router.push('/piutang')} className="cursor-pointer text-left group/piut">
              <span className="text-muted-foreground block mb-0.5 group-hover/piut:text-amber-500 transition-colors">{language === 'id' ? 'Piutang' : 'Receivables'}</span>
              <span className="font-semibold text-amber-500 dark:text-amber-400 group-hover/piut:brightness-110 transition-all">{mounted ? formatCurrency(totalReceivables, language) : formatCurrency(0, language)}</span>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card
        onClick={onOpenPortfolio}
        className="md:col-span-2 bg-card border-border hover:border-primary/45 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
      >
        <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
          <Coins className="w-48 h-48 text-primary" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
            <Coins className="h-4 w-4 text-primary" />
            {t('portfolioAsset')}
          </CardTitle>
          <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full transition-all group-hover:bg-primary group-hover:text-primary-foreground">
            {language === 'id' ? 'Kelola' : 'Manage'} &rarr;
          </span>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-extrabold text-foreground tracking-tight group-hover:text-primary transition-colors">
            {mounted ? formatCurrency(totalInvestment, language) : formatCurrency(0, language)}
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/40 text-xs">
            {(['stocks', 'crypto', 'other'] as const).map((type) => {
              const label = type === 'stocks' ? t('stocks') : type === 'crypto' ? t('crypto') : t('otherType')
              const value = assets
                .filter(a => a.type === type)
                .reduce((acc, a) => acc + (a.initialCapital + a.realizedGainLoss), 0)
              return (
                <div key={type}>
                  <span className="text-muted-foreground block text-[9px] uppercase font-semibold mb-0.5">{label}</span>
                  <span className="font-semibold text-foreground">
                    {mounted ? formatCurrency(value, language) : formatCurrency(0, language)}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
