import apiClient from "./apiClient.js";
import type { ApiResponse, PaginatedResponse, Employee, User } from "@/types";

// Mirrors the server's strict query schema: unknown keys are rejected, and the
// active flag is named `active` (not `isActive`).
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

/** `id` is the User id, matching the role-change and delete endpoints. */
export const reactivateEmployee = async (id: string): Promise<void> => {
  await apiClient.post(`/employees/${id}/reactivate`);
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

// The API returns this list under `records`, not `users`.
export const listHrUsers = async (): Promise<
  ApiResponse<{ records: User[] }>
> => {
  const res = await apiClient.get<ApiResponse<{ records: User[] }>>("/hr");
  return res.data;
};
