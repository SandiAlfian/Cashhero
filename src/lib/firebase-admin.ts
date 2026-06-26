import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getAuth, type Auth } from 'firebase-admin/auth'

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBTBuTd-ddbCjebkhcXlwhi8wBD5A9IX4Q'

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

export async function verifyIdTokenRest(idToken: string): Promise<{ uid: string; email: string; name: string; picture: string }> {
  const res = await fetch(
    `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Token verification failed (${res.status})`)
  }
  const data = await res.json()
  const user = data.users?.[0]
  if (!user) throw new Error('No user data returned')
  return {
    uid: user.localId,
    email: user.email || '',
    name: user.displayName || user.email?.split('@')[0] || 'User',
    picture: user.photoUrl || '',
  }
}
