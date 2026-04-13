import { FieldValue } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { getAuthenticatedRequestContext } from "@/lib/server/request-context";
import {
  getCollectionName,
  getResourceSortField,
  mapResourceRecord,
  RESOURCE_NAMES,
  sanitizeResourceCreate,
  type ResourceName,
} from "@/lib/server/resource-schemas";
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

function parseResource(resource: string): ResourceName | null {
  return RESOURCE_NAMES.includes(resource as ResourceName)
    ? (resource as ResourceName)
    : null;
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
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  return response;
}

export async function OPTIONS(request: NextRequest) {
  if (!isOriginAllowed(request)) {
    return jsonError("Origin non autorisée.", 403, "cors/origin-not-allowed");
  }

  const response = new Response(null, { status: 204 });
  return withCorsHeaders(request, response);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ resource: string }> }
) {
  if (!isOriginAllowed(request)) {
    return jsonError("Origin non autorisée.", 403, "cors/origin-not-allowed");
  }

  const { resource: rawResource } = await context.params;
  const resource = parseResource(rawResource);
  if (!resource) {
    return jsonError("Ressource non supportée.", 404, "resource/not-found");
  }

  try {
    const db = getFirebaseAdminDb();
    if (!db) {
      return jsonError(
        "Firebase Admin Firestore non configuré.",
        503,
        "firestore/admin-not-configured"
      );
    }

    const { uid } = await getAuthenticatedRequestContext(request);
    const sortField = getResourceSortField(resource);

    const snapshot = await db
      .collection(getCollectionName(resource))
      .where("userId", "==", uid)
      .orderBy(sortField, "desc")
      .get();

    const items = snapshot.docs.map((doc) =>
      mapResourceRecord(resource, doc.id, doc.data())
    );

    return withCorsHeaders(request, jsonSuccess({ items }, 200));
  } catch (error) {
    const code = getErrorCode(error, "resource/list-failed");
    const status = error instanceof ValidationError ? toResponseStatus(error.code) : toResponseStatus(code);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Impossible de charger les données.";

    return jsonError(message, status, code);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ resource: string }> }
) {
  if (!isOriginAllowed(request)) {
    return jsonError("Origin non autorisée.", 403, "cors/origin-not-allowed");
  }

  const { limited } = isRateLimited(request, "api:v1:resource:create", 60, 60_000);
  if (limited) {
    return jsonError("Trop de requêtes. Réessayez plus tard.", 429, "rate-limit/exceeded");
  }

  const { resource: rawResource } = await context.params;
  const resource = parseResource(rawResource);
  if (!resource) {
    return jsonError("Ressource non supportée.", 404, "resource/not-found");
  }

  try {
    const db = getFirebaseAdminDb();
    if (!db) {
      return jsonError(
        "Firebase Admin Firestore non configuré.",
        503,
        "firestore/admin-not-configured"
      );
    }

    const { uid } = await getAuthenticatedRequestContext(request);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Payload JSON invalide.", 400, "validation/invalid-json");
    }

    const payload = sanitizeResourceCreate(resource, body);
    const createdRef = await db.collection(getCollectionName(resource)).add({
      ...payload,
      userId: uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const createdSnapshot = await createdRef.get();
    if (!createdSnapshot.exists) {
      return jsonError(
        "Impossible de relire la ressource créée.",
        500,
        "resource/create-read-failed"
      );
    }

    const item = mapResourceRecord(resource, createdSnapshot.id, createdSnapshot.data() ?? {});
    return withCorsHeaders(request, jsonSuccess({ item }, 201));
  } catch (error) {
    const code = getErrorCode(error, "resource/create-failed");
    const status = error instanceof ValidationError ? toResponseStatus(error.code) : toResponseStatus(code);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Impossible de créer la ressource.";

    return jsonError(message, status, code);
  }
}
