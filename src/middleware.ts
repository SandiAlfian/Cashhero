import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

const WINDOW_MS = 60_000
const MAX_REQUESTS: Record<string, number> = {
  default: 60,
  '/api/auth/': 10,
  '/api/fcm/register': 20,
}

function getLimit(pathname: string): number {
  for (const [prefix, limit] of Object.entries(MAX_REQUESTS)) {
    if (pathname.startsWith(prefix)) return limit
  }
  return MAX_REQUESTS.default
}

function rateLimit(request: NextRequest): NextResponse | null {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'

  const pathname = request.nextUrl.pathname
  const key = `${ip}:${pathname}`
  const now = Date.now()
  const max = getLimit(pathname)

  const entry = store.get(key)
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return null
  }

  entry.count++

  if (entry.count > max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      }
    )
  }

  return null
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/api/health') {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    const blocked = rateLimit(request)
    if (blocked) return blocked
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
