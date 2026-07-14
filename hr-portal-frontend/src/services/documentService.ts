// ─────────────────────────────────────────────────────────────────────────────
// services/documentService.ts
// Covers routes in /hr-portal-backend/routes/documentRoutes.js
//
// Route prefix: /api/documents
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from "./apiClient.js";
import type { ApiResponse, PaginatedResponse, EmployeeDocument } from "@/types";

// ─── Request / Query shapes ───────────────────────────────────────────────────

export type DocumentType = "BANK_PROOF" | "NATIONAL_ID";

export interface DocumentDecisionRequest {
  status: "APPROVED" | "REJECTED";
}

export interface PendingDocumentsQuery {
  page?: number;
  limit?: number;
}

// ─── Document Service ─────────────────────────────────────────────────────────

/**
 * GET /api/documents/mine
 * Returns all documents uploaded by the authenticated employee.
 * Available to all authenticated users (Employee + HR).
 */
export const getMyDocuments = async (): Promise<
  ApiResponse<{ documents: EmployeeDocument[] }>
> => {
  const res =
    await apiClient.get<ApiResponse<{ documents: EmployeeDocument[] }>>(
      "/documents/mine",
    );
  return res.data;
};

/**
 * POST /api/documents
 * Uploads a document (BANK_PROOF or NATIONAL_ID) as multipart/form-data.
 * The backend validates MIME type, computes SHA-256, encrypts the original
 * filename, and stores the file securely.
 * Requires CSRF token.
 *
 * @param file     The file to upload (from an <input type="file"> element)
 * @param type     Document classification
 */
export const uploadDocument = async (
  file: File,
  type: DocumentType,
): Promise<ApiResponse<{ document: EmployeeDocument }>> => {
  const form = new FormData();
  form.append("document", file); // field name must match parseSecureUpload("document")
  form.append("type", type);

  const res = await apiClient.post<ApiResponse<{ document: EmployeeDocument }>>(
    "/documents",
    form,
    {
      headers: {
        // Let the browser set Content-Type with the correct boundary for multipart.
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return res.data;
};

/**
 * GET /api/documents/pending  [HR only]
 * Returns documents with PENDING status awaiting HR review.
 */
export const getPendingDocuments = async (
  query: PendingDocumentsQuery = {},
): Promise<PaginatedResponse<EmployeeDocument>> => {
  const res = await apiClient.get<PaginatedResponse<EmployeeDocument>>(
    "/documents/pending",
    { params: query },
  );
  return res.data;
};

/**
 * PATCH /api/documents/:id/decision  [HR only]
 * Approves or rejects a pending document.
 * Requires CSRF token.
 */
export const decideDocument = async (
  id: string,
  body: DocumentDecisionRequest,
): Promise<ApiResponse<{ document: EmployeeDocument }>> => {
  const res = await apiClient.patch<
    ApiResponse<{ document: EmployeeDocument }>
  >(`/documents/${id}/decision`, body);
  return res.data;
};

/**
 * GET /api/documents/:id/download
 * Returns a signed download URL or streams the document content.
 * The response type is "blob" so the caller can construct an object URL.
 * Available to all authenticated users (employees access their own,
 * HR can access any).
 */
export const downloadDocument = async (id: string): Promise<Blob> => {
  const res = await apiClient.get<Blob>(`/documents/${id}/download`, {
    responseType: "blob",
  });
  return res.data;
};
