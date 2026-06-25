import { NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json()
    if (!idToken) {
      return NextResponse.json({ error: 'idToken required' }, { status: 400 })
    }

    const auth = getAdminAuth()
    if (!auth) {
      return NextResponse.json({ error: 'Firebase Auth not available' }, { status: 500 })
    }

    const decoded = await auth.verifyIdToken(idToken)
    return NextResponse.json({
      uid: decoded.uid,
      email: decoded.email || '',
      name: decoded.name || decoded.email?.split('@')[0] || 'User',
      picture: decoded.picture || '',
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Invalid token'
    return NextResponse.json({ error: msg }, { status: 401 })
  }
}
