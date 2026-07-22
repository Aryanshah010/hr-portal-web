import apiClient from "./apiClient.js";
import type { ApiResponse } from "@/types";

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  pendingApprovals: number;
  pendingAttendanceRequests: number;
  pendingDocuments: number;
  latestPayrollRun: {
    period: string;
    status: string;
    netNPR: number;
  } | null;
  [key: string]: unknown;
}

export const getDashboardStats = async (): Promise<
  ApiResponse<DashboardStats>
> => {
  const res = await apiClient.get<ApiResponse<DashboardStats>>("/dashboard");
  return res.data;
};
