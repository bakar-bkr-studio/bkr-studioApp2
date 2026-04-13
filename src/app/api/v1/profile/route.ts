import { FieldValue } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { getAuthenticatedRequestContext } from "@/lib/server/request-context";
import {
  buildDefaultUserProfile,
  mapUserProfile,
  sanitizeProfilePatch,
} from "@/lib/server/resource-schemas";
import { jsonError, jsonSuccess } from "@/lib/server/response";
import { isOriginAllowed, isRateLimited } from "@/lib/server/http-security";
import { ValidationError } from "@/lib/server/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function withCorsHeaders(request: NextRequest, response: Response) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return response;
  }

  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Vary", "Origin");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.headers.set("Access-Control-Allow-Methods", "GET, PATCH, OPTIONS");
  return response;
}

export async function OPTIONS(request: NextRequest) {
  if (!isOriginAllowed(request)) {
    return jsonError("Origin non autorisée.", 403, "cors/origin-not-allowed");
  }

  const response = new Response(null, { status: 204 });
  return withCorsHeaders(request, response);
}

async function getOrCreateProfileDocument(uid: string, email: string | null) {
  const db = getFirebaseAdminDb();
  if (!db) {
    throw new ValidationError(
      "Firebase Admin Firestore non configuré.",
      "firestore/admin-not-configured"
    );
  }

  const docRef = db.collection("users").doc(uid);
  const existingSnapshot = await docRef.get();

  if (existingSnapshot.exists) {
    return {
      docRef,
      data: existingSnapshot.data() ?? {},
    };
  }

  const defaults = buildDefaultUserProfile(uid, email);
  await docRef.set({
    ...defaults,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const createdSnapshot = await docRef.get();
  return {
    docRef,
    data: createdSnapshot.data() ?? defaults,
  };
}

export async function GET(request: NextRequest) {
  if (!isOriginAllowed(request)) {
    return jsonError("Origin non autorisée.", 403, "cors/origin-not-allowed");
  }

  try {
    const { uid, email } = await getAuthenticatedRequestContext(request);
    const { data } = await getOrCreateProfileDocument(uid, email);
    const profile = mapUserProfile(uid, data);
    return withCorsHeaders(request, jsonSuccess({ profile }, 200));
  } catch (error) {
    if (error instanceof ValidationError) {
      const status = error.code === "firestore/admin-not-configured" ? 503 : 400;
      return jsonError(error.message, status, error.code);
    }

    return jsonError("Impossible de charger le profil.", 500, "profile/load-failed");
  }
}

export async function PATCH(request: NextRequest) {
  if (!isOriginAllowed(request)) {
    return jsonError("Origin non autorisée.", 403, "cors/origin-not-allowed");
  }

  const { limited } = isRateLimited(request, "api:v1:profile:update", 40, 60_000);
  if (limited) {
    return jsonError("Trop de requêtes. Réessayez plus tard.", 429, "rate-limit/exceeded");
  }

  try {
    const { uid, email } = await getAuthenticatedRequestContext(request);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Payload JSON invalide.", 400, "validation/invalid-json");
    }

    const patch = sanitizeProfilePatch(body);
    const { docRef, data } = await getOrCreateProfileDocument(uid, email);

    await docRef.set(
      {
        ...patch,
        userId: uid,
        accountStatus: "firebase",
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: data.createdAt ?? FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const updatedSnapshot = await docRef.get();
    const profile = mapUserProfile(uid, updatedSnapshot.data() ?? {});
    return withCorsHeaders(request, jsonSuccess({ profile }, 200));
  } catch (error) {
    if (error instanceof ValidationError) {
      const status = error.code === "firestore/admin-not-configured" ? 503 : 400;
      return jsonError(error.message, status, error.code);
    }

    return jsonError("Impossible de mettre à jour le profil.", 500, "profile/update-failed");
  }
}
