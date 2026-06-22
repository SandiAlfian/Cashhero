import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import fs from 'fs'
import path from 'path'

export interface FcmTokenEntry {
  token: string
  lang: string
  filter: string
  updatedAt: string
}

const TOKENS_PATH = path.join(process.cwd(), 'data', 'fcm-tokens.json')
const COLLECTION = 'fcm_tokens'

function getDb() {
  if (getApps().length === 0) {
    const sa = process.env.FCM_SERVICE_ACCOUNT
    if (!sa) return null
    try {
      initializeApp({ credential: cert(JSON.parse(sa)) })
    } catch {
      return null
    }
  }
  try {
    return getFirestore()
  } catch {
    return null
  }
}

async function readFromFirestore(): Promise<FcmTokenEntry[] | null> {
  try {
    const db = getDb()
    if (!db) return null
    const snapshot = await db.collection(COLLECTION).get()
    const tokens: FcmTokenEntry[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      tokens.push({
        token: doc.id,
        lang: data.lang || 'id',
        filter: data.filter || 'monthly',
        updatedAt: data.updatedAt || '',
      })
    })
    return tokens
  } catch {
    return null
  }
}

async function writeToFirestore(tokens: FcmTokenEntry[]): Promise<boolean> {
  try {
    const db = getDb()
    if (!db) return false
    const batch = db.batch()
    const existingTokens = new Set(tokens.map((t) => t.token))

    // Remove docs that no longer exist
    const snapshot = await db.collection(COLLECTION).get()
    snapshot.forEach((doc) => {
      if (!existingTokens.has(doc.id)) {
        batch.delete(doc.ref)
      }
    })

    // Upsert current tokens
    for (const entry of tokens) {
      const ref = db.collection(COLLECTION).doc(entry.token)
      batch.set(ref, {
        lang: entry.lang,
        filter: entry.filter,
        updatedAt: entry.updatedAt,
      })
    }

    await batch.commit()
    return true
  } catch {
    return false
  }
}

export async function readTokens(): Promise<FcmTokenEntry[]> {
  const fromFirestore = await readFromFirestore()
  if (fromFirestore) return fromFirestore

  try {
    if (!fs.existsSync(TOKENS_PATH)) return []
    return JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf-8'))
  } catch {
    return []
  }
}

export async function writeTokens(tokens: FcmTokenEntry[]) {
  const wrote = await writeToFirestore(tokens)
  if (wrote) return

  const dir = path.dirname(TOKENS_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2))
}
