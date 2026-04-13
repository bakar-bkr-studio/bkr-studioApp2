import { FieldValue } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { getAuthenticatedRequestContext } from "@/lib/server/request-context";
import {
  getCollectionName,
  mapResourceRecord,
  RESOURCE_NAMES,
  sanitizeResourceUpdate,
  type ResourceName,
} from "@/lib/server/resource-schemas";
import { jsonError, jsonSuccess } from "@/lib/server/response";
import { isOriginAllowed, isRateLimited } from "@/lib/server/http-security";
import { ValidationError } from "@/lib/server/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  response.headers.set("Access-Control-Allow-Methods", "PATCH, DELETE, OPTIONS");
  return response;
}

async function getOwnedDocRef(
  request: NextRequest,
  resource: ResourceName,
  id: string
) {
  const db = getFirebaseAdminDb();
  if (!db) {
    throw new ValidationError(
      "Firebase Admin Firestore non configuré.",
      "firestore/admin-not-configured"
    );
  }

  const { uid } = await getAuthenticatedRequestContext(request);
  const docRef = db.collection(getCollectionName(resource)).doc(id);
  const existingSnapshot = await docRef.get();

  if (!existingSnapshot.exists) {
    throw new ValidationError("Ressource introuvable.", "resource/not-found");
  }

  const existingData = existingSnapshot.data() ?? {};
  if (existingData.userId !== uid) {
    throw new ValidationError("Accès interdit à cette ressource.", "auth/forbidden");
  }

  return { docRef, existingData };
}

function toResponseStatus(code: string) {
  if (code === "resource/not-found") {
    return 404;
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

export async function OPTIONS(request: NextRequest) {
  if (!isOriginAllowed(request)) {
    return jsonError("Origin non autorisée.", 403, "cors/origin-not-allowed");
  }

  const response = new Response(null, { status: 204 });
  return withCorsHeaders(request, response);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ resource: string; id: string }> }
) {
  if (!isOriginAllowed(request)) {
    return jsonError("Origin non autorisée.", 403, "cors/origin-not-allowed");
  }

  const { limited } = isRateLimited(request, "api:v1:resource:update", 100, 60_000);
  if (limited) {
    return jsonError("Trop de requêtes. Réessayez plus tard.", 429, "rate-limit/exceeded");
  }

  const { resource: rawResource, id } = await context.params;
  const resource = parseResource(rawResource);
  if (!resource) {
    return jsonError("Ressource non supportée.", 404, "resource/not-found");
  }

  if (!id?.trim()) {
    return jsonError("Identifiant invalide.", 400, "validation/invalid-id");
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Payload JSON invalide.", 400, "validation/invalid-json");
    }

    const patch = sanitizeResourceUpdate(resource, body);
    const { docRef, existingData } = await getOwnedDocRef(request, resource, id.trim());
    const nextPatch: Record<string, unknown> = {
      ...patch,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (resource === "goals") {
      const nextType = (nextPatch.type ?? existingData.type) as unknown;
      if (nextType === "qualitative") {
        nextPatch.targetValue = null;
        nextPatch.currentValue = null;
        nextPatch.unit = null;
      }
    }

    await docRef.set(nextPatch, { merge: true });

    const updatedSnapshot = await docRef.get();
    if (!updatedSnapshot.exists) {
      return jsonError(
        "Impossible de relire la ressource mise à jour.",
        500,
        "resource/update-read-failed"
      );
    }

    const item = mapResourceRecord(resource, updatedSnapshot.id, updatedSnapshot.data() ?? {});
    return withCorsHeaders(request, jsonSuccess({ item }, 200));
  } catch (error) {
    if (error instanceof ValidationError) {
      const status = toResponseStatus(error.code);
      return jsonError(error.message, status, error.code);
    }

    return jsonError(
      "Impossible de mettre à jour la ressource.",
      500,
      "resource/update-failed"
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ resource: string; id: string }> }
) {
  if (!isOriginAllowed(request)) {
    return jsonError("Origin non autorisée.", 403, "cors/origin-not-allowed");
  }

  const { limited } = isRateLimited(request, "api:v1:resource:delete", 80, 60_000);
  if (limited) {
    return jsonError("Trop de requêtes. Réessayez plus tard.", 429, "rate-limit/exceeded");
  }

  const { resource: rawResource, id } = await context.params;
  const resource = parseResource(rawResource);
  if (!resource) {
    return jsonError("Ressource non supportée.", 404, "resource/not-found");
  }

  if (!id?.trim()) {
    return jsonError("Identifiant invalide.", 400, "validation/invalid-id");
  }

  try {
    const { docRef } = await getOwnedDocRef(request, resource, id.trim());
    await docRef.delete();
    return withCorsHeaders(request, jsonSuccess({ success: true }, 200));
  } catch (error) {
    if (error instanceof ValidationError) {
      const status = toResponseStatus(error.code);
      return jsonError(error.message, status, error.code);
    }

    return jsonError(
      "Impossible de supprimer la ressource.",
      500,
      "resource/delete-failed"
    );
  }
}
