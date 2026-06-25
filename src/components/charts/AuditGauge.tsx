"use client"

export function AuditGauge({ score }: { score: number }) {
  const r = 54, circ = 2 * Math.PI * r
  const pct = Math.min(100, Math.max(0, score))
  const offset = circ - (pct / 100) * circ
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : score >= 40 ? '#F97316' : '#EF4444'
  return (
    <div className="relative flex items-center justify-center w-32 h-32 shrink-0">
      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="8" />
        <circle cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold font-number" style={{ color }}>{score}</span>
        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">/100</span>
      </div>
    </div>
  )
}
