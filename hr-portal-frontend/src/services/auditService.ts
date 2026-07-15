import apiClient from "./apiClient.js";
import type { PaginatedResponse } from "@/types/index.js";

export interface AuditLog {
  _id: string;
  action: string;
  actorId: string;
  targetId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditListQuery {
  page?: number;
  limit?: number;
}

/**
 * GET /api/audit-logs  [HR only]
 * Returns a paginated list of immutable audit logs.
 */
export const listAuditLogs = async (
  query: AuditListQuery = {},
): Promise<PaginatedResponse<AuditLog>> => {
  const res = await apiClient.get<PaginatedResponse<AuditLog>>("/audit-logs", {
    params: query,
  });
  return res.data;
};
