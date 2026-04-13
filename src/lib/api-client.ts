export interface ApiClientError extends Error {
  status?: number;
  code?: string;
}

async function extractError(response: Response): Promise<ApiClientError> {
  let message = `Requête API échouée (${response.status}).`;
  let code = "api/request-failed";

  try {
    const payload = (await response.json()) as { error?: unknown; code?: unknown };
    if (typeof payload.error === "string" && payload.error.trim()) {
      message = payload.error;
    }
    if (typeof payload.code === "string" && payload.code.trim()) {
      code = payload.code;
    }
  } catch {
    // Ignore malformed JSON errors.
  }

  const error = new Error(message) as ApiClientError;
  error.status = response.status;
  error.code = code;
  return error;
}

export async function apiRequest<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw await extractError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
