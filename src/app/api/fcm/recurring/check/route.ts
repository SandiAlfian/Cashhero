import { NextResponse } from 'next/server'
import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'
import { readTokens } from '@/lib/fcm-tokens'
import { getAllActiveRules, computeDueItems, markPendingNotified } from '@/lib/recurringRules'

const CRON_SECRET = process.env.CRON_SECRET

function initAdmin() {
  if (getApps().length) return getMessaging()
  const sa = process.env.FCM_SERVICE_ACCOUNT
  if (!sa) throw new Error('FCM_SERVICE_ACCOUNT not configured')
  initializeApp({ credential: cert(JSON.parse(sa)) })
  return getMessaging()
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key')
    if (CRON_SECRET && key !== CRON_SECRET) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    initAdmin()
    const messaging = getMessaging()
    const allTokens = await readTokens()
    const tokenSet = new Set(allTokens.map((t) => t.token))
    const allRules = await getAllActiveRules()
    let sent = 0
    let total = 0

    for (const { fcmToken, rules } of allRules) {
      if (!tokenSet.has(fcmToken)) continue
      const items = computeDueItems(rules)
      if (items.length === 0) continue

      total += items.length
      const pendingIds = items.map((i) => `${i.rule.id}-${i.dueDate}`)
      const lang = allTokens.find((t) => t.token === fcmToken)?.lang || 'id'

      if (items.length === 1) {
        const { rule, dueDate } = items[0]
        const sign = rule.type === 'in' ? '+' : '-'
        try {
          await messaging.send({
            token: fcmToken,
            notification: {
              title: lang === 'id' ? 'Konfirmasi Transaksi Berulang' : 'Confirm Recurring Transaction',
              body: lang === 'id'
                ? `${rule.title} - ${sign} ${rule.amount.toLocaleString()} (${rule.category})`
                : `${rule.title} - ${sign} ${rule.amount.toLocaleString()} (${rule.category})`,
            },
            data: {
              type: 'recurring',
              pendingId: `${rule.id}-${dueDate}`,
              ruleId: rule.id,
              dueDate,
              lang,
              fcmToken,
              actionConfirm: lang === 'id' ? 'Konfirmasi' : 'Confirm',
              actionSkip: lang === 'id' ? 'Lewati' : 'Skip',
              actionReject: lang === 'id' ? 'Hentikan' : 'Reject',
            },
          })
          sent++
        } catch { /* skip failed */ }
      } else {
        try {
          await messaging.send({
            token: fcmToken,
            notification: {
              title: lang === 'id' ? 'Transaksi Berulang' : 'Recurring Transactions',
              body: lang === 'id'
                ? `${items.length} transaksi berulang menunggu konfirmasi. Buka aplikasi untuk merespon.`
                : `${items.length} recurring transactions pending confirmation. Open app to respond.`,
            },
            data: { type: 'recurring-summary', count: String(items.length), lang },
          })
          sent++
        } catch { /* skip failed */ }
      }

      await markPendingNotified(fcmToken, pendingIds)
    }

    return NextResponse.json({ ok: true, sent, total })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
