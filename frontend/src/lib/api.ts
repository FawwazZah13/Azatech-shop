const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";
const TOKEN_KEY = "azatech_token";

export const tokenStorage = {
  get: (): string | null =>
    typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export type ApiMeta = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export type ApiResult<T> = {
  data: T;
  meta?: ApiMeta;
  message: string;
};

export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]>;

  constructor(message: string, status: number, errors: Record<string, string[]> = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
};

export async function api<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const { method = "GET", body, query } = options;

  const url = new URL(`${API_URL}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const token = tokenStorage.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) {
    return { data: null as T, message: "OK" };
  }

  const json = await res.json().catch(() => null);

  if (!res.ok || json?.success === false) {
    if (res.status === 401 && path !== "/auth/login") {
      tokenStorage.clear();
      if (typeof window !== "undefined") window.location.href = "/login";
    }
    throw new ApiError(json?.message ?? "Terjadi kesalahan", res.status, json?.errors ?? {});
  }

  return { data: json.data as T, meta: json.meta, message: json.message };
}