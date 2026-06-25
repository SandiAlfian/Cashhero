"use client"

import { Handshake, Landmark, Receipt, Clock, Tag } from "lucide-react"

const JENIS_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  piutang:  { icon: Handshake, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' },
  deposit:  { icon: Landmark,  color: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-500/10' },
  kasbon:   { icon: Receipt,   color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
  temporary:{ icon: Clock,     color: 'text-cyan-600 dark:text-cyan-400',     bg: 'bg-cyan-500/10' },
}

export function JenisBadge({ jenis, language }: { jenis: string; language: string }) {
  const cfg = JENIS_CONFIG[jenis]
  const Icon = cfg?.icon || Tag
  const color = cfg?.color || 'text-muted-foreground'
  const bg = cfg?.bg || 'bg-muted/40'

  const isId = language === 'id'
  const label: Record<string, string> = {
    piutang: isId ? 'Piutang' : 'Receivable',
    deposit: isId ? 'Deposit' : 'Deposit',
    kasbon: isId ? 'Kasbon' : 'Advance',
    temporary: isId ? 'Sementara' : 'Temporary',
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${bg} ${color}`}>
      <Icon className="w-3 h-3" />
      {label[jenis] || jenis}
    </span>
  )
}
