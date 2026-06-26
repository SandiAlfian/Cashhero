import { NextResponse } from 'next/server'
import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'
import { readTokens, type FcmTokenEntry } from '@/lib/fcm-tokens'

const CRON_SECRET = process.env.CRON_SECRET

function initAdmin() {
  if (getApps().length) return getMessaging()

  const sa = process.env.FCM_SERVICE_ACCOUNT
  if (!sa) throw new Error('FCM_SERVICE_ACCOUNT not configured')

  initializeApp({
    credential: cert(JSON.parse(sa)),
  })
  return getMessaging()
}

function isEndOfPeriod(filter: string): boolean {
  const now = new Date()
  const dow = now.getDay()
  const date = now.getDate()
  const month = now.getMonth()
  const year = now.getFullYear()
  switch (filter) {
    case 'weekly': return dow === 0
    case 'monthly': return date === new Date(year, month + 1, 0).getDate()
    case 'quarterly': {
      const ld = [new Date(year, 3, 0).getDate(), new Date(year, 6, 0).getDate(), new Date(year, 9, 0).getDate(), new Date(year, 12, 0).getDate()]
      return ld.includes(date) && [2, 5, 8, 11].includes(month)
    }
    case 'yearly': return month === 11 && date === 31
    default: return false
  }
}

function getMessages(type: string) {
  if (type === 'morning') {
    return { title: 'Cashhero', body_id: 'Selamat pagi! \u2604\ufe0f Saatnya meninjau anggaran & mencatat pengeluaran hari ini.', body_en: 'Good morning! \u2604\ufe0f Review your budget & log today\'s expenses.' }
  }
  if (type === 'evening') {
    return { title: 'Cashhero', body_id: 'Selamat malam! \ud83c\udf19 Catat pengeluaran hari ini agar tetap sesuai anggaran.', body_en: 'Good evening! \ud83c\udf19 Log today\'s expenses to stay on budget.' }
  }
  return { title: 'Laporan Audit Periode', body_id: 'Periode audit telah berakhir. Buka aplikasi untuk melihat skor keuangan & rekomendasi Anda.', body_en: 'Audit period has ended. Open the app to see your financial score & recommendations.' }
}

async function sendFcmBatch(entries: FcmTokenEntry[], title: string, bodyId: string, bodyEn: string, type: string) {
  if (entries.length === 0) return 0

  const messaging = initAdmin()
  const idTokens = entries.filter(e => e.lang === 'id').map(e => e.token)
  const enTokens = entries.filter(e => e.lang !== 'id').map(e => e.token)
  let sent = 0

  const doSend = async (tokens: string[], body: string) => {
    if (tokens.length === 0) return 0
    let s = 0
    for (let i = 0; i < tokens.length; i += 500) {
      try {
        const result = await messaging.sendEachForMulticast({
          tokens: tokens.slice(i, i + 500),
          notification: { title, body },
          data: { type },
        })
        s += (result.successCount || 0)
      } catch (err) { console.error('[FCM Send] batch send failed', err) }
    }
    return s
  }

  sent += await doSend(idTokens, bodyId)
  sent += await doSend(enTokens, bodyEn)
  return sent
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'morning'
  const key = searchParams.get('key')

  if (CRON_SECRET && key !== CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    initAdmin()
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }

  const msgs = getMessages(type)
  const tokens = await readTokens()
  if (tokens.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no tokens' })
  }

  let targetTokens = tokens
  if (type === 'audit') {
    targetTokens = tokens.filter(t => t.filter && isEndOfPeriod(t.filter))
    if (targetTokens.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, reason: 'no tokens at end of period' })
    }
  }

  const sent = await sendFcmBatch(
    targetTokens,
    msgs.title,
    msgs.body_id,
    msgs.body_en,
    type,
  )

  return NextResponse.json({ ok: true, sent, total: targetTokens.length })
}
