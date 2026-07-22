import apiClient from "./apiClient.js";
import type { ApiResponse, PaginatedResponse, Attendance } from "@/types";

export interface SubmitAttendanceRequest {
  recordType: "ATTENDANCE" | "LEAVE";
  attendanceDate: string; 
  checkInAt?: string | null;
  checkOutAt?: string | null;
  leaveType?: "ANNUAL" | "SICK" | "UNPAID" | "OTHER" | null;
  reason?: string;
}

export interface DecideAttendanceRequest {
  status: "APPROVED" | "REJECTED";
  decisionComment?: string;
}

export interface AttendanceListQuery {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  status?: Attendance["status"];
}

export const submitAttendance = async (
  body: SubmitAttendanceRequest,
): Promise<ApiResponse<{ attendance: Attendance }>> => {
  const res = await apiClient.post<ApiResponse<{ attendance: Attendance }>>(
    "/attendance",
    body,
  );
  return res.data;
};

export const getMyAttendance = async (
  query: AttendanceListQuery = {},
): Promise<PaginatedResponse<Attendance>> => {
  const res = await apiClient.get<PaginatedResponse<Attendance>>(
    "/attendance/mine",
    { params: query },
  );
  return res.data;
};

export const getAttendanceApprovalQueue = async (
  query: AttendanceListQuery = {},
): Promise<PaginatedResponse<Attendance>> => {
  const res = await apiClient.get<PaginatedResponse<Attendance>>(
    "/attendance/approvals",
    { params: query },
  );
  return res.data;
};

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
