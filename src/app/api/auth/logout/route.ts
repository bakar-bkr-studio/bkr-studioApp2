import { NextResponse, type NextRequest } from "next/server";
import { AUTH_SESSION_COOKIE_NAME } from "@/lib/auth/session-constants";
import {
  revokeRefreshTokensByUid,
  type SessionOperationError,
  verifyIdTokenFromClient,
  verifyServerSessionCookie,
} from "@/lib/auth/server-session";
import { isOriginAllowed, isRateLimited } from "@/lib/server/http-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface LogoutRequestBody {
  idToken?: unknown;
}

function toAuthErrorCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as SessionOperationError).code === "string"
  ) {
    return (error as SessionOperationError).code;
  }

  return "auth/session-sync-failed";
}

async function getUidFromRequest(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie");
  const sessionCookie = cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${AUTH_SESSION_COOKIE_NAME}=`))
    ?.slice(`${AUTH_SESSION_COOKIE_NAME}=`.length);

  if (sessionCookie) {
    const decodedFromSession = await verifyServerSessionCookie(sessionCookie, false);
    if (decodedFromSession?.uid) {
      return decodedFromSession.uid;
    }
  }

  try {
    const body = (await request.json()) as LogoutRequestBody;
    const idToken = typeof body?.idToken === "string" ? body.idToken.trim() : "";

    if (!idToken) {
      return null;
    }

    const decodedFromIdToken = await verifyIdTokenFromClient(idToken);
    return decodedFromIdToken?.uid ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  if (!isOriginAllowed(request)) {
    return NextResponse.json(
      { code: "cors/origin-not-allowed", error: "Origin non autorisée." },
      { status: 403 }
    );
  }

  const { limited } = isRateLimited(request, "api:auth:logout", 40, 5 * 60_000);
  if (limited) {
    return NextResponse.json(
      { code: "rate-limit/exceeded", error: "Trop de requêtes. Réessayez plus tard." },
      { status: 429 }
    );
  }

  try {
    const uid = await getUidFromRequest(request);

    if (uid) {
      await revokeRefreshTokensByUid(uid);
    }

    const response = NextResponse.json({ success: true }, { status: 200 });

    response.cookies.set({
      name: AUTH_SESSION_COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    const code = toAuthErrorCode(error);
    const status = code === "auth/admin-not-configured" ? 503 : 500;
    const response = NextResponse.json(
      { code, error: "Impossible de clôturer la session serveur." },
      { status }
    );

    response.cookies.set({
      name: AUTH_SESSION_COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });

    return response;
  }
}
