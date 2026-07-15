import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ApiError } from "@/types";

const getCookie = (name: string): string => {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : "";
};

const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

let csrfRefreshPromise: Promise<void> | null = null;

const ensureCsrfToken = (): Promise<void> => {
  if (getCookie("csrf_token")) return Promise.resolve();
  if (csrfRefreshPromise) return csrfRefreshPromise;

  csrfRefreshPromise = apiClient
    .get<{ status: string; data: { token: string } }>("/auth/csrf")
    .then(() => {})
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

let isRefreshing = false;
let refreshQueue: Array<(ok: boolean) => void> = [];

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

    if (
      response.status === 401 &&
      config &&
      !(config as InternalAxiosRequestConfig & { _retry?: boolean })._retry
    ) {
      (config as InternalAxiosRequestConfig & { _retry?: boolean })._retry =
        true;

      if (isRefreshing) {
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
        await apiClient.post("/auth/refresh");
        isRefreshing = false;
        drainQueue(true);
        return apiClient(config);
      } catch {
        isRefreshing = false;
        drainQueue(false);
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
