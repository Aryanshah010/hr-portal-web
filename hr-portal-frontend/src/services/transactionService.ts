import apiClient from "./apiClient.js";
import type {
  ApiResponse,
  PaginatedResponse,
  Transaction,
} from "@/types/index.js";

export interface CreatePaymentIntentRequest {
  payslipId: string;
  amountNPR: number;
  idempotencyKey: string;
}

export interface TransactionListQuery {
  page?: number;
  limit?: number;
}

export const createPaymentIntent = async (
  body: CreatePaymentIntentRequest,
): Promise<ApiResponse<{ transaction: Transaction }>> => {
  const res = await apiClient.post<ApiResponse<{ transaction: Transaction }>>(
    "/transactions/create-payment-intent",
    body,
  );
  return res.data;
};

export const listTransactions = async (
  query: TransactionListQuery = {},
): Promise<PaginatedResponse<Transaction>> => {
  const res = await apiClient.get<PaginatedResponse<Transaction>>(
    "/transactions",
    {
      params: query,
    },
  );
  return res.data;
};
