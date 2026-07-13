// ─────────────────────────────────────────────────────────────────────────────
// services/dashboardService.ts
// Covers routes in /hr-portal-backend/routes/dashboardRoutes.js
//
// Route prefix: /api/dashboard  [HR only]
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from "./apiClient.js";
import type { ApiResponse } from "@/types";

// ─── Response shape ───────────────────────────────────────────────────────────

/**
 * Aggregated statistics returned by GET /api/dashboard.
 * The exact fields depend on the dashboardController implementation.
 * Typed conservatively as a flexible record; tighten once the controller
 * response shape is finalised.
 */
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
  [key: string]: unknown; // allow future additions without breaking the type
}

// ─── Dashboard Service ────────────────────────────────────────────────────────

/**
 * GET /api/dashboard  [HR only]
 * Returns aggregated HR dashboard statistics.
 */
export const getDashboardStats = async (): Promise<ApiResponse<DashboardStats>> => {
  const res = await apiClient.get<ApiResponse<DashboardStats>>("/dashboard");
  return res.data;
};
