import { NextResponse } from 'next/server'
import { getRulesForToken } from '@/lib/recurringRules'

export async function POST(req: Request) {
  try {
    const { fcmToken } = await req.json()
    if (!fcmToken) {
      return NextResponse.json({ error: 'fcmToken required' }, { status: 400 })
    }
    const rules = await getRulesForToken(fcmToken)
    return NextResponse.json({ rules })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
