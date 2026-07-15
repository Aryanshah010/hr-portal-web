import apiClient from "./apiClient.js";
import type {
  ApiResponse,
  PaginatedResponse,
  PayrollRun,
  Payslip,
} from "@/types";

export interface PayrollRunCreateRequest {
  period: string;
}

export interface PayrollListQuery {
  page?: number;
  limit?: number;
  status?: PayrollRun["status"];
}

export const createPayrollRun = async (
  body: PayrollRunCreateRequest,
): Promise<ApiResponse<{ run: PayrollRun }>> => {
  const res = await apiClient.post<ApiResponse<{ run: PayrollRun }>>(
    "/payroll/runs",
    body,
  );
  return res.data;
};

export const listPayrollRuns = async (
  query: PayrollListQuery = {},
): Promise<PaginatedResponse<PayrollRun>> => {
  const res = await apiClient.get<PaginatedResponse<PayrollRun>>(
    "/payroll/runs",
    { params: query },
  );
  return res.data;
};

export const getPayrollRun = async (
  id: string,
): Promise<ApiResponse<{ run: PayrollRun }>> => {
  const res = await apiClient.get<ApiResponse<{ run: PayrollRun }>>(
    `/payroll/runs/${id}`,
  );
  return res.data;
};

export const submitPayrollRun = async (
  id: string,
): Promise<ApiResponse<{ run: PayrollRun }>> => {
  const res = await apiClient.post<ApiResponse<{ run: PayrollRun }>>(
    `/payroll/runs/${id}/submit`,
    {},
  );
  return res.data;
};

export const approvePayrollRun = async (
  id: string,
): Promise<ApiResponse<{ run: PayrollRun }>> => {
  const res = await apiClient.post<ApiResponse<{ run: PayrollRun }>>(
    `/payroll/runs/${id}/approve`,
    {},
  );
  return res.data;
};

export const executePayrollRun = async (
  id: string,
): Promise<ApiResponse<{ run: PayrollRun }>> => {
  const res = await apiClient.post<ApiResponse<{ run: PayrollRun }>>(
    `/payroll/runs/${id}/execute`,
    {},
  );
  return res.data;
};

export const getPayslip = async (
  runId: string,
  employeeId: string,
): Promise<ApiResponse<{ payslip: Payslip }>> => {
  const res = await apiClient.get<ApiResponse<{ payslip: Payslip }>>(
    `/payroll/runs/${runId}/payslips/${employeeId}`,
  );
  return res.data;
};
