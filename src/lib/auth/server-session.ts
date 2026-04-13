import "server-only";

import { cookies } from "next/headers";
import type { DecodedIdToken } from "firebase-admin/auth";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";
import {
  AUTH_SESSION_COOKIE_NAME,
  AUTH_SESSION_DURATION_MS,
} from "@/lib/auth/session-constants";

export interface SessionOperationError extends Error {
  code?: string;
}

function createAdminNotConfiguredError(): SessionOperationError {
  const error = new Error(
    "Firebase Admin n'est pas configuré. Vérifiez FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL et FIREBASE_PRIVATE_KEY."
  ) as SessionOperationError;
  error.code = "auth/admin-not-configured";
  return error;
}

function getAdminAuthOrThrow() {
  const adminAuth = getFirebaseAdminAuth();

  if (!adminAuth) {
    throw createAdminNotConfiguredError();
  }

  return adminAuth;
}

export async function createServerSessionCookie(idToken: string) {
  const adminAuth = getAdminAuthOrThrow();
  return adminAuth.createSessionCookie(idToken, {
    expiresIn: AUTH_SESSION_DURATION_MS,
  });
}

export async function verifyServerSessionCookie(
  sessionCookie: string,
  checkRevoked = true
): Promise<DecodedIdToken | null> {
  try {
    const adminAuth = getAdminAuthOrThrow();
    return await adminAuth.verifySessionCookie(sessionCookie, checkRevoked);
  } catch {
    return null;
  }
}

export async function verifyIdTokenFromClient(idToken: string): Promise<DecodedIdToken | null> {
  try {
    const adminAuth = getAdminAuthOrThrow();
    return await adminAuth.verifyIdToken(idToken);
  } catch {
    return null;
  }
}

export async function revokeRefreshTokensByUid(uid: string): Promise<void> {
  const adminAuth = getAdminAuthOrThrow();
  await adminAuth.revokeRefreshTokens(uid);
}

export async function getCurrentServerSession(): Promise<DecodedIdToken | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return null;
    }

    return await verifyServerSessionCookie(sessionCookie, true);
  } catch {
    return null;
  }
}
