import apiClient from "./apiClient.js";
import type { PaginatedResponse } from "@/types/index.js";

export interface AuditLog {
  _id: string;
  eventType: string;
  actorId: string;
  targetResource?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface AuditListQuery {
  page?: number;
  limit?: number;
}

export const listAuditLogs = async (
  query: AuditListQuery = {},
): Promise<PaginatedResponse<AuditLog>> => {
  const res = await apiClient.get<PaginatedResponse<AuditLog>>("/audit-logs", {
    params: query,
  });
  return res.data;
};
