import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getMessaging, type Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBTBuTd-ddbCjebkhcXlwhi8wBD5A9IX4Q",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "cashhero-1ccbc.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "cashhero-1ccbc",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "cashhero-1ccbc.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "274124067625",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:274124067625:web:5b043631a016f5c672dd38"
}

let app: FirebaseApp | undefined
let auth: Auth | undefined
let messaging: Messaging | null | undefined

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  }
  return app
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp())
  }
  return auth
}

export function getFirebaseMessaging(): Messaging | null {
  if (messaging === undefined) {
    if (typeof window === 'undefined') {
      messaging = null
    } else {
      try {
        messaging = getMessaging(getFirebaseApp())
      } catch {
        messaging = null
      }
    }
  }
  return messaging
}
