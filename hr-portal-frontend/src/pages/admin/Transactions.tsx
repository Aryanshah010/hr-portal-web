// ─────────────────────────────────────────────────────────────────────────────
// pages/admin/Transactions.tsx
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { listTransactions } from "@/services/transactionService.js";
import type { Transaction } from "@/types/index.js";
import { useToast } from "@/context/ToastContext.js";
import { DataTable } from "@/components/ui/DataTable.js";
import { CreditCard, CheckCircle, XCircle, Clock } from "lucide-react";

export function Transactions() {
  const { error } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = async (p = 1) => {
    setLoading(true);
    try {
      const res = await listTransactions({ page: p, limit: 15 });
      setTransactions(res.data.items);
      setTotalPages(res.data.pages);
      setPage(res.data.page);
    } catch (err: any) {
      error(err.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const renderStatus = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span
            style={{
              color: "var(--color-success, #10b981)",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            <CheckCircle size={14} /> Completed
          </span>
        );
      case "FAILED":
        return (
          <span
            style={{
              color: "var(--color-danger, #ef4444)",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            <XCircle size={14} /> Failed
          </span>
        );
      case "PENDING":
        return (
          <span
            style={{
              color: "var(--color-warning, #f59e0b)",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            <Clock size={14} /> Pending
          </span>
        );
      default:
        return status;
    }
  };

  const columns = [
    {
      header: "Employee",
      cell: (tx: any) => tx.employeeId?.name || tx.employeeId,
    },
    { header: "Type", cell: (tx: Transaction) => tx.type.replace("_", " ") },
    {
      header: "Amount (NPR)",
      cell: (tx: Transaction) => tx.amountNPR.toLocaleString(),
    },
    { header: "Status", cell: (tx: Transaction) => renderStatus(tx.status) },
    {
      header: "Created",
      cell: (tx: Transaction) => new Date(tx.createdAt).toLocaleDateString(),
    },
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
          <CreditCard size={28} color="var(--color-primary, #6366f1)" />{" "}
          Financial Ledger
        </h1>
        <p
          style={{
            margin: 0,
            color: "var(--color-text-muted, #94a3b8)",
            fontSize: "0.95rem",
          }}
        >
          Historical record of all payment transactions and reconciliation
          states.
        </p>
      </div>

      <DataTable
        data={transactions}
        columns={columns}
        keyExtractor={(t) => t._id}
        page={page}
        totalPages={totalPages}
        onPageChange={fetchData}
      />
    </div>
  );
}
export default Transactions;
