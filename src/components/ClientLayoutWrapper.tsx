"use client"

import * as React from "react"
import { SplashScreen } from "./SplashScreen"
import { PWAInstallPrompt } from "./PWAInstallPrompt"

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = React.useState(true)

  React.useEffect(() => {
    const handleBeforePrompt = (e: Event) => {
      e.preventDefault();
      // Store the event globally so any component can access it later
      (window as unknown as Window & { deferredPwaPrompt?: Event }).deferredPwaPrompt = e;
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforePrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforePrompt);
    };
  }, []);

  return (
    <>
      {showSplash ? (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      ) : (
        <>
          {children}
          <PWAInstallPrompt />
        </>
      )}
    </>
  )
}
