"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  title: string
  value: string
  icon: React.ElementType
  colorClass: string
  secondaryValue?: string
  secondaryLabel?: string
  description?: string
  trend?: 'up' | 'down' | 'neutral'
}

export function InfoMetricCard({ title, value, icon: Icon, colorClass, secondaryValue, secondaryLabel, description, trend }: Props) {
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'
  const trendColor = trend === 'up' ? 'text-green-600 dark:text-green-400' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
  return (
    <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      <CardHeader className="flex flex-row items-start justify-between pb-2 gap-2">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {description && <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-relaxed">{description}</p>}
        </div>
        <div className={`p-2 rounded-full shrink-0 ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-card-foreground font-number leading-tight">{value}</div>
        {(secondaryValue || secondaryLabel) && (
          <div className="flex items-baseline gap-1.5 mt-1.5 flex-wrap">
            {secondaryValue && <span className="text-sm font-bold text-card-foreground font-number">{secondaryValue}</span>}
            {secondaryLabel && <span className="text-[10px] text-muted-foreground/70">{secondaryLabel}</span>}
            {trend && (
              <span className={`text-[10px] font-bold ${trendColor} ml-auto`}>
                {trendIcon}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
