"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Plus, Handshake, Tag, ChevronRight } from "lucide-react"
import { useLanguageStore } from "@/store/useLanguageStore"
import { useTrackedOutflowsStore, JENIS_OPTIONS } from "@/store/useTrackedOutflowsStore"
import { formatCurrency, getTranslation } from "@/lib/format"
import { JENIS_ICONS } from "@/lib/piutang"
import { TrackedCard } from "@/components/piutang/TrackedCard"
import { MigrationSection } from "@/components/piutang/MigrationSection"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export default function PiutangPage() {
  const language = useLanguageStore((s) => s.language)
  const items = useTrackedOutflowsStore((s) => s.items)
  const getActiveByJenis = useTrackedOutflowsStore((s) => s.getActiveByJenis)
  const t = (key: string) => getTranslation(language, key)

  // Collect all unique jenis from data + predefined
  const allJenis = React.useMemo(() => {
    const fromData = new Set(items.map((i) => i.jenis))
    return [...new Set([...JENIS_OPTIONS, ...fromData])]
  }, [items])

  const [activeTab, setActiveTab] = React.useState<string>('all')
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => { setMounted(true) }, [])

  const filtered = activeTab === 'all' ? items : items.filter((i) => i.jenis === activeTab)
  const activeItems = filtered.filter((i) => i.status === 'active')
  const settledItems = filtered.filter((i) => i.status === 'settled')
  const activeByJenis = getActiveByJenis()
  const totalOutstanding = useTrackedOutflowsStore((s) => s.getActiveTotal())

  const jenisLabels: Record<string, string> = {
    piutang: t('piutangOf'),
    deposit: t('depositOf'),
    kasbon: t('kasbonOf'),
    temporary: t('temporaryOf'),
  }

  if (!mounted) {
    return <div className="flex flex-col gap-4 p-4 animate-pulse"><div className="h-24 bg-muted/20 rounded-2xl" /><div className="h-64 bg-muted/20 rounded-2xl" /></div>
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="flex flex-col gap-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-sm">
            <Handshake className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{t('piutang')}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{t('piutangSubtitle')}</p>
          </div>
        </div>
        <Link href="/piutang/add"
          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:brightness-110 transition-all duration-200 active:scale-95 shadow-sm self-start md:self-center"
        >
          <Plus className="w-4 h-4" />
          {t('addNewOutflow')}
        </Link>
      </div>

      {/* Summary Card */}
      <Link href="/piutang/add">
        <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer group">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('totalOutstanding')}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/60 group-hover:translate-x-0.5 transition-all duration-200" />
            </div>
            <div className="text-2xl font-extrabold text-card-foreground font-number">
              {formatCurrency(totalOutstanding, language as 'id' | 'en')}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {allJenis.map((jenis) => {
                const Icon = JENIS_ICONS[jenis] || Tag
                const total = activeByJenis[jenis] || 0
                if (total <= 0 && items.filter((i) => i.jenis === jenis).length === 0) return null
                return (
                  <span key={jenis}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                      activeTab === jenis ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground hover:bg-muted/70'
                    }`}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setActiveTab(jenis)
                    }}
                  >
                    <Icon className="w-3 h-3" />
                    {jenisLabels[jenis] || jenis}: {formatCurrency(total, language as 'id' | 'en')}
                  </span>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Tab Filter */}
      <div className="flex items-center gap-1 bg-card border border-border p-1 rounded-xl shadow-sm w-fit overflow-x-auto scrollbar-none">
        <button onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
            activeTab === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('allJenis')}
        </button>
        {allJenis.map((jenis) => {
          const count = items.filter((i) => i.jenis === jenis).length
          if (count === 0) return null
          const Icon = JENIS_ICONS[jenis] || Tag
          return (
            <button key={jenis} onClick={() => setActiveTab(jenis)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                activeTab === jenis ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {jenisLabels[jenis] || jenis}
              <span className="text-[9px] opacity-60">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Active Items */}
      {activeItems.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            {t('active')} ({activeItems.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeItems.map((item) => (
              <TrackedCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Settled Items */}
      {settledItems.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            {t('settled')} ({settledItems.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {settledItems.map((item) => (
              <TrackedCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-4">
          <Handshake className="w-12 h-12 opacity-20" />
          <p className="text-sm font-medium">{t('noOutflows')}</p>
        </div>
      )}

      {/* Migration from old transactions */}
      <MigrationSection />
    </motion.div>
  )
}
