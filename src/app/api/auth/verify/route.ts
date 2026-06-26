import { NextResponse } from 'next/server'
import { verifyIdTokenRest } from '@/lib/firebase-admin'

export async function POST(req: Request) {
  try {
    let idToken: string
    try {
      const body = await req.json()
      idToken = body.idToken
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (!idToken) {
      return NextResponse.json({ error: 'idToken required' }, { status: 400 })
    }

    const user = await verifyIdTokenRest(idToken)
    return NextResponse.json(user)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('[VERIFY ERROR]', msg)
    return NextResponse.json({ error: msg }, { status: 401 })
  }
}
