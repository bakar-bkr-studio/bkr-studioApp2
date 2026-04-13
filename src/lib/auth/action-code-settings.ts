import type { ActionCodeSettings } from "firebase/auth";

function toSafeOrigin(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const withProtocol = trimmed.startsWith("http://") || trimmed.startsWith("https://")
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    return url.origin;
  } catch {
    return null;
  }
}

export function getAppOriginForAuthActions(): string | null {
  const explicitAppUrl = toSafeOrigin(process.env.NEXT_PUBLIC_APP_URL);
  if (explicitAppUrl) {
    return explicitAppUrl;
  }

  const vercelAppUrl = toSafeOrigin(process.env.NEXT_PUBLIC_VERCEL_URL);
  if (vercelAppUrl) {
    return vercelAppUrl;
  }

  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  return null;
}

function createActionCodeSettings(pathname: string): ActionCodeSettings | undefined {
  const origin = getAppOriginForAuthActions();

  if (!origin) {
    return undefined;
  }

  const targetUrl = new URL(pathname.startsWith("/") ? pathname : `/${pathname}`, origin);

  return {
    url: targetUrl.toString(),
    handleCodeInApp: false,
  };
}

export function getPasswordResetActionCodeSettings() {
  return createActionCodeSettings("/login");
}

export function getEmailVerificationActionCodeSettings() {
  return createActionCodeSettings("/verify-email");
}
