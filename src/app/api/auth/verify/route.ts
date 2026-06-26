import { NextResponse } from 'next/server'

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBTBuTd-ddbCjebkhcXlwhi8wBD5A9IX4Q'

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

    const res = await fetch(
      `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[VERIFY REST ERROR]', res.status, err)
      return NextResponse.json({ error: err?.error?.message || 'Token verification failed' }, { status: 401 })
    }

    const data = await res.json()
    const user = data.users?.[0]
    if (!user) {
      return NextResponse.json({ error: 'No user data returned' }, { status: 401 })
    }

    return NextResponse.json({
      uid: user.localId,
      email: user.email || '',
      name: user.displayName || user.email?.split('@')[0] || 'User',
      picture: user.photoUrl || '',
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('[VERIFY ERROR]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
