import { NextResponse } from 'next/server'
import { getFirestoreDb, verifyIdTokenRest } from '@/lib/firebase-admin'
import { backupSaveSchema } from '@/lib/validation'
import { logger } from '@/lib/logger'

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

    let body: unknown
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = backupSaveSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { transactions, settings, budgets, goals, autoLogRules, trackedOutflows, portfolioAssets } = parsed.data

    const db = getFirestoreDb()
    if (!db) {
      return NextResponse.json({ error: 'Firestore not available' }, { status: 500 })
    }

    await db.collection(BACKUP_COLLECTION).doc(uid).set({
      uid,
      backupVersion: 1,
      backedUpAt: new Date().toISOString(),
      transactions,
      settings,
      budgets,
      goals,
      autoLogRules,
      trackedOutflows,
      portfolioAssets,
    })

    return NextResponse.json({ ok: true, backedUpAt: new Date().toISOString() })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Backup failed'
    logger.error('BackupSave', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
