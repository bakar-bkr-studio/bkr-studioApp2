import "server-only";

import { NextResponse } from "next/server";
import { getErrorCode } from "@/lib/server/errors";

export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(
  message: string,
  status: number,
  code = "request/failed"
) {
  return NextResponse.json(
    {
      error: message,
      code,
    },
    { status }
  );
}

export function jsonErrorFromUnknown(
  error: unknown,
  options?: {
    fallbackMessage?: string;
    fallbackStatus?: number;
    fallbackCode?: string;
  }
) {
  const fallbackMessage = options?.fallbackMessage ?? "Erreur inattendue.";
  const fallbackStatus = options?.fallbackStatus ?? 500;
  const fallbackCode = options?.fallbackCode ?? "request/unexpected";
  const code = getErrorCode(error, fallbackCode);

  const message =
    error instanceof Error && error.message ? error.message : fallbackMessage;

  return jsonError(message, fallbackStatus, code);
}
