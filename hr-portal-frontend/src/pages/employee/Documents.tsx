import { useEffect, useRef, useState } from "react";
import {
  uploadDocument,
  getMyDocuments,
  downloadDocument,
} from "@/services/documentService.js";
import type { EmployeeDocument } from "@/types/index.js";
import type { ApiError } from "@/types/index.js";
import { useToast } from "@/context/ToastContext.js";
import { FileText, Upload, Download, Loader2 } from "lucide-react";

const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const statusBadge = (status: EmployeeDocument["status"]) => {
  const map = {
    PENDING: {
      bg: "rgba(245,158,11,0.15)",
      color: "var(--color-warning, #f59e0b)",
      label: "Pending",
    },
    APPROVED: {
      bg: "rgba(16,185,129,0.15)",
      color: "var(--color-success, #10b981)",
      label: "Approved",
    },
    REJECTED: {
      bg: "rgba(239,68,68,0.15)",
      color: "var(--color-danger, #ef4444)",
      label: "Rejected",
    },
  };
  const s = map[status];
  return (
    <span
      style={{
        fontSize: "0.75rem",
        fontWeight: 600,
        padding: "0.2rem 0.65rem",
        borderRadius: "999px",
        background: s.bg,
        color: s.color,
      }}
    >
      {s.label}
    </span>
  );
};

export function Documents() {
  const { error, success } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<"BANK_PROOF" | "NATIONAL_ID">(
    "BANK_PROOF",
  );
  const [fileError, setFileError] = useState("");

  const fetchDocs = () => {
    getMyDocuments()
      .then((res) => setDocuments(res.data.documents))
      .catch((err: ApiError) =>
        error(err.message || "Failed to load documents."),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFileError("");
    setSelectedFile(null);
    if (!file) return;
    if (!ALLOWED_MIME.includes(file.type)) {
      setFileError("Only PDF, JPEG, or PNG files are allowed.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setFileError("File must be 5 MB or smaller.");
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      setIsUploading(true);
      await uploadDocument(selectedFile, docType);
      success("Document uploaded successfully. Awaiting HR review.");
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
      fetchDocs();
    } catch (err) {
      const apiErr = err as ApiError;
      error(apiErr.message || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (doc: EmployeeDocument) => {
    try {
      setDownloadingId(doc._id);
      const blob = await downloadDocument(doc._id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.type}-${doc._id}.${doc.mimeType.split("/")[1]}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      const apiErr = err as ApiError;
      error(apiErr.message || "Download failed.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--color-bg, #0f1117)",
        color: "var(--color-text, #f8fafc)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "2rem",
      }}
    >
      <div
        style={{
          maxWidth: "90rem",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "2.5rem",
              height: "2.5rem",
              borderRadius: "0.75rem",
              background: "rgba(99,102,241,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-primary, #6366f1)",
            }}
          >
            <FileText size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>
              My Documents
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "0.85rem",
                color: "var(--color-text-muted, #94a3b8)",
              }}
            >
              Upload bank proof and national ID for HR verification
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "1rem",
            backdropFilter: "blur(12px)",
            padding: "1.5rem",
          }}
        >
          <h2
            style={{ margin: "0 0 1.25rem", fontSize: "1rem", fontWeight: 600 }}
          >
            Upload Document
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "1rem",
              alignItems: "start",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    color: "var(--color-text-muted, #94a3b8)",
                    marginBottom: "0.4rem",
                  }}
                >
                  Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as typeof docType)}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "0.75rem",
                    color: "white",
                    fontSize: "0.9rem",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="BANK_PROOF">Bank Proof</option>
                  <option value="NATIONAL_ID">National ID</option>
                </select>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    color: "var(--color-text-muted, #94a3b8)",
                    marginBottom: "0.4rem",
                  }}
                >
                  File{" "}
                  <span style={{ opacity: 0.6 }}>
                    (PDF, JPEG, PNG — max 5 MB)
                  </span>
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: "rgba(0,0,0,0.2)",
                    border: `1px solid ${fileError ? "var(--color-danger,#ef4444)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: "0.75rem",
                    color: "white",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    boxSizing: "border-box",
                  }}
                />
                {fileError && (
                  <p
                    style={{
                      margin: "0.4rem 0 0",
                      fontSize: "0.8rem",
                      color: "var(--color-danger, #ef4444)",
                    }}
                  >
                    {fileError}
                  </p>
                )}
                {selectedFile && !fileError && (
                  <p
                    style={{
                      margin: "0.4rem 0 0",
                      fontSize: "0.8rem",
                      color: "var(--color-success, #10b981)",
                    }}
                  >
                    ✓ {selectedFile.name} (
                    {(selectedFile.size / 1024).toFixed(0)} KB)
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              style={{
                marginTop: "1.75rem",
                padding: "0.75rem 1.5rem",
                background: "var(--color-primary, #6366f1)",
                border: "none",
                borderRadius: "0.75rem",
                color: "white",
                fontSize: "0.9rem",
                fontWeight: 500,
                cursor:
                  !selectedFile || isUploading ? "not-allowed" : "pointer",
                opacity: !selectedFile || isUploading ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                whiteSpace: "nowrap",
              }}
            >
              {isUploading ? (
                <Loader2
                  size={16}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <Upload size={16} />
              )}
              {isUploading ? "Uploading…" : "Upload"}
            </button>
          </div>
        </div>

        {/* Documents List */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "1rem",
            backdropFilter: "blur(12px)",
            padding: "1.5rem",
          }}
        >
          <h2
            style={{ margin: "0 0 1.25rem", fontSize: "1rem", fontWeight: 600 }}
          >
            Submitted Documents
          </h2>
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "2rem",
                color: "var(--color-text-muted, #94a3b8)",
              }}
            >
              <Loader2
                size={24}
                style={{ animation: "spin 1s linear infinite" }}
              />
            </div>
          ) : documents.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                color: "var(--color-text-muted, #94a3b8)",
                padding: "2rem 0",
                margin: 0,
              }}
            >
              No documents uploaded yet.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.875rem",
                }}
              >
                <thead>
                  <tr
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {["Type", "Format", "Status", "Uploaded", "Download"].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            padding: "0.75rem 1rem",
                            textAlign: "left",
                            color: "var(--color-text-muted, #94a3b8)",
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr
                      key={doc._id}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <td
                        style={{
                          padding: "0.875rem 1rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {doc.type === "BANK_PROOF"
                          ? "Bank Proof"
                          : "National ID"}
                      </td>
                      <td
                        style={{
                          padding: "0.875rem 1rem",
                          color: "var(--color-text-muted, #94a3b8)",
                        }}
                      >
                        {doc.mimeType.split("/")[1].toUpperCase()}
                      </td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        {statusBadge(doc.status)}
                      </td>
                      <td
                        style={{
                          padding: "0.875rem 1rem",
                          color: "var(--color-text-muted, #94a3b8)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <button
                          onClick={() => handleDownload(doc)}
                          disabled={downloadingId === doc._id}
                          style={{
                            padding: "0.4rem 0.85rem",
                            background: "rgba(99,102,241,0.15)",
                            border: "1px solid rgba(99,102,241,0.3)",
                            borderRadius: "0.5rem",
                            color: "var(--color-primary, #6366f1)",
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                          }}
                        >
                          {downloadingId === doc._id ? (
                            <Loader2
                              size={13}
                              style={{ animation: "spin 1s linear infinite" }}
                            />
                          ) : (
                            <Download size={13} />
                          )}
                          {downloadingId === doc._id
                            ? "Downloading…"
                            : "Download"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
export default Documents;
