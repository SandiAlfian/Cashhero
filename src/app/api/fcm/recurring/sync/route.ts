import { NextResponse } from 'next/server'
import { syncRules } from '@/lib/recurringRules'
import type { AutoLogRule } from '@/store/useAutoLogStore'

export async function POST(req: Request) {
  try {
    const { fcmToken, rules } = await req.json()
    if (!fcmToken) return NextResponse.json({ error: 'fcmToken required' }, { status: 400 })
    if (!Array.isArray(rules)) return NextResponse.json({ error: 'rules array required' }, { status: 400 })
    const ok = await syncRules(fcmToken, rules as AutoLogRule[])
    return NextResponse.json({ ok })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
