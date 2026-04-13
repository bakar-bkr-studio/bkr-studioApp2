import "server-only";

import type { NextRequest } from "next/server";
import { getCurrentServerSession } from "@/lib/auth/server-session";
import { UnauthorizedError } from "@/lib/server/errors";

export interface AuthenticatedRequestContext {
  uid: string;
  email: string | null;
}

export async function getAuthenticatedRequestContext(
  _request: NextRequest
): Promise<AuthenticatedRequestContext> {
  const session = await getCurrentServerSession();

  if (!session?.uid) {
    throw new UnauthorizedError();
  }

  return {
    uid: session.uid,
    email: typeof session.email === "string" ? session.email : null,
  };
}
