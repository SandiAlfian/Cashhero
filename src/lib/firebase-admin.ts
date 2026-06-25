import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getAuth, type Auth } from 'firebase-admin/auth'

function getAdminApp() {
  if (getApps().length === 0) {
    const sa = process.env.FCM_SERVICE_ACCOUNT
    if (!sa) return null
    try {
      return initializeApp({ credential: cert(JSON.parse(sa)) })
    } catch {
      return null
    }
  }
  return getApps()[0]
}

let db: Firestore | null | undefined

export function getFirestoreDb(): Firestore | null {
  if (db === undefined) {
    const app = getAdminApp()
    if (!app) {
      db = null
    } else {
      try {
        db = getFirestore()
      } catch {
        db = null
      }
    }
  }
  return db
}

export function getAdminAuth(): Auth | null {
  const app = getAdminApp()
  if (!app) return null
  try {
    return getAuth()
  } catch {
    return null
  }
}
