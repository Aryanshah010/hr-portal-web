// ─────────────────────────────────────────────────────────────────────────────
// services/apiClient.ts
//
// Axios instance shared by all service modules.
//
// Security design (mirrors the backend's expectations):
//  • withCredentials: true  — sends HttpOnly access_token + refresh_token cookies
//    automatically on every request (same-site strict).
//  • CSRF interceptor        — before every state-mutating request (POST/PUT/PATCH/DELETE)
//    we read the `csrf_token` cookie (httpOnly: false on the backend) and attach
//    it as the `x-csrf-token` request header. The backend's csrfProtection
//    middleware validates this against the `csrf_secret` HttpOnly cookie.
//  • 401 interceptor         — attempts a silent token refresh via /auth/refresh;
//    if that also fails the user is redirected to /login.
//  • Error normalizer        — converts every non-2xx response to a typed ApiError
//    so pages never have to parse raw Axios error objects or show stack traces.
// ─────────────────────────────────────────────────────────────────────────────

import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ApiError } from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Read a named cookie value from document.cookie (returns "" if absent). */
const getCookie = (name: string): string => {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : "";
};

/** HTTP verbs that require CSRF protection (backend skips GET/HEAD/OPTIONS). */
const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);

// ─── Axios instance ───────────────────────────────────────────────────────────

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // sends HttpOnly session cookies on every request
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ─── Request interceptor — Anti-CSRF token injection ────────────────────────
//
// The backend issues csrf_token as a non-HttpOnly cookie (readable by JS)
// and csrf_secret as an HttpOnly cookie (not readable by JS).
// We read csrf_token and send it as x-csrf-token header.
// The backend re-derives the HMAC from csrf_secret and compares — this is the
// Double-Submit Cookie / Signed-CSRF pattern the backend implements.
//
// If the cookie is missing (first visit or cleared) we call /auth/csrf to
// get a fresh token pair before retrying.
// ─────────────────────────────────────────────────────────────────────────────

let csrfRefreshPromise: Promise<void> | null = null;

/** Lazily fetches a fresh CSRF token pair. Coalesces concurrent callers. */
const ensureCsrfToken = (): Promise<void> => {
  if (getCookie("csrf_token")) return Promise.resolve();
  if (csrfRefreshPromise) return csrfRefreshPromise;

  csrfRefreshPromise = apiClient
    .get<{ status: string; data: { token: string } }>("/auth/csrf")
    .then(() => {
      // The GET /auth/csrf endpoint sets both csrf_secret (HttpOnly) and
      // csrf_token (non-HttpOnly) cookies via Set-Cookie headers.
      // We don't need to do anything with the response body; the cookies
      // are set automatically by the browser.
    })
    .finally(() => {
      csrfRefreshPromise = null;
    });

  return csrfRefreshPromise;
};

apiClient.interceptors.request.use(
  async (
    config: InternalAxiosRequestConfig,
  ): Promise<InternalAxiosRequestConfig> => {
    const method = (config.method ?? "get").toLowerCase();

    if (MUTATING_METHODS.has(method)) {
      // Ensure we have a CSRF token cookie before attaching the header.
      await ensureCsrfToken();
      const token = getCookie("csrf_token");
      if (token) {
        config.headers.set("x-csrf-token", token);
      }
    }

    return config;
  },
  (error: unknown) => Promise.reject(normalizeError(error)),
);

// ─── Response interceptor — 401 silent refresh + error normalization ─────────

/** Tracks whether a token refresh is already in flight to avoid loops. */
let isRefreshing = false;
/** Queue of callbacks waiting for the refresh to complete. */
let refreshQueue: Array<(ok: boolean) => void> = [];

/** Drain the queue, telling all waiting requests whether to retry. */
const drainQueue = (ok: boolean) => {
  refreshQueue.forEach((cb) => cb(ok));
  refreshQueue = [];
};

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,

  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.response) {
      return Promise.reject(normalizeError(error));
    }

    const { response, config } = error;

    // ── 401 handling: attempt silent token refresh ──────────────────────────
    if (
      response.status === 401 &&
      config &&
      !(config as InternalAxiosRequestConfig & { _retry?: boolean })._retry
    ) {
      // Mark so we don't recurse infinitely.
      (config as InternalAxiosRequestConfig & { _retry?: boolean })._retry =
        true;

      if (isRefreshing) {
        // Another request already kicked off a refresh — queue this one.
        return new Promise<AxiosResponse>((resolve, reject) => {
          refreshQueue.push((ok: boolean) => {
            if (ok) resolve(apiClient(config));
            else
              reject(
                buildApiError(
                  401,
                  "fail",
                  "Session expired. Please log in again.",
                ),
              );
          });
        });
      }

      isRefreshing = true;

      try {
        // The refresh endpoint uses the HttpOnly refresh_token cookie.
        await apiClient.post("/auth/refresh");
        isRefreshing = false;
        drainQueue(true);
        // Retry the original request.
        return apiClient(config);
      } catch {
        isRefreshing = false;
        drainQueue(false);
        // Refresh failed — redirect to login.
        window.location.href = "/login";
        const redirected: ApiError = {
          statusCode: 401,
          status: "fail",
          message: "Session expired. Please log in again.",
          redirected: true,
        };
        return Promise.reject(redirected);
      }
    }

    return Promise.reject(normalizeError(error));
  },
);

// ─── Error normalizer ─────────────────────────────────────────────────────────

/**
 * Converts any thrown value into a typed ApiError so consumers
 * never have to inspect raw Axios internals or render stack traces.
 */
export function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const body = error.response?.data as
      | { status?: string; message?: string }
      | undefined;

    return buildApiError(
      status,
      status >= 500 ? "error" : "fail",
      body?.message ??
        error.message ??
        "An unexpected error occurred. Please try again.",
    );
  }

  if (error instanceof Error) {
    return buildApiError(0, "error", error.message);
  }

  return buildApiError(0, "error", "An unknown error occurred.");
}

function buildApiError(
  statusCode: number,
  status: ApiError["status"],
  message: string,
): ApiError {
  return { statusCode, status, message };
}

export default apiClient;
