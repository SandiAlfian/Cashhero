import { NextResponse } from 'next/server'
import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'
import { readTokens } from '@/lib/fcm-tokens'

export async function GET() {
  try {
    if (getApps().length === 0) {
      const sa = process.env.FCM_SERVICE_ACCOUNT
      if (!sa) return NextResponse.json({ error: 'FCM_SERVICE_ACCOUNT not configured' }, { status: 500 })
      initializeApp({ credential: cert(JSON.parse(sa)) })
    }

    const tokens = readTokens()
    if (tokens.length === 0) return NextResponse.json({ error: 'no registered tokens' }, { status: 400 })

    // Send test notification to the most recently registered token
    const latest = tokens.reduce((a, b) => a.updatedAt > b.updatedAt ? a : b)
    const lang = latest.lang === 'id' ? 'id' : 'en'
    const title = lang === 'id' ? 'Uji Coba Notifikasi Cashhero 🔔' : 'Cashhero Test Notification 🔔'
    const body = lang === 'id'
      ? 'Sistem notifikasi pengingat finansial Cashhero aktif dan berjalan dengan lancar!'
      : 'Cashhero financial reminder notification system is active and running smoothly!'

    const messaging = getMessaging()
    const result = await messaging.send({
      token: latest.token,
      notification: { title, body },
      data: { type: 'test' },
    })

    return NextResponse.json({ ok: true, messageId: result })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
