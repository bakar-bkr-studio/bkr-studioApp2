import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import {
  buildDefaultUserProfile,
  mapUserProfile,
} from "@/lib/server/resource-schemas";
import { ValidationError } from "@/lib/server/errors";
import type { UserProfile } from "@/types";

type UserProfileDocData = Record<string, unknown>;

export async function getOrCreateUserProfileDocument(uid: string, email: string | null) {
  const db = getFirebaseAdminDb();
  if (!db) {
    throw new ValidationError(
      "Firebase Admin Firestore non configuré.",
      "firestore/admin-not-configured"
    );
  }

  const docRef = db.collection("users").doc(uid);
  console.log(`[ProfileDoc] Fetching profile doc for uid=${uid}`);
  
  let existingSnapshot;
  try {
    existingSnapshot = await docRef.get();
    console.log(`[ProfileDoc] Profile doc fetch successful. Exists=${existingSnapshot.exists}`);
  } catch (err) {
    console.error(`[ProfileDoc] PROFILE DOC GET FAILED for uid=${uid}:`, err);
    throw err;
  }

  if (existingSnapshot.exists) {
    return {
      docRef,
      data: (existingSnapshot.data() ?? {}) as UserProfileDocData,
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
    data: (createdSnapshot.data() ?? defaults) as UserProfileDocData,
  };
}

export async function getOrCreateUserProfileForUser(
  uid: string,
  email: string | null
): Promise<UserProfile> {
  const { data } = await getOrCreateUserProfileDocument(uid, email);
  return mapUserProfile(uid, data);
}
