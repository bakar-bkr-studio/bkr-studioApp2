import { FieldValue } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/lib/server/request-context";
import {
  mapUserProfile,
  sanitizeProfilePatch,
} from "@/lib/server/resource-schemas";
import { getOrCreateUserProfileDocument } from "@/lib/server/profile-doc";
import { jsonError, jsonSuccess } from "@/lib/server/response";
import { isOriginAllowed, isRateLimited } from "@/lib/server/http-security";
import { ValidationError, getErrorCode } from "@/lib/server/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toResponseStatus(code: string): number {
  if (code === "auth/unauthorized") {
    return 401;
  }

  if (code === "auth/forbidden") {
    return 403;
  }

  if (code === "firestore/admin-not-configured") {
    return 503;
  }

  if (code.startsWith("validation/")) {
    return 400;
  }

  return 500;
}

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

export async function GET(request: NextRequest) {
  if (!isOriginAllowed(request)) {
    return jsonError("Origin non autorisée.", 403, "cors/origin-not-allowed");
  }

  console.log(`[API/profile] GET called`);

  try {
    const { uid, email } = await getAuthenticatedRequestContext(request);
    console.log(`[API/profile] GET Resolved UID=${uid}, email=${email}`);
    
    console.log(`[API/profile] GET Fetching profile document...`);
    const { data } = await getOrCreateUserProfileDocument(uid, email);
    console.log(`[API/profile] GET Profile fetched successfully`);
    
    const profile = mapUserProfile(uid, data);
    return withCorsHeaders(request, jsonSuccess({ profile }, 200));
  } catch (error) {
    const code = getErrorCode(error, "profile/load-failed");
    const status = error instanceof ValidationError ? toResponseStatus(error.code) : toResponseStatus(code);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Impossible de charger le profil.";

    console.error(`[API/profile] GET ERROR: ${code} - ${message}`, error);

    return jsonError(`[Debug Info] ${message}`, status, code);
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

  console.log(`[API/profile] PATCH called`);

  try {
    const { uid, email } = await getAuthenticatedRequestContext(request);
    console.log(`[API/profile] PATCH Resolved UID=${uid}, email=${email}`);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Payload JSON invalide.", 400, "validation/invalid-json");
    }

    const patch = sanitizeProfilePatch(body);
    const { docRef, data } = await getOrCreateUserProfileDocument(uid, email);

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
    const code = getErrorCode(error, "profile/update-failed");
    const status = error instanceof ValidationError ? toResponseStatus(error.code) : toResponseStatus(code);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Impossible de mettre à jour le profil.";

    console.error(`[API/profile] PATCH ERROR: ${code} - ${message}`, error);

    return jsonError(`[Debug Info] ${message}`, status, code);
  }
}
