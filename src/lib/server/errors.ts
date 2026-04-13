export class ValidationError extends Error {
  code: string;

  constructor(message: string, code = "validation/invalid-input") {
    super(message);
    this.name = "ValidationError";
    this.code = code;
  }
}

export class UnauthorizedError extends Error {
  code: string;

  constructor(message = "Non autorisé.", code = "auth/unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
    this.code = code;
  }
}

export class ForbiddenError extends Error {
  code: string;

  constructor(message = "Accès interdit.", code = "auth/forbidden") {
    super(message);
    this.name = "ForbiddenError";
    this.code = code;
  }
}

export function getErrorCode(error: unknown, fallback = "unknown/error") {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }

  return fallback;
}
