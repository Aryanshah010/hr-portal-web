// ─────────────────────────────────────────────────────────────────────────────
// services/employeeService.ts
// Covers routes in /hr-portal-backend/routes/employeeRoutes.js
//
// Route prefix: /api  (employee routes mount at /api, not /api/employees)
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from "./apiClient.js";
import type { ApiResponse, PaginatedResponse, Employee, User } from "@/types";

// ─── Query / Request shapes ───────────────────────────────────────────────────

export interface EmployeeListQuery {
  page?: number;
  limit?: number;
  department?: string;
  search?: string;
  isActive?: boolean;
}

export interface ProfileUpdateRequest {
  name?: string;
  jobTitle?: string;
  department?: string;
}

export interface SalaryUpdateRequest {
  /** New base salary in NPR. The backend encrypts this before persisting. */
  baseSalaryNPR: number;
  effectiveDate?: string; // ISO 8601
}

export interface RoleChangeRequest {
  role: "Employee" | "HR";
}

// ─── Employee Service ─────────────────────────────────────────────────────────

/**
 * GET /api/me/profile
 * Returns the authenticated employee's own profile.
 * Available to all authenticated users (Employee + HR).
 */
export const getMyProfile = async (): Promise<ApiResponse<{ employee: Employee }>> => {
  const res = await apiClient.get<ApiResponse<{ employee: Employee }>>(
    "/me/profile",
  );
  return res.data;
};

/**
 * PATCH /api/me/profile
 * Updates the authenticated user's own profile (name, jobTitle, department).
 * Requires CSRF token.
 */
export const updateMyProfile = async (
  body: ProfileUpdateRequest,
): Promise<ApiResponse<{ employee: Employee }>> => {
  const res = await apiClient.patch<ApiResponse<{ employee: Employee }>>(
    "/me/profile",
    body,
  );
  return res.data;
};

/**
 * DELETE /api/me
 * Soft-deactivates the authenticated user's own account.
 * Requires CSRF token.
 */
export const deactivateMe = async (): Promise<void> => {
  await apiClient.delete("/me");
};

/**
 * GET /api/employees  [HR only]
 * Returns a paginated list of all employees.
 */
export const listEmployees = async (
  query: EmployeeListQuery = {},
): Promise<PaginatedResponse<Employee>> => {
  const res = await apiClient.get<PaginatedResponse<Employee>>("/employees", {
    params: query,
  });
  return res.data;
};

/**
 * GET /api/employees/pending  [HR only]
 * Returns users with PENDING_APPROVAL status awaiting HR approval.
 */
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

/**
 * POST /api/employees/:id/approve  [HR only]
 * Approves a pending employee, setting their accountStatus to ACTIVE.
 * Requires CSRF token.
 */
export const approveEmployee = async (
  id: string,
): Promise<ApiResponse<{ user: User }>> => {
  const res = await apiClient.post<ApiResponse<{ user: User }>>(
    `/employees/${id}/approve`,
  );
  return res.data;
};

/**
 * PATCH /api/employees/:id/salary  [HR only]
 * Updates an employee's base salary.
 * Requires CSRF token.
 */
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

/**
 * PATCH /api/employees/:id/role  [HR only]
 * Changes an employee's role between Employee and HR.
 * Requires CSRF token.
 */
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

/**
 * GET /api/hr  [HR only]
 * Returns a list of all HR users.
 */
export const listHrUsers = async (): Promise<ApiResponse<{ users: User[] }>> => {
  const res = await apiClient.get<ApiResponse<{ users: User[] }>>("/hr");
  return res.data;
};
