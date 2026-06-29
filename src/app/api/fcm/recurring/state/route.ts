import { NextResponse } from 'next/server'
import { getRulesForToken } from '@/lib/recurringRules'
import { fcmRecurringStateSchema } from '@/lib/validation'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  try {
    let body: unknown
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = fcmRecurringStateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const rules = await getRulesForToken(parsed.data.fcmToken)
    return NextResponse.json({ rules })
  } catch (e) {
    logger.error('RecurringState', 'Failed', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
