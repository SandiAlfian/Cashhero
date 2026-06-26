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

    const db = getFirestoreDb()
    if (!db) {
      return NextResponse.json({ error: 'Firestore not available' }, { status: 500 })
    }

    const doc = await db.collection(BACKUP_COLLECTION).doc(uid).get()
    if (!doc.exists) {
      return NextResponse.json({ exists: false, data: null })
    }

    const data = doc.data()
    return NextResponse.json({
      exists: true,
      data: {
        backedUpAt: data?.backedUpAt || null,
        transactions: data?.transactions || [],
        settings: data?.settings || null,
        budgets: data?.budgets || [],
        goals: data?.goals || [],
        autoLogRules: data?.autoLogRules || [],
        trackedOutflows: data?.trackedOutflows || [],
        portfolioAssets: data?.portfolioAssets || [],
      },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Restore failed'
    console.error('[BACKUP RESTORE ERROR]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
