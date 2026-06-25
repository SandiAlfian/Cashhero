"use client"

import * as React from "react"

export function RatesStaleness({ lastUpdate, language }: { lastUpdate: string; language: string }) {
  const [now, setNow] = React.useState(Date.now())

  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const diffMin = Math.floor((now - new Date(lastUpdate).getTime()) / 60_000)
  const isId = language === 'id'

  let color: string
  let label: string
  if (diffMin < 5) {
    color = 'text-emerald-500'
    label = isId ? 'Baru saja' : 'Just now'
  } else if (diffMin < 30) {
    color = 'text-emerald-500'
    label = isId ? `${diffMin} menit lalu` : `${diffMin} min ago`
  } else if (diffMin < 120) {
    color = 'text-amber-500'
    label = isId ? `${diffMin} menit lalu` : `${diffMin} min ago`
  } else {
    color = 'text-destructive'
    const hours = Math.floor(diffMin / 60)
    label = isId ? `${hours} jam lalu` : `${hours} hours ago`
  }

  return (
    <p className={`text-[8px] italic mt-1 flex items-center gap-1 ${color}`}>
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
      {isId ? `Kurs diperbarui ${label}` : `Rates updated ${label}`}
    </p>
  )
}
