import apiClient from "./apiClient.js";
import type { ApiResponse, PaginatedResponse, EmployeeDocument } from "@/types";

export type DocumentType = "BANK_PROOF" | "NATIONAL_ID";

export interface DocumentDecisionRequest {
  status: "APPROVED" | "REJECTED";
}

export interface PendingDocumentsQuery {
  page?: number;
  limit?: number;
}

export const getMyDocuments = async (): Promise<
  ApiResponse<{ documents: EmployeeDocument[] }>
> => {
  const res =
    await apiClient.get<ApiResponse<{ documents: EmployeeDocument[] }>>(
      "/documents/mine",
    );
  return res.data;
};

export const uploadDocument = async (
  file: File,
  type: DocumentType,
): Promise<ApiResponse<{ document: EmployeeDocument }>> => {
  const form = new FormData();
  form.append("document", file);
  form.append("type", type);

  const res = await apiClient.post<ApiResponse<{ document: EmployeeDocument }>>(
    "/documents",
    form,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return res.data;
};

export const getPendingDocuments = async (
  query: PendingDocumentsQuery = {},
): Promise<PaginatedResponse<EmployeeDocument>> => {
  const res = await apiClient.get<PaginatedResponse<EmployeeDocument>>(
    "/documents/pending",
    { params: query },
  );
  return res.data;
};

export const decideDocument = async (
  id: string,
  body: DocumentDecisionRequest,
): Promise<ApiResponse<{ document: EmployeeDocument }>> => {
  const res = await apiClient.patch<
    ApiResponse<{ document: EmployeeDocument }>
  >(`/documents/${id}/decision`, body);
  return res.data;
};

export const downloadDocument = async (id: string): Promise<Blob> => {
  const res = await apiClient.get<Blob>(`/documents/${id}/download`, {
    responseType: "blob",
  });
  return res.data;
};
