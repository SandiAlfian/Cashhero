import { NextResponse } from 'next/server'
import { verifyIdTokenRest } from '@/lib/firebase-admin'
import { authVerifySchema } from '@/lib/validation'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  try {
    let body: unknown
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = authVerifySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const user = await verifyIdTokenRest(parsed.data.idToken)
    return NextResponse.json(user)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    logger.error('AuthVerify', msg)
    return NextResponse.json({ error: msg }, { status: 401 })
  }
}
