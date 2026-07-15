// ─────────────────────────────────────────────────────────────────────────────
// services/authService.ts
// Covers routes in /hr-portal-backend/routes/authRoutes.js
//
// Route prefix: /api/auth
//
// All session tokens travel as HttpOnly cookies — the service never touches
// or stores tokens in JS; it just drives the multi-step auth flow.
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from "./apiClient.js";
import type {
  ApiResponse,
  ApiMessageResponse,
  MfaChallenge,
  MfaSetupPayload,
  User,
} from "@/types";

// ─── Request shapes ───────────────────────────────────────────────────────────

export interface LoginRequest {
  phone: string;
  password: string;
  captchaAnswer?: string;
}

export interface OtpRequest {
  code: string;
}

export interface PhoneRequest {
  phone: string;
}

export interface RegistrationRequest {
  name: string;
  jobTitle?: string;
  department?: string;
  password: string;
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

/**
 * GET /api/auth/csrf
 * Forces the browser to receive a fresh csrf_token + csrf_secret cookie pair.
 * Called automatically by the apiClient CSRF interceptor; rarely needed directly.
 */
export const fetchCsrfToken = async (): Promise<string> => {
  const res = await apiClient.get<ApiResponse<{ token: string }>>("/auth/csrf");
  return res.data.data.token;
};

/**
 * POST /api/auth/login
 * Step 1 of the password login flow. Returns a nextStep directing the client
 * to the MFA challenge, MFA enrolment, or an error state.
 * The backend sets an mfa_flow cookie for the subsequent TOTP step.
 */
export const login = async (
  body: LoginRequest,
): Promise<ApiResponse<MfaChallenge>> => {
  const res = await apiClient.post<ApiResponse<MfaChallenge>>(
    "/auth/login",
    body,
  );
  return res.data;
};

// ─── MFA ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/auth/mfa/setup
 * Returns the TOTP QR code URL and raw secret for the enrolment screen.
 * Requires a valid mfa_flow cookie (set by login or OAuth callback).
 */
export const getMfaSetup = async (): Promise<ApiResponse<MfaSetupPayload>> => {
  const res =
    await apiClient.get<ApiResponse<MfaSetupPayload>>("/auth/mfa/setup");
  return res.data;
};

/**
 * POST /api/auth/mfa/confirm
 * Confirms TOTP enrolment with the first code from the authenticator app.
 * On success the backend sets access_token + refresh_token cookies and
 * returns the authenticated user object.
 */
export const confirmMfa = async (
  body: OtpRequest,
): Promise<ApiResponse<{ user: User }>> => {
  const res = await apiClient.post<ApiResponse<{ user: User }>>(
    "/auth/mfa/confirm",
    body,
  );
  return res.data;
};

/**
 * POST /api/auth/mfa/verify
 * Verifies a TOTP code during the challenge step of login.
 * On success the backend sets access_token + refresh_token cookies.
 */
export const verifyMfa = async (
  body: OtpRequest,
): Promise<ApiResponse<{ user: User }>> => {
  const res = await apiClient.post<ApiResponse<{ user: User }>>(
    "/auth/mfa/verify",
    body,
  );
  return res.data;
};

/**
 * POST /api/auth/mfa/recovery/send
 * Triggers an SMS recovery code for users without access to their TOTP app.
 */
export const sendMfaRecovery = async (): Promise<ApiMessageResponse> => {
  const res = await apiClient.post<ApiMessageResponse>(
    "/auth/mfa/recovery/send",
  );
  return res.data;
};

/**
 * POST /api/auth/mfa/recovery/verify
 * Verifies the SMS recovery code.
 * On success the backend sets access_token + refresh_token cookies.
 */
export const verifyMfaRecovery = async (
  body: OtpRequest,
): Promise<ApiResponse<{ user: User }>> => {
  const res = await apiClient.post<ApiResponse<{ user: User }>>(
    "/auth/mfa/recovery/verify",
    body,
  );
  return res.data;
};

// ─── Registration ─────────────────────────────────────────────────────────────

/**
 * POST /api/auth/registration/phone/send
 * Sends an SMS OTP to the provided phone number during registration.
 * Requires a valid registration_flow cookie.
 */
export const sendPhoneOtp = async (
  body: PhoneRequest,
): Promise<ApiMessageResponse> => {
  const res = await apiClient.post<ApiMessageResponse>(
    "/auth/registration/phone/send",
    body,
  );
  return res.data;
};

/**
 * POST /api/auth/registration/phone/verify
 * Verifies the SMS OTP during registration.
 */
export const verifyPhoneOtp = async (
  body: OtpRequest,
): Promise<ApiResponse<{ user: Partial<User> }>> => {
  const res = await apiClient.post<ApiResponse<{ user: Partial<User> }>>(
    "/auth/registration/phone/verify",
    body,
  );
  return res.data;
};

/**
 * POST /api/auth/registration/complete
 * Final registration step — submits name, password, and optional profile fields.
 * On success the backend creates the User record in PENDING_APPROVAL status.
 */
export const completeRegistration = async (
  body: RegistrationRequest,
): Promise<ApiResponse<{ user: User }>> => {
  const res = await apiClient.post<ApiResponse<{ user: User }>>(
    "/auth/registration/complete",
    body,
  );
  return res.data;
};

// ─── Session management ───────────────────────────────────────────────────────

/**
 * POST /api/auth/refresh
 * Silently rotates the access token using the HttpOnly refresh_token cookie.
 * Called automatically by the 401 interceptor in apiClient.ts.
 */
export const refresh = async (): Promise<ApiResponse<{ user: User }>> => {
  const res =
    await apiClient.post<ApiResponse<{ user: User }>>("/auth/refresh");
  return res.data;
};

/**
 * POST /api/auth/logout
 * Invalidates the server-side session and clears all auth cookies.
 * Requires protect middleware (valid access_token cookie).
 */
export const logout = async (): Promise<void> => {
  await apiClient.post("/auth/logout");
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's full profile.
 * Used by AuthContext on mount to rehydrate session state.
 */
export const getMe = async (): Promise<ApiResponse<{ user: User }>> => {
  const res = await apiClient.get<ApiResponse<{ user: User }>>("/auth/me");
  return res.data;
};

// ─── OAuth ────────────────────────────────────────────────────────────────────

/**
 * Redirects the browser to the Google OAuth authorisation page.
 * This is a full-page redirect, not an API call — the backend handles the
 * state parameter and callback via /api/auth/oauth/google and /api/auth/oauth/callback.
 */
export const startGoogleOAuth = (apiBase = BASE_URL): void => {
  window.location.href = `${apiBase}/auth/oauth/google`;
};

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";
