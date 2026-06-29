'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalErrorBoundary]', error)
  }, [error])

  return (
    <html>
      <body className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center bg-background text-foreground">
        <div className="text-6xl">⚠️</div>
        <h1 className="text-2xl font-bold">Kesalahan Kritis</h1>
        <p className="text-muted-foreground max-w-md">
          Terjadi kesalahan kritis pada aplikasi. Silakan muat ulang halaman.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Muat Ulang
        </button>
      </body>
    </html>
  )
}
