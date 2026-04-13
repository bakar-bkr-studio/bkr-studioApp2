import "server-only";

import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import {
  getFirestore,
  type Firestore,
} from "firebase-admin/firestore";

interface FirebaseAdminServiceAccount {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

let cachedAdminApp: App | null = null;
let cachedAdminAuth: Auth | null = null;
let cachedAdminDb: Firestore | null = null;
let hasAdminInitFailed = false;

function logFirebaseAdminError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[FirebaseAdmin] ${context}`, error);
  }
}

function getServiceAccountFromEnv(): FirebaseAdminServiceAccount | null {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    projectId,
    clientEmail,
    privateKey,
  };
}

export function isFirebaseAdminConfigured() {
  return Boolean(getServiceAccountFromEnv());
}

function getFirebaseAdminApp() {
  if (!isFirebaseAdminConfigured()) {
    return null;
  }

  if (cachedAdminApp) {
    return cachedAdminApp;
  }

  if (hasAdminInitFailed) {
    return null;
  }

  try {
    const serviceAccount = getServiceAccountFromEnv();

    if (!serviceAccount) {
      return null;
    }

    cachedAdminApp = getApps().length
      ? getApp()
      : initializeApp({
          credential: cert(serviceAccount),
        });
  } catch (error) {
    hasAdminInitFailed = true;
    logFirebaseAdminError("Échec d'initialisation Firebase Admin.", error);
    return null;
  }

  return cachedAdminApp;
}

export function getFirebaseAdminAuth() {
  if (cachedAdminAuth) {
    return cachedAdminAuth;
  }

  const app = getFirebaseAdminApp();
  if (!app) {
    return null;
  }

  try {
    cachedAdminAuth = getAuth(app);
  } catch (error) {
    logFirebaseAdminError("Échec d'initialisation Firebase Admin Auth.", error);
    return null;
  }

  return cachedAdminAuth;
}

export function getFirebaseAdminDb() {
  if (cachedAdminDb) {
    return cachedAdminDb;
  }

  const app = getFirebaseAdminApp();
  if (!app) {
    return null;
  }

  try {
    cachedAdminDb = getFirestore(app);
  } catch (error) {
    logFirebaseAdminError("Échec d'initialisation Firebase Admin Firestore.", error);
    return null;
  }

  return cachedAdminDb;
}
