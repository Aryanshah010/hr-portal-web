import apiClient from "./apiClient.js";
import type {
  ApiResponse,
  ApiMessageResponse,
  MfaChallenge,
  MfaSetupPayload,
  User,
} from "@/types";

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

export const fetchCsrfToken = async (): Promise<string> => {
  const res = await apiClient.get<ApiResponse<{ token: string }>>("/auth/csrf");
  return res.data.data.token;
};

export const login = async (
  body: LoginRequest,
): Promise<ApiResponse<MfaChallenge>> => {
  const res = await apiClient.post<ApiResponse<MfaChallenge>>(
    "/auth/login",
    body,
  );
  return res.data;
};

export const getMfaSetup = async (): Promise<ApiResponse<MfaSetupPayload>> => {
  const res =
    await apiClient.get<ApiResponse<MfaSetupPayload>>("/auth/mfa/setup");
  return res.data;
};

export const confirmMfa = async (
  body: OtpRequest,
): Promise<ApiResponse<{ user: User }>> => {
  const res = await apiClient.post<ApiResponse<{ user: User }>>(
    "/auth/mfa/confirm",
    body,
  );
  return res.data;
};

export const verifyMfa = async (
  body: OtpRequest,
): Promise<ApiResponse<{ user: User }>> => {
  const res = await apiClient.post<ApiResponse<{ user: User }>>(
    "/auth/mfa/verify",
    body,
  );
  return res.data;
};

export const sendMfaRecovery = async (): Promise<ApiMessageResponse> => {
  const res = await apiClient.post<ApiMessageResponse>(
    "/auth/mfa/recovery/send",
  );
  return res.data;
};

export const verifyMfaRecovery = async (
  body: OtpRequest,
): Promise<ApiResponse<{ user: User }>> => {
  const res = await apiClient.post<ApiResponse<{ user: User }>>(
    "/auth/mfa/recovery/verify",
    body,
  );
  return res.data;
};

export const sendPhoneOtp = async (
  body: PhoneRequest,
): Promise<ApiMessageResponse> => {
  const res = await apiClient.post<ApiMessageResponse>(
    "/auth/registration/phone/send",
    body,
  );
  return res.data;
};

export const verifyPhoneOtp = async (
  body: OtpRequest,
): Promise<ApiResponse<{ user: Partial<User> }>> => {
  const res = await apiClient.post<ApiResponse<{ user: Partial<User> }>>(
    "/auth/registration/phone/verify",
    body,
  );
  return res.data;
};

export const completeRegistration = async (
  body: RegistrationRequest,
): Promise<ApiResponse<{ user: User }>> => {
  const res = await apiClient.post<ApiResponse<{ user: User }>>(
    "/auth/registration/complete",
    body,
  );
  return res.data;
};

export const refresh = async (): Promise<ApiResponse<{ user: User }>> => {
  const res =
    await apiClient.post<ApiResponse<{ user: User }>>("/auth/refresh");
  return res.data;
};

export const logout = async (): Promise<void> => {
  await apiClient.post("/auth/logout");
};

export const getMe = async (): Promise<ApiResponse<{ user: User }>> => {
  const res = await apiClient.get<ApiResponse<{ user: User }>>("/auth/me");
  return res.data;
};

export const startGoogleOAuth = (apiBase = BASE_URL): void => {
  window.location.href = `${apiBase}/auth/oauth/google`;
};

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";
