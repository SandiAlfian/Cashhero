"use client"

import * as React from "react"
import Image from "next/image"

interface LogoIconProps {
  className?: string
  /** Use size for a consistent square dimension (e.g. "w-6 h-6") */
  size?: number
}

/**
 * CashHero brand logo icon.
 * Renders the actual cashhero-logo.png asset for pixel-perfect brand consistency.
 */
export function LogoIcon({ className = "w-6 h-6", size = 32 }: LogoIconProps) {
  return (
    <Image
      src="/cashhero-logo.png"
      alt="CashHero Logo"
      width={size}
      height={size}
      className={`${className} object-contain no-print select-none transition-all duration-300 [filter:brightness(0.95)_contrast(1.05)_drop-shadow(0_0_1.2px_#810B38)_drop-shadow(0_0_0.5px_#2D2B33)] dark:[filter:none]`}
      priority
    />
  )
}
