import { NextResponse } from 'next/server'
import { readTokens, writeTokens } from '@/lib/fcm-tokens'

export async function POST(req: Request) {
  try {
    const { token, lang, filter, remove } = await req.json()
    if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

    const tokens = readTokens()
    const idx = tokens.findIndex(t => t.token === token)

    if (remove) {
      if (idx >= 0) tokens.splice(idx, 1)
    } else {
      const entry = { token, lang: lang || 'id', filter: filter || 'monthly', updatedAt: new Date().toISOString() }
      if (idx >= 0) tokens[idx] = entry
      else tokens.push(entry)
    }

    writeTokens(tokens)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
