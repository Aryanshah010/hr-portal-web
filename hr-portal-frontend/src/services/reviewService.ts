// ─────────────────────────────────────────────────────────────────────────────
// services/reviewService.ts
// Covers routes in /hr-portal-backend/routes/reviewRoutes.js
//
// Route prefix: /api/reviews
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from "./apiClient.js";
import type { ApiResponse, PerformanceReview } from "@/types";

// ─── Request shapes ───────────────────────────────────────────────────────────

export interface CreateReviewRequest {
  employeeId: string;
  period: string; // "YYYY-MM"
  rating: number; // 1–5 (validated server-side)
  comment: string; // plaintext; backend encrypts before persisting
}

// ─── Review Service ───────────────────────────────────────────────────────────

/**
 * GET /api/reviews/mine
 * Returns all performance reviews for the authenticated employee.
 * Available to all authenticated users (employees see their own, HR sees their own).
 */
export const getMyReviews = async (): Promise<ApiResponse<{ reviews: PerformanceReview[] }>> => {
  const res = await apiClient.get<ApiResponse<{ reviews: PerformanceReview[] }>>(
    "/reviews/mine",
  );
  return res.data;
};

/**
 * POST /api/reviews  [HR only]
 * Creates or upserts a performance review for an employee for a given period.
 * The backend encrypts the comment before persisting.
 * Requires CSRF token.
 */
export const createReview = async (
  body: CreateReviewRequest,
): Promise<ApiResponse<{ review: PerformanceReview }>> => {
  const res = await apiClient.post<ApiResponse<{ review: PerformanceReview }>>(
    "/reviews",
    body,
  );
  return res.data;
};
