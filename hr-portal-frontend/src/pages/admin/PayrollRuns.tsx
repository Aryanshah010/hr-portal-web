import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  listPayrollRuns,
  createPayrollRun,
  submitPayrollRun,
  approvePayrollRun,
  executePayrollRun,
} from "@/services/payrollService.js";
import { listHrUsers } from "@/services/employeeService.js";
import type { PayrollRun } from "@/types/index.js";
import { useToast } from "@/context/ToastContext.js";
import { useAuth } from "@/context/AuthContext.js";
import { DataTable } from "@/components/ui/DataTable.js";
import { Modal } from "@/components/ui/Modal.js";
import { FormInput } from "@/components/ui/FormInput.js";
import {
  CreditCard,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  PlayCircle,
  Lock,
  AlertTriangle,
} from "lucide-react";

const createRunSchema = z.object({
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Period must be YYYY-MM"),
});

export function PayrollRuns() {
  const { error, success } = useToast();
  const { user } = useAuth();
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [approverCount, setApproverCount] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createRunSchema),
    defaultValues: { period: new Date().toISOString().slice(0, 7) },
  });

  const fetchData = async (p = 1) => {
    try {
      const res = await listPayrollRuns({ page: p, limit: 15 });
      setRuns(res.data.items);
      setTotalPages(res.data.pages);
      setPage(res.data.page);
    } catch (err: any) {
      error(err.message || "Failed to load payroll runs");
    }
  };

  useEffect(() => {
    fetchData(1);
    listHrUsers()
      .then((res) => setApproverCount(res.data.records.length))
      .catch(() => setApproverCount(null));
  }, []);

  const onSubmit = async (data: any) => {
    try {
      await createPayrollRun(data);
      success("Payroll run created in DRAFT state");
      setIsModalOpen(false);
      reset();
      fetchData(1);
    } catch (err: any) {
      error(err.message || "Failed to create run");
    }
  };

  const handleAction = async (
    id: string,
    action: string,
    apiCall: (id: string) => Promise<any>,
  ) => {
    setLoadingAction(id + action);
    try {
      await apiCall(id);
      success(`Payroll run ${action} successfully`);
      fetchData(page);
    } catch (err: any) {
      error(err.message || `Failed to ${action} run`);
    } finally {
      setLoadingAction(null);
    }
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case "DRAFT":
        return (
          <span
            style={{
              color: "var(--color-text-muted, #94a3b8)",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            <Clock size={14} /> Draft
          </span>
        );
      case "PENDING_APPROVAL":
        return (
          <span
            style={{
              color: "var(--color-warning, #f59e0b)",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            <ShieldCheck size={14} /> Pending Approval
          </span>
        );
      case "APPROVED":
        return (
          <span
            style={{
              color: "var(--color-primary, #6366f1)",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            <CheckCircle size={14} /> Approved
          </span>
        );
      case "PROCESSING":
        return (
          <span
            style={{
              color: "var(--color-primary, #6366f1)",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            <RefreshCw size={14} /> Processing
          </span>
        );
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
      default:
        return status;
    }
  };

  const columns = [
    { header: "Period", accessorKey: "period" as keyof PayrollRun },
    { header: "Status", cell: (r: PayrollRun) => renderStatus(r.status) },
    {
      header: "Gross (NPR)",
      cell: (r: PayrollRun) => r.totals.grossNPR.toLocaleString(),
    },
    {
      header: "Net (NPR)",
      cell: (r: PayrollRun) => r.totals.netNPR.toLocaleString(),
    },
    {
      header: "Actions",
      cell: (r: PayrollRun) => (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {r.status === "DRAFT" && (
            <button
              onClick={() => handleAction(r._id, "submit", submitPayrollRun)}
              disabled={loadingAction === r._id + "submit"}
              style={{
                padding: "0.4rem 0.75rem",
                background: "rgba(245,158,11,0.1)",
                color: "#f59e0b",
                border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: "0.5rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "0.8rem",
              }}
            >
              <Send size={14} /> Submit
            </button>
          )}
          {/* Segregation of duties: the creator can never approve their own run,
              so show them the blocked state instead of a button that 403s. */}
          {r.status === "PENDING_APPROVAL" &&
            (r.createdBy === user?.id ? (
              <span
                title="You created this run. A different HR account must approve it."
                style={{
                  padding: "0.4rem 0.75rem",
                  background: "rgba(148,163,184,0.08)",
                  color: "var(--color-text-muted, #94a3b8)",
                  border: "1px solid rgba(148,163,184,0.18)",
                  borderRadius: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontSize: "0.8rem",
                  cursor: "help",
                }}
              >
                <Lock size={14} /> Awaiting another HR
              </span>
            ) : (
              <button
                onClick={() => handleAction(r._id, "approve", approvePayrollRun)}
                disabled={loadingAction === r._id + "approve"}
                style={{
                  padding: "0.4rem 0.75rem",
                  background: "rgba(16,185,129,0.1)",
                  color: "#10b981",
                  border: "1px solid rgba(16,185,129,0.2)",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontSize: "0.8rem",
                }}
              >
                <ShieldCheck size={14} /> Approve
              </button>
            ))}
          {r.status === "APPROVED" && (
            <button
              onClick={() => handleAction(r._id, "execute", executePayrollRun)}
              disabled={loadingAction === r._id + "execute"}
              style={{
                padding: "0.4rem 0.75rem",
                background: "rgba(99,102,241,0.1)",
                color: "#6366f1",
                border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: "0.5rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "0.8rem",
              }}
            >
              <PlayCircle size={14} /> Execute eSewa Payouts
            </button>
          )}
        </div>
      ),
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
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
            Payroll Management
          </h1>
          <p
            style={{
              margin: 0,
              color: "var(--color-text-muted, #94a3b8)",
              fontSize: "0.95rem",
            }}
          >
            Generate payslips, approve totals, and execute mass payouts via
            eSewa.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            padding: "0.75rem 1.25rem",
            background: "var(--color-primary, #6366f1)",
            color: "white",
            border: "none",
            borderRadius: "0.75rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Plus size={18} /> New Payroll Run
        </button>
      </div>

      {approverCount !== null && approverCount < 2 && (
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            padding: "1rem 1.25rem",
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.25)",
            borderRadius: "0.75rem",
            color: "#fbbf24",
            fontSize: "0.875rem",
            lineHeight: 1.6,
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>No second approver available.</strong> Payroll uses
            segregation of duties: whoever creates a run cannot approve it. With
            only one active HR account, submitted runs will stay pending. Promote
            an active employee to HR from{" "}
            <strong>Employees &rarr; Change Role</strong>, then approve as that
            account.
          </div>
        </div>
      )}

      <DataTable
        data={runs}
        columns={columns}
        keyExtractor={(r) => r._id}
        page={page}
        totalPages={totalPages}
        onPageChange={fetchData}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          reset();
        }}
        title="Create Payroll Run"
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          <FormInput
            label="Period (YYYY-MM)"
            {...register("period")}
            error={errors.period?.message as string}
          />

          <div
            style={{
              padding: "1rem",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "0.75rem",
              fontSize: "0.875rem",
              color: "var(--color-text-muted, #94a3b8)",
            }}
          >
            Creating a run will generate draft payslips for all active employees
            based on their current base salary.
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: "0.75rem",
              background: "var(--color-primary, #6366f1)",
              color: "white",
              border: "none",
              borderRadius: "0.75rem",
              fontWeight: 600,
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? "Generating..." : "Generate Run"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
export default PayrollRuns;
