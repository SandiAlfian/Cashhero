import { NextResponse } from 'next/server'
import { readTokens, writeTokens } from '@/lib/fcm-tokens'
import { fcmRegisterSchema } from '@/lib/validation'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  try {
    let body: unknown
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = fcmRegisterSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { token, lang, filter, remove } = parsed.data
    const tokens = await readTokens()
    const idx = tokens.findIndex(t => t.token === token)

    if (remove) {
      if (idx >= 0) tokens.splice(idx, 1)
    } else {
      const entry = { token, lang, filter, updatedAt: new Date().toISOString() }
      if (idx >= 0) tokens[idx] = entry
      else tokens.push(entry)
    }

    await writeTokens(tokens)
    return NextResponse.json({ ok: true })
  } catch (e) {
    logger.error('FcmRegister', 'Failed', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
