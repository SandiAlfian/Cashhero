import { NextResponse } from 'next/server'
import { syncRules } from '@/lib/recurringRules'
import { fcmRecurringSyncSchema } from '@/lib/validation'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  try {
    let body: unknown
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = fcmRecurringSyncSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const ok = await syncRules(parsed.data.fcmToken, parsed.data.rules)
    return NextResponse.json({ ok })
  } catch (e) {
    logger.error('RecurringSync', 'Failed', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
