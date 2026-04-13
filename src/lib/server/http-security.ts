import "server-only";

import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/server/rate-limit";

function normalizeOrigin(origin: string) {
  try {
    const parsed = new URL(origin);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return "";
  }
}

function getAllowedOrigins(): string[] {
  const envValue = process.env.ALLOWED_ORIGINS?.trim();
  if (!envValue) {
    return [];
  }

  return envValue
    .split(",")
    .map((item) => normalizeOrigin(item.trim()))
    .filter(Boolean);
}

export function isOriginAllowed(request: NextRequest) {
  const originHeader = request.headers.get("origin");
  if (!originHeader) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(originHeader);
  if (!normalizedOrigin) {
    return false;
  }

  const defaultOrigin = normalizeOrigin(request.nextUrl.origin);
  const allowedOrigins = new Set<string>([defaultOrigin, ...getAllowedOrigins()]);
  return allowedOrigins.has(normalizedOrigin);
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

export function isRateLimited(
  request: NextRequest,
  routeKey: string,
  maxRequests: number,
  windowMs: number
) {
  const ip = getClientIp(request);
  const result = checkRateLimit({
    key: `${routeKey}:${ip}`,
    maxRequests,
    windowMs,
  });

  return {
    limited: !result.allowed,
    remaining: result.remaining,
    resetAt: result.resetAt,
  };
}
