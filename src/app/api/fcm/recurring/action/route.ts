import { NextResponse } from 'next/server'
import { updateRuleAfterAction } from '@/lib/recurringRules'

export async function POST(req: Request) {
  try {
    const { fcmToken, pendingId, action } = await req.json()
    if (!fcmToken || !pendingId || !action) {
      return NextResponse.json({ error: 'fcmToken, pendingId, action required' }, { status: 400 })
    }
    if (!['confirm', 'skip', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action must be confirm, skip, or reject' }, { status: 400 })
    }

    // pendingId format: ruleId-dueDate (e.g., "abc123-2026-06-25")
    const lastDash = pendingId.lastIndexOf('-')
    const ruleId = pendingId.slice(0, lastDash)
    const dueDate = pendingId.slice(lastDash + 1)
    if (!ruleId || !dueDate) {
      return NextResponse.json({ error: 'invalid pendingId format' }, { status: 400 })
    }

    await updateRuleAfterAction(fcmToken, ruleId, action as 'confirm' | 'skip' | 'reject', dueDate)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
