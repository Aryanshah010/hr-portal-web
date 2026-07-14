// ─────────────────────────────────────────────────────────────────────────────
// services/payrollService.ts
// Covers routes in /hr-portal-backend/routes/payrollRoutes.js
//
// Route prefix: /api/payroll
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from "./apiClient.js";
import type {
  ApiResponse,
  PaginatedResponse,
  PayrollRun,
  Payslip,
} from "@/types";

// ─── Query / Request shapes ───────────────────────────────────────────────────

export interface PayrollRunCreateRequest {
  period: string; // "YYYY-MM"
}

export interface PayrollListQuery {
  page?: number;
  limit?: number;
  status?: PayrollRun["status"];
}

// ─── Payroll Service ──────────────────────────────────────────────────────────

/**
 * POST /api/payroll/runs  [HR only]
 * Creates a new payroll run for a given period (e.g. "2025-06").
 * Requires CSRF token. Returns the newly created PayrollRun in DRAFT status.
 */
export const createPayrollRun = async (
  body: PayrollRunCreateRequest,
): Promise<ApiResponse<{ run: PayrollRun }>> => {
  const res = await apiClient.post<ApiResponse<{ run: PayrollRun }>>(
    "/payroll/runs",
    body,
  );
  return res.data;
};

/**
 * GET /api/payroll/runs  [HR only]
 * Returns a paginated list of payroll runs, optionally filtered by status.
 */
export const listPayrollRuns = async (
  query: PayrollListQuery = {},
): Promise<PaginatedResponse<PayrollRun>> => {
  const res = await apiClient.get<PaginatedResponse<PayrollRun>>(
    "/payroll/runs",
    { params: query },
  );
  return res.data;
};

/**
 * GET /api/payroll/runs/:id  [HR only]
 * Returns a single payroll run by ID.
 */
export const getPayrollRun = async (
  id: string,
): Promise<ApiResponse<{ run: PayrollRun }>> => {
  const res = await apiClient.get<ApiResponse<{ run: PayrollRun }>>(
    `/payroll/runs/${id}`,
  );
  return res.data;
};

/**
 * POST /api/payroll/runs/:id/submit  [HR only]
 * Advances a DRAFT run to PENDING_APPROVAL.
 * Requires CSRF token.
 */
export const submitPayrollRun = async (
  id: string,
): Promise<ApiResponse<{ run: PayrollRun }>> => {
  const res = await apiClient.post<ApiResponse<{ run: PayrollRun }>>(
    `/payroll/runs/${id}/submit`,
    {},
  );
  return res.data;
};

/**
 * POST /api/payroll/runs/:id/approve  [HR only]
 * Approves a PENDING_APPROVAL run, moving it to APPROVED.
 * Requires CSRF token.
 */
export const approvePayrollRun = async (
  id: string,
): Promise<ApiResponse<{ run: PayrollRun }>> => {
  const res = await apiClient.post<ApiResponse<{ run: PayrollRun }>>(
    `/payroll/runs/${id}/approve`,
    {},
  );
  return res.data;
};

/**
 * POST /api/payroll/runs/:id/execute  [HR only]
 * Triggers execution of an APPROVED payroll run (salary disbursement).
 * Requires CSRF token. Rate-limited server-side.
 */
export const executePayrollRun = async (
  id: string,
): Promise<ApiResponse<{ run: PayrollRun }>> => {
  const res = await apiClient.post<ApiResponse<{ run: PayrollRun }>>(
    `/payroll/runs/${id}/execute`,
    {},
  );
  return res.data;
};

/**
 * GET /api/payroll/runs/:runId/payslips/:employeeId  [Employee + HR]
 * Returns the payslip for a specific employee within a payroll run.
 * Employees can only access their own payslip; HR can access any.
 * Rate-limited server-side.
 */
export const getPayslip = async (
  runId: string,
  employeeId: string,
): Promise<ApiResponse<{ payslip: Payslip }>> => {
  const res = await apiClient.get<ApiResponse<{ payslip: Payslip }>>(
    `/payroll/runs/${runId}/payslips/${employeeId}`,
  );
  return res.data;
};
