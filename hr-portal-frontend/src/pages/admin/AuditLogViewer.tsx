// ─────────────────────────────────────────────────────────────────────────────
// pages/admin/AuditLogViewer.tsx
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { listAuditLogs } from "@/services/auditService.js";
import type { AuditLog } from "@/services/auditService.js";
import { useToast } from "@/context/ToastContext.js";
import { DataTable } from "@/components/ui/DataTable.js";
import { ShieldAlert } from "lucide-react";

export function AuditLogViewer() {
  const { error } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = async (p = 1) => {
    setLoading(true);
    try {
      const res = await listAuditLogs({ page: p, limit: 15 });
      setLogs(res.data.items);
      setTotalPages(res.data.pages);
      setPage(res.data.page);
    } catch (err: any) {
      error(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const columns = [
    {
      header: "Timestamp",
      cell: (log: AuditLog) => new Date(log.createdAt).toLocaleString(),
    },
    {
      header: "Action",
      cell: (log: AuditLog) => (
        <strong style={{ color: "var(--color-primary, #6366f1)" }}>
          {log.action}
        </strong>
      ),
    },
    { header: "Actor ID", accessorKey: "actorId" as keyof AuditLog },
    { header: "Target ID", accessorKey: "targetId" as keyof AuditLog },
    { header: "IP Address", accessorKey: "ipAddress" as keyof AuditLog },
  ];

  return (
    <div
      style={{
        padding: "2rem",
        maxWidth: "72rem",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
      }}
    >
      <div>
        <h1
          style={{
            margin: "0 0 0.5rem",
            fontSize: "1.75rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <ShieldAlert size={28} color="var(--color-primary, #6366f1)" /> System
          Audit Logs
        </h1>
        <p
          style={{
            margin: 0,
            color: "var(--color-text-muted, #94a3b8)",
            fontSize: "0.95rem",
          }}
        >
          Immutable record of critical system events and state mutations.
        </p>
      </div>

      <DataTable
        data={logs}
        columns={columns}
        keyExtractor={(l) => l._id}
        page={page}
        totalPages={totalPages}
        onPageChange={fetchData}
      />
    </div>
  );
}
export default AuditLogViewer;
