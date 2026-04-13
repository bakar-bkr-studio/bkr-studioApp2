export const AUTH_SESSION_COOKIE_NAME = "__session";

export const AUTH_SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const AUTH_SESSION_MAX_AGE_SECONDS = Math.floor(
  AUTH_SESSION_DURATION_MS / 1000
);
