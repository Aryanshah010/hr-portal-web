import apiClient from "./apiClient.js";
import type {
  ApiResponse,
  PaginatedResponse,
  PerformanceReview,
} from "@/types/index.js";

export interface CreateReviewRequest {
  employeeId: string;
  period: string;
  rating: number;
  comment: string;
}

export interface ReviewListQuery {
  page?: number;
  limit?: number;
}

export const getMyReviews = async (): Promise<
  ApiResponse<{ reviews: PerformanceReview[] }>
> => {
  const res =
    await apiClient.get<ApiResponse<{ reviews: PerformanceReview[] }>>(
      "/reviews/mine",
    );
  return res.data;
};

export const createReview = async (
  body: CreateReviewRequest,
): Promise<ApiResponse<{ review: PerformanceReview }>> => {
  const res = await apiClient.post<ApiResponse<{ review: PerformanceReview }>>(
    "/reviews",
    body,
  );
  return res.data;
};

export const listReviews = async (
  query: ReviewListQuery = {},
): Promise<PaginatedResponse<PerformanceReview>> => {
  const res = await apiClient.get<PaginatedResponse<PerformanceReview>>(
    "/reviews",
    {
      params: query,
    },
  );
  return res.data;
};
