import { useEffect, useState } from "react";
import {
  listTransactions,
  verifyTransactionSignature,
  type SignatureVerification,
} from "@/services/transactionService.js";
import type { Transaction } from "@/types/index.js";
import { useToast } from "@/context/ToastContext.js";
import { DataTable } from "@/components/ui/DataTable.js";
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Loader2,
} from "lucide-react";

export function Transactions() {
  const { error } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState<
    Record<string, SignatureVerification | "checking">
  >({});

  const onVerify = async (id: string) => {
    setVerified((prev) => ({ ...prev, [id]: "checking" }));
    try {
      const res = await verifyTransactionSignature(id);
      setVerified((prev) => ({ ...prev, [id]: res.data }));
      if (!res.data.valid)
        error("Signature does not match — this ledger row has been altered.");
    } catch (err: any) {
      setVerified((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      error(err.message || "Verification failed");
    }
  };

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
  }, []);

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
      cell: (tx: any) => {
        const name = tx.employeeId?.name || tx.employeeId || "Unknown";
        const avatarUrl = tx.employeeId?.avatarUrl;
        return (
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <img
              src={
                avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  name,
                )}&background=random&color=fff&size=32`
              }
              alt={`${name} avatar`}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
            <strong style={{ color: "white" }}>{name}</strong>
          </div>
        );
      },
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
    {
      header: "Integrity",
      cell: (tx: Transaction) => {
        const state = verified[tx._id];
        if (state === "checking")
          return (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                color: "var(--color-text-muted, #94a3b8)",
                fontSize: "0.8rem",
              }}
            >
              <Loader2
                size={14}
                style={{ animation: "spin 1s linear infinite" }}
              />
              Checking…
            </span>
          );
        if (state)
          return (
            <span
              title={state.canonicalPayload}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                color: state.valid
                  ? "var(--color-success, #10b981)"
                  : "var(--color-danger, #ef4444)",
                fontSize: "0.8rem",
                cursor: "help",
              }}
            >
              {state.valid ? (
                <ShieldCheck size={14} />
              ) : (
                <ShieldAlert size={14} />
              )}
              {state.valid ? `Valid (${state.keyId})` : "TAMPERED"}
            </span>
          );
        return (
          <button
            onClick={() => onVerify(tx._id)}
            title="Recompute the canonical payload and check it against the stored RSA-SHA256 signature"
            style={{
              padding: "0.35rem 0.7rem",
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.2)",
              color: "#6366f1",
              borderRadius: "0.5rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.78rem",
            }}
          >
            <ShieldCheck size={14} /> Verify
          </button>
        );
      },
    },
  ];

  return (
    <div
      style={{
        padding: "2rem",
        maxWidth: "90rem",
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

      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            color: "var(--color-text-muted, #94a3b8)",
          }}
        >
          Loading transactions...
        </div>
      ) : (
        <DataTable
          data={transactions}
          columns={columns}
          keyExtractor={(t) => t._id}
          page={page}
          totalPages={totalPages}
          onPageChange={fetchData}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
export default Transactions;
