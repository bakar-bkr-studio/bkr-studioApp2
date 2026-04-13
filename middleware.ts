import { NextResponse, type NextRequest } from "next/server";
import { AUTH_SESSION_COOKIE_NAME } from "@/lib/auth/session-constants";

const PRIVATE_ROUTE_PREFIXES = [
  "/onboarding",
  "/dashboard",
  "/contacts",
  "/projects",
  "/tasks",
  "/goals",
  "/finances",
  "/profile",
  "/settings",
] as const;

function isPrivateRoute(pathname: string) {
  return PRIVATE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const hasSessionCookie = Boolean(request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value);

  if (isPrivateRoute(pathname) && !hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    const redirectPath = `${pathname}${search}`;
    loginUrl.searchParams.set("next", redirectPath);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
