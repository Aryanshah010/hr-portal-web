import apiClient from "./apiClient.js";
import type {
  ApiResponse,
  ApiMessageResponse,
  PaginatedResponse,
  Employee,
  User,
} from "@/types";

export interface EmployeeListQuery {
  page?: number;
  limit?: number;
  department?: string;
  active?: boolean;
}

export interface ProfileUpdateRequest {
  name?: string;
  jobTitle?: string;
  department?: string;
}

export interface SalaryUpdateRequest {
  baseSalaryNPR: number;
  effectiveDate?: string;
}

export interface RoleChangeRequest {
  role: "Employee" | "HR";
}

export const getMyProfile = async (): Promise<
  ApiResponse<{ profile: Employee }>
> => {
  const res =
    await apiClient.get<ApiResponse<{ profile: Employee }>>("/me/profile");
  return res.data;
};

export const updateMyProfile = async (
  body: ProfileUpdateRequest,
): Promise<ApiResponse<{ profile: Employee }>> => {
  const res = await apiClient.patch<ApiResponse<{ profile: Employee }>>(
    "/me/profile",
    body,
  );
  return res.data;
};

export const deactivateMe = async (): Promise<void> => {
  await apiClient.delete("/me");
};

export const listEmployees = async (
  query: EmployeeListQuery = {},
): Promise<PaginatedResponse<Employee>> => {
  const res = await apiClient.get<PaginatedResponse<Employee>>("/employees", {
    params: query,
  });
  return res.data;
};

export const listPendingEmployees = async (query?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<User>> => {
  const res = await apiClient.get<PaginatedResponse<User>>(
    "/employees/pending",
    { params: query },
  );
  return res.data;
};

export const approveEmployee = async (
  id: string,
): Promise<ApiResponse<{ user: User }>> => {
  const res = await apiClient.post<ApiResponse<{ user: User }>>(
    `/employees/${id}/approve`,
  );
  return res.data;
};

export const deleteEmployee = async (id: string): Promise<void> => {
  await apiClient.delete(`/employees/${id}`);
};

export const reactivateEmployee = async (id: string): Promise<void> => {
  await apiClient.post(`/employees/${id}/reactivate`);
};

export const setMyAvatar = async (
  url: string,
): Promise<ApiResponse<{ mimeType: string; bytes: number }>> => {
  const res = await apiClient.post<
    ApiResponse<{ mimeType: string; bytes: number }>
  >("/me/avatar", { url });
  return res.data;
};

export const myAvatarUrl = (cacheBust?: string | number): string =>
  `${import.meta.env.VITE_API_BASE_URL ?? "/api"}/me/avatar${
    cacheBust ? `?v=${cacheBust}` : ""
  }`;

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const changeMyPassword = async (
  body: ChangePasswordRequest,
): Promise<ApiMessageResponse> => {
  const res = await apiClient.patch<ApiMessageResponse>("/me/password", body);
  return res.data;
};

export const resetEmployeePassword = async (
  id: string,
): Promise<ApiMessageResponse> => {
  const res = await apiClient.post<ApiMessageResponse>(
    `/employees/${id}/reset-password`,
  );
  return res.data;
};

export const updateEmployeeSalary = async (
  id: string,
  body: SalaryUpdateRequest,
): Promise<ApiResponse<{ employee: Employee }>> => {
  const res = await apiClient.patch<ApiResponse<{ employee: Employee }>>(
    `/employees/${id}/salary`,
    body,
  );
  return res.data;
};

export const changeEmployeeRole = async (
  id: string,
  body: RoleChangeRequest,
): Promise<ApiResponse<{ user: User }>> => {
  const res = await apiClient.patch<ApiResponse<{ user: User }>>(
    `/employees/${id}/role`,
    body,
  );
  return res.data;
};

export const listHrUsers = async (): Promise<
  ApiResponse<{ records: User[] }>
> => {
  const res = await apiClient.get<ApiResponse<{ records: User[] }>>("/hr");
  return res.data;
};
