// ─────────────────────────────────────────────────────────────────────────────
// services/transactionService.ts
// Covers routes in /hr-portal-backend/routes/transactionRoutes.js
//
// Route prefix: /api/transactions
//
// Note: /api/transactions/webhook is a Stripe webhook — it does NOT go through
// the frontend. It is listed here only for documentation completeness.
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from "./apiClient.js";
import type { ApiResponse, Transaction } from "@/types";

// ─── Request shapes ───────────────────────────────────────────────────────────

export interface CreatePaymentIntentRequest {
  /** The Payslip ObjectId to disburse payment for */
  payslipId: string;
  /** Amount in NPR (must match the payslip's netNPR) */
  amountNPR: number;
  /** Idempotency key to prevent duplicate disbursements */
  idempotencyKey: string;
}

// ─── Transaction Service ──────────────────────────────────────────────────────

/**
 * POST /api/transactions/create-payment-intent  [HR only]
 * Creates a Stripe PaymentIntent for a payslip disbursement.
 * The backend signs the transaction and records a PENDING Transaction document.
 * Requires CSRF token.
 *
 * Returns the created Transaction record. The Stripe client secret is not
 * exposed to the frontend — Stripe payment confirmation is handled server-side
 * via the /webhook endpoint.
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
