const API_BASE_URL =
  import.meta.env.VITE_API_URL?.trim() || "http://localhost:3001";

type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  token?: string;
  body?: unknown;
};

type ApiErrorPayload = {
  message?: string;
  code?: string;
};

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const headers = new Headers({
    "Content-Type": "application/json"
  });

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  const payload = isJson
    ? ((await response.json()) as ApiErrorPayload | T)
    : undefined;

  if (!response.ok) {
    const errorPayload = payload as ApiErrorPayload | undefined;
    throw new ApiError(
      response.status,
      errorPayload?.message ?? "No se pudo completar la solicitud",
      errorPayload?.code
    );
  }

  return payload as T;
}
