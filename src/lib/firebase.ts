import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseConfigured() {
  return Object.values(firebaseConfig).every((value) => Boolean(value));
}

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;
let hasFirebaseInitFailed = false;

function logFirebaseError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[Firebase] ${context}`, error);
  }
}

export function getFirebaseApp() {
  if (!isFirebaseConfigured()) return null;
  if (cachedApp) return cachedApp;
  if (hasFirebaseInitFailed) return null;

  try {
    cachedApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  } catch (error) {
    hasFirebaseInitFailed = true;
    logFirebaseError("Échec d'initialisation Firebase app.", error);
    return null;
  }

  return cachedApp;
}

export function getFirebaseDb() {
  const app = getFirebaseApp();
  if (!app) return null;

  if (!cachedDb) {
    try {
      cachedDb = getFirestore(app);
    } catch (error) {
      logFirebaseError("Échec d'initialisation Firestore.", error);
      return null;
    }
  }

  return cachedDb;
}

export function getFirebaseAuth() {
  const app = getFirebaseApp();
  if (!app) return null;

  if (!cachedAuth) {
    try {
      cachedAuth = getAuth(app);
    } catch (error) {
      logFirebaseError("Échec d'initialisation Firebase Auth.", error);
      return null;
    }
  }

  return cachedAuth;
}
