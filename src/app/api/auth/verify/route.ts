import { NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'

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

    const auth = getAdminAuth()

    if (!auth) {
      const sa = process.env.FCM_SERVICE_ACCOUNT
      console.error('[VERIFY ENV CHECK] FCM_SERVICE_ACCOUNT exists:', !!sa, 'type:', typeof sa, 'length:', sa?.length)
      if (sa) {
        try { JSON.parse(sa); console.error('[VERIFY ENV CHECK] JSON parse OK') }
        catch (e) { console.error('[VERIFY ENV CHECK] JSON parse FAILED:', e) }
      }
      return NextResponse.json({ error: 'Firebase Auth not available — FCM_SERVICE_ACCOUNT missing or invalid on Vercel' }, { status: 500 })
    }

    const decoded = await auth.verifyIdToken(idToken)
    return NextResponse.json({
      uid: decoded.uid,
      email: decoded.email || '',
      name: decoded.name || decoded.email?.split('@')[0] || 'User',
      picture: decoded.picture || '',
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('[VERIFY ERROR]', msg)
    return NextResponse.json({ error: msg }, { status: 401 })
  }
}
