import { NextResponse } from 'next/server'
import { getFirestoreDb, verifyIdTokenRest } from '@/lib/firebase-admin'

const BACKUP_COLLECTION = 'user_backups'

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const idToken = authHeader.slice(7)
    const decoded = await verifyIdTokenRest(idToken)
    const uid = decoded.uid

    const body = await req.json()
    const { transactions, settings, budgets, goals, autoLogRules, trackedOutflows, portfolioAssets } = body

    const db = getFirestoreDb()
    if (!db) {
      return NextResponse.json({ error: 'Firestore not available' }, { status: 500 })
    }

    await db.collection(BACKUP_COLLECTION).doc(uid).set({
      uid,
      backupVersion: 1,
      backedUpAt: new Date().toISOString(),
      transactions: transactions || [],
      settings: settings || null,
      budgets: budgets || [],
      goals: goals || [],
      autoLogRules: autoLogRules || [],
      trackedOutflows: trackedOutflows || [],
      portfolioAssets: portfolioAssets || [],
    })

    return NextResponse.json({ ok: true, backedUpAt: new Date().toISOString() })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Backup failed'
    console.error('[BACKUP SAVE ERROR]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
