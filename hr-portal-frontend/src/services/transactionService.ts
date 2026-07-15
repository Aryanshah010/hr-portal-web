// ─────────────────────────────────────────────────────────────────────────────
// services/transactionService.ts
// Covers routes in /hr-portal-backend/routes/transactionRoutes.js
//
// Route prefix: /api/transactions
//
// Payment processor: eSewa (sandbox).
// Transactions are signed with RSA-SHA256 on the backend for data integrity.
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from "./apiClient.js";
import type {
  ApiResponse,
  PaginatedResponse,
  Transaction,
} from "@/types/index.js";

// ─── Request shapes ───────────────────────────────────────────────────────────

export interface CreatePaymentIntentRequest {
  /** The Payslip ObjectId to disburse payment for */
  payslipId: string;
  /** Amount in NPR (must match the payslip's netNPR) */
  amountNPR: number;
  /** Idempotency key to prevent duplicate disbursements */
  idempotencyKey: string;
}

export interface TransactionListQuery {
  page?: number;
  limit?: number;
}

// ─── Transaction Service ──────────────────────────────────────────────────────

/**
 * POST /api/transactions/create-payment-intent  [HR only]
 * Initiates an eSewa disbursement for a payslip.
 * The backend signs the transaction with RSA-SHA256 and generates an
 * HMAC-SHA256 eSewa signature, then immediately marks it COMPLETED in sandbox.
 * Requires CSRF token.
 *
 * Returns the created Transaction record.
 */
export const createPaymentIntent = async (
  body: CreatePaymentIntentRequest,
): Promise<ApiResponse<{ transaction: Transaction }>> => {
  const res = await apiClient.post<ApiResponse<{ transaction: Transaction }>>(
    "/transactions/create-payment-intent",
    body,
  );
  return res.data;
};

/**
 * GET /api/transactions  [HR only]
 * Returns a paginated list of transactions.
 */
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
