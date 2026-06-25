"use client"

import { type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface Props {
  icon: ReactNode
  title: string
  description: string
  actionLabel: string
  onAction: () => void
  className?: string
}

export function EmptyState({ icon, title, description, actionLabel, onAction, className = "bg-primary/[0.01]" }: Props) {
  return (
    <div className={`flex-1 flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-border rounded-2xl ${className}`}>
      <div className="p-4 bg-primary/5 rounded-2xl mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-[240px] leading-normal mb-5">{description}</p>
      <Button
        size="sm"
        onClick={onAction}
        className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-xs rounded-lg px-4 py-2 cursor-pointer shadow-md"
      >
        <Plus className="w-3.5 h-3.5 mr-1" />
        {actionLabel}
      </Button>
    </div>
  )
}
