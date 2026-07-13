// ─────────────────────────────────────────────────────────────────────────────
// services/attendanceService.ts
// Covers routes in /hr-portal-backend/routes/attendanceRoutes.js
//
// Route prefix: /api/attendance
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from "./apiClient.js";
import type { ApiResponse, PaginatedResponse, Attendance } from "@/types";

// ─── Request / Query shapes ───────────────────────────────────────────────────

export interface SubmitAttendanceRequest {
  recordType: "ATTENDANCE" | "LEAVE";
  attendanceDate: string; // ISO 8601 date string "YYYY-MM-DD"
  checkInAt?: string | null; // ISO 8601 datetime (ATTENDANCE records)
  checkOutAt?: string | null;
  leaveType?: "ANNUAL" | "SICK" | "UNPAID" | "OTHER" | null;
  reason?: string; // plaintext; backend encrypts before persisting
}

export interface DecideAttendanceRequest {
  status: "APPROVED" | "REJECTED";
  decisionComment?: string; // plaintext; backend encrypts before persisting
}

export interface AttendanceListQuery {
  page?: number;
  limit?: number;
  /** ISO 8601 date — filter records from this date */
  from?: string;
  /** ISO 8601 date — filter records up to this date */
  to?: string;
  status?: Attendance["status"];
}

// ─── Attendance Service ────────────────────────────────────────────────────────

/**
 * POST /api/attendance  [Employee only]
 * Submits a new attendance or leave request.
 * Requires CSRF token. Rate-limited server-side.
 */
export const submitAttendance = async (
  body: SubmitAttendanceRequest,
): Promise<ApiResponse<{ attendance: Attendance }>> => {
  const res = await apiClient.post<ApiResponse<{ attendance: Attendance }>>(
    "/attendance",
    body,
  );
  return res.data;
};

/**
 * GET /api/attendance/mine  [Employee only]
 * Returns the authenticated employee's own attendance records,
 * paginated and optionally filtered by date range or status.
 */
export const getMyAttendance = async (
  query: AttendanceListQuery = {},
): Promise<PaginatedResponse<Attendance>> => {
  const res = await apiClient.get<PaginatedResponse<Attendance>>(
    "/attendance/mine",
    { params: query },
  );
  return res.data;
};

/**
 * GET /api/attendance/approvals  [HR only]
 * Returns the pending attendance/leave request approval queue.
 */
export const getAttendanceApprovalQueue = async (
  query: AttendanceListQuery = {},
): Promise<PaginatedResponse<Attendance>> => {
  const res = await apiClient.get<PaginatedResponse<Attendance>>(
    "/attendance/approvals",
    { params: query },
  );
  return res.data;
};

/**
 * PATCH /api/attendance/:id/decision  [HR only]
 * Approves or rejects a pending attendance/leave request.
 * Requires CSRF token. Rate-limited server-side.
 */
export const decideAttendance = async (
  id: string,
  body: DecideAttendanceRequest,
): Promise<ApiResponse<{ attendance: Attendance }>> => {
  const res = await apiClient.patch<ApiResponse<{ attendance: Attendance }>>(
    `/attendance/${id}/decision`,
    body,
  );
  return res.data;
};
