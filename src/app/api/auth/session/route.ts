import { NextResponse, type NextRequest } from "next/server";
import {
  AUTH_SESSION_COOKIE_NAME,
  AUTH_SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/session-constants";
import {
  createServerSessionCookie,
  type SessionOperationError,
  verifyServerSessionCookie,
} from "@/lib/auth/server-session";
import { isOriginAllowed, isRateLimited } from "@/lib/server/http-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SessionRequestBody {
  idToken?: unknown;
}

interface SessionStatusResponse {
  authenticated: boolean;
  emailVerified: boolean;
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

export async function GET(request: NextRequest) {
  if (!isOriginAllowed(request)) {
    return NextResponse.json(
      { code: "cors/origin-not-allowed", error: "Origin non autorisée." },
      { status: 403 }
    );
  }

  const { limited } = isRateLimited(request, "api:auth:session:status", 60, 5 * 60_000);
  if (limited) {
    return NextResponse.json(
      { code: "rate-limit/exceeded", error: "Trop de requêtes. Réessayez plus tard." },
      { status: 429 }
    );
  }

  const sessionCookie = request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    const payload: SessionStatusResponse = {
      authenticated: false,
      emailVerified: false,
    };
    return NextResponse.json(payload, { status: 200 });
  }

  const decodedSession = await verifyServerSessionCookie(sessionCookie, true);
  if (!decodedSession?.uid) {
    const payload: SessionStatusResponse = {
      authenticated: false,
      emailVerified: false,
    };
    return NextResponse.json(payload, { status: 200 });
  }

  const payload: SessionStatusResponse = {
    authenticated: true,
    emailVerified: Boolean(decodedSession.email_verified),
  };
  return NextResponse.json(payload, { status: 200 });
}

export async function POST(request: NextRequest) {
  if (!isOriginAllowed(request)) {
    return NextResponse.json(
      { code: "cors/origin-not-allowed", error: "Origin non autorisée." },
      { status: 403 }
    );
  }

  const { limited } = isRateLimited(request, "api:auth:session", 20, 5 * 60_000);
  if (limited) {
    return NextResponse.json(
      { code: "rate-limit/exceeded", error: "Trop de requêtes. Réessayez plus tard." },
      { status: 429 }
    );
  }

  try {
    const body = (await request.json()) as SessionRequestBody;
    const idToken = body?.idToken;

    if (typeof idToken !== "string" || !idToken.trim()) {
      return NextResponse.json(
        { code: "auth/invalid-id-token", error: "idToken manquant ou invalide." },
        { status: 400 }
      );
    }

    const sessionCookie = await createServerSessionCookie(idToken.trim());
    const response = NextResponse.json({ success: true }, { status: 200 });

    response.cookies.set({
      name: AUTH_SESSION_COOKIE_NAME,
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    const code = toAuthErrorCode(error);
    const status = code === "auth/admin-not-configured" ? 503 : 401;

    return NextResponse.json(
      { code, error: "Impossible de créer la session serveur." },
      { status }
    );
  }
}
