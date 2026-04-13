export const PUBLIC_ROUTES = ["/", "/login", "/signup"] as const;

export const AUTH_ROUTES = ["/login", "/signup"] as const;

export const PRIVATE_ROUTE_PREFIXES = [
  "/dashboard",
  "/contacts",
  "/projects",
  "/tasks",
  "/goals",
  "/finances",
  "/profile",
  "/settings",
] as const;

export type RouteScope = "public" | "private";
export const AUTHENTICATED_HOME_ROUTE = "/dashboard";
export const PUBLIC_HOME_ROUTE = "/";

function normalizePathname(pathname: string) {
  if (!pathname) {
    return "/";
  }

  if (pathname === "/") {
    return pathname;
  }

  return pathname.replace(/\/+$/, "");
}

export function getRouteScope(pathname: string): RouteScope {
  const normalizedPathname = normalizePathname(pathname);

  if (PUBLIC_ROUTES.includes(normalizedPathname as (typeof PUBLIC_ROUTES)[number])) {
    return "public";
  }

  if (
    PRIVATE_ROUTE_PREFIXES.some(
      (prefix) =>
        normalizedPathname === prefix || normalizedPathname.startsWith(`${prefix}/`)
    )
  ) {
    return "private";
  }

  // Par défaut on considère les routes non listées comme publiques.
  return "public";
}
