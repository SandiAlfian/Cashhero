import { NextResponse } from 'next/server'
import { updateRuleAfterAction } from '@/lib/recurringRules'
import { fcmRecurringActionSchema } from '@/lib/validation'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  try {
    let body: unknown
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = fcmRecurringActionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { fcmToken, pendingId, action } = parsed.data

    const lastDash = pendingId.lastIndexOf('-')
    const ruleId = pendingId.slice(0, lastDash)
    const dueDate = pendingId.slice(lastDash + 1)
    if (!ruleId || !dueDate) {
      return NextResponse.json({ error: 'invalid pendingId format' }, { status: 400 })
    }

    await updateRuleAfterAction(fcmToken, ruleId, action, dueDate)
    return NextResponse.json({ ok: true })
  } catch (e) {
    logger.error('RecurringAction', 'Failed', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
