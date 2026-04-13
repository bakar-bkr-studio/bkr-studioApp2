import type { Firestore } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { getErrorCode } from "@/lib/server/errors";
import { isOriginAllowed, isRateLimited } from "@/lib/server/http-security";
import { getAuthenticatedRequestContext } from "@/lib/server/request-context";
import { jsonError, jsonSuccess } from "@/lib/server/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACCOUNT_COLLECTIONS = [
  "contacts",
  "projects",
  "tasks",
  "transactions",
  "goals",
] as const;

type UserOwnedCollection = (typeof ACCOUNT_COLLECTIONS)[number];

const DELETE_BATCH_SIZE = 200;

function withCorsHeaders(request: NextRequest, response: Response) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return response;
  }

  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Vary", "Origin");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.headers.set("Access-Control-Allow-Methods", "DELETE, OPTIONS");
  return response;
}

async function deleteCollectionDocsByUserId(
  db: Firestore,
  collectionName: UserOwnedCollection,
  uid: string
): Promise<number> {
  let deletedCount = 0;

  while (true) {
    const snapshot = await db
      .collection(collectionName)
      .where("userId", "==", uid)
      .limit(DELETE_BATCH_SIZE)
      .get();

    if (snapshot.empty) {
      break;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    deletedCount += snapshot.size;

    if (snapshot.size < DELETE_BATCH_SIZE) {
      break;
    }
  }

  return deletedCount;
}

function toResponseStatus(code: string): number {
  if (code === "auth/unauthorized") {
    return 401;
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

export async function DELETE(request: NextRequest) {
  if (!isOriginAllowed(request)) {
    return jsonError("Origin non autorisée.", 403, "cors/origin-not-allowed");
  }

  const { limited } = isRateLimited(request, "api:v1:account:delete", 6, 60 * 60_000);
  if (limited) {
    return jsonError("Trop de requêtes. Réessayez plus tard.", 429, "rate-limit/exceeded");
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

    const deleted = {
      contacts: 0,
      projects: 0,
      tasks: 0,
      transactions: 0,
      goals: 0,
      users: 0,
    };

    for (const collectionName of ACCOUNT_COLLECTIONS) {
      deleted[collectionName] = await deleteCollectionDocsByUserId(
        db,
        collectionName,
        uid
      );
    }

    const userDocRef = db.collection("users").doc(uid);
    const userDocSnapshot = await userDocRef.get();

    if (userDocSnapshot.exists) {
      await userDocRef.delete();
      deleted.users = 1;
    }

    return withCorsHeaders(
      request,
      jsonSuccess(
        {
          success: true,
          deleted,
        },
        200
      )
    );
  } catch (error) {
    const code = getErrorCode(error, "account/delete-data-failed");
    const status = toResponseStatus(code);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Impossible de supprimer les données du compte.";

    return jsonError(message, status, code);
  }
}
