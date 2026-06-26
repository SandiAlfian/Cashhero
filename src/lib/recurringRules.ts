import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import type { AutoLogRule } from '@/store/useAutoLogStore'

const RULES_COLLECTION = 'recurring_rules'
const PENDING_COLLECTION = 'recurring_pending'

function getDb() {
  if (getApps().length === 0) {
    const sa = process.env.FCM_SERVICE_ACCOUNT
    if (!sa) return null
    try {
      initializeApp({ credential: cert(JSON.parse(sa)) })
    } catch (err) {
      console.error('[RecurringRules] initAdmin failed', err)
      return null
    }
  }
  try {
    return getFirestore()
  } catch (err) {
    console.error('[RecurringRules] getFirestore failed', err)
    return null
  }
}

export async function syncRules(fcmToken: string, rules: AutoLogRule[]) {
  const db = getDb()
  if (!db) return false
  try {
    const batch = db.batch()
    const ref = db.collection(RULES_COLLECTION).doc(fcmToken)
    batch.set(ref, {
      rules: rules.map((r) => ({
        id: r.id,
        title: r.title,
        amount: r.amount,
        type: r.type,
        category: r.category,
        note: r.note,
        frequency: r.frequency,
        startDate: r.startDate,
        lastExecutedDate: r.lastExecutedDate,
        isActive: r.isActive,
      })),
      updatedAt: new Date().toISOString(),
    }, { merge: true })
    await batch.commit()
    return true
  } catch (err) {
    console.error('[RecurringRules] syncRules failed', err)
    return false
  }
}

export async function getRulesForToken(fcmToken: string): Promise<AutoLogRule[] | null> {
  const db = getDb()
  if (!db) return null
  try {
    const doc = await db.collection(RULES_COLLECTION).doc(fcmToken).get()
    if (!doc.exists) return null
    const data = doc.data()
    return data?.rules || null
  } catch (err) {
    console.error('[RecurringRules] getRulesForToken failed', err)
    return null
  }
}

export async function getAllActiveRules(): Promise<{ fcmToken: string; rules: AutoLogRule[] }[]> {
  const db = getDb()
  if (!db) return []
  try {
    const snapshot = await db.collection(RULES_COLLECTION).get()
    const result: { fcmToken: string; rules: AutoLogRule[] }[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      if (data?.rules && Array.isArray(data.rules)) {
        const activeRules = data.rules.filter((r: AutoLogRule) => r.isActive)
        if (activeRules.length > 0) {
          result.push({ fcmToken: doc.id, rules: activeRules })
        }
      }
    })
    return result
  } catch (err) {
    console.error('[RecurringRules] getAllActiveRules failed', err)
    return []
  }
}

export async function markPendingNotified(fcmToken: string, pendingIds: string[]) {
  const db = getDb()
  if (!db) return
  try {
    const batch = db.batch()
    for (const id of pendingIds) {
      const ref = db.collection(PENDING_COLLECTION).doc(`${fcmToken}_${id}`)
      batch.set(ref, {
        fcmToken,
        pendingId: id,
        notifiedAt: new Date().toISOString(),
        status: 'notified',
      })
    }
    await batch.commit()
  } catch (err) {
    console.error('[RecurringRules] markPendingNotified failed', err)
  }
}

export async function updateRuleAfterAction(fcmToken: string, ruleId: string, action: 'confirm' | 'skip' | 'reject', dueDate: string) {
  const db = getDb()
  if (!db) return
  try {
    const docRef = db.collection(RULES_COLLECTION).doc(fcmToken)
    const doc = await docRef.get()
    if (!doc.exists) return
    const data = doc.data()
    if (!data?.rules) return
    const rules: AutoLogRule[] = data.rules
    const idx = rules.findIndex((r) => r.id === ruleId)
    if (idx === -1) return
    const rule = rules[idx]
    if (action === 'reject') {
      rules[idx] = { ...rule, isActive: false }
    } else {
      rules[idx] = { ...rule, lastExecutedDate: dueDate }
    }
    await docRef.update({ rules })
  } catch (err) {
    console.error('[RecurringRules] updateRuleAfterAction failed', err)
  }
}

function countMissedDates(frequency: string, startDate: string, lastExecuted: string | null): string[] {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const from = lastExecuted ? new Date(lastExecuted) : new Date(startDate)
  const dates: string[] = []
  const cursor = new Date(from)

  switch (frequency) {
    case 'daily': cursor.setDate(cursor.getDate() + 1); break
    case 'weekly': cursor.setDate(cursor.getDate() + 7); break
    case 'monthly': cursor.setMonth(cursor.getMonth() + 1); break
    case 'yearly': cursor.setFullYear(cursor.getFullYear() + 1); break
  }

  while (cursor <= today) {
    dates.push(cursor.toISOString().slice(0, 10))
    switch (frequency) {
      case 'daily': cursor.setDate(cursor.getDate() + 1); break
      case 'weekly': cursor.setDate(cursor.getDate() + 7); break
      case 'monthly': cursor.setMonth(cursor.getMonth() + 1); break
      case 'yearly': cursor.setFullYear(cursor.getFullYear() + 1); break
    }
  }
  return dates
}

export function computeDueItems(rules: AutoLogRule[]): { rule: AutoLogRule; dueDate: string }[] {
  const items: { rule: AutoLogRule; dueDate: string }[] = []
  for (const rule of rules) {
    const dates = countMissedDates(rule.frequency, rule.startDate, rule.lastExecutedDate)
    for (const d of dates) {
      items.push({ rule, dueDate: d })
    }
  }
  return items
}
