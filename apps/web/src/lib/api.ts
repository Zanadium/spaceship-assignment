import type {
  AnswerEnvelope,
  DashboardData,
  FilterMeta,
} from "@spaceship/shared";

// VITE_API_URL is the API base INCLUDING the /api prefix, e.g.
// "http://localhost:3000/api" locally or "https://api.example.com/api" in prod.
const BASE = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "");
const TOKEN_KEY = "spaceship_token";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string): void => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (res.status === 401) {
    clearToken();
    throw new ApiError("Session expired — please sign in again.", 401);
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(message, res.status);
  }
  return (await res.json()) as T;
}

export async function login(
  username: string,
  password: string,
): Promise<void> {
  const { accessToken } = await request<{ accessToken: string }>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ username, password }) },
  );
  setToken(accessToken);
}

export function getDashboard(params?: {
  dateFrom?: string;
  dateTo?: string;
}): Promise<DashboardData> {
  const q = new URLSearchParams(
    Object.entries(params ?? {}).filter(([, v]) => Boolean(v)) as [
      string,
      string,
    ][],
  ).toString();
  return request<DashboardData>(`/analytics/dashboard${q ? `?${q}` : ""}`);
}

export const getMeta = (): Promise<FilterMeta> =>
  request<FilterMeta>("/analytics/meta");

export const ask = (question: string): Promise<AnswerEnvelope> =>
  request<AnswerEnvelope>("/ask", {
    method: "POST",
    body: JSON.stringify({ question }),
  });
