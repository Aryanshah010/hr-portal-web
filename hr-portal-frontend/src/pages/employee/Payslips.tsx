// ─────────────────────────────────────────────────────────────────────────────
// pages/employee/Payslips.tsx
//
// Payslip lookup for employees.
// There is NO list endpoint for employees — the payroll list is HR-only.
// Backend endpoint: GET /api/payroll/runs/:runId/payslips/:employeeId
// Employees can only retrieve their own payslip for a known run ID.
//
// Flow: on mount, fetch /me/profile to get the employee _id.
//       Employee pastes a Payroll Run ID → fetch their payslip for that run.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { getMyProfile } from "@/services/employeeService.js";
import { getPayslip } from "@/services/payrollService.js";
import type { Payslip, Employee } from "@/types/index.js";
import type { ApiError } from "@/types/index.js";
import { useToast } from "@/context/ToastContext.js";
import { CreditCard, Search, Loader2, Info } from "lucide-react";

const formatNPR = (amount: number) =>
  new Intl.NumberFormat("ne-NP", {
    style: "currency",
    currency: "NPR",
    minimumFractionDigits: 2,
  }).format(amount);

const statusBadge = (status: Payslip["payoutStatus"]) => {
  const map = {
    PENDING: {
      bg: "rgba(245,158,11,0.15)",
      color: "#f59e0b",
      label: "Pending",
    },
    COMPLETED: {
      bg: "rgba(16,185,129,0.15)",
      color: "#10b981",
      label: "Completed",
    },
    FAILED: { bg: "rgba(239,68,68,0.15)", color: "#ef4444", label: "Failed" },
  };
  const s = map[status] ?? map.PENDING;
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

export function Payslips() {
  const { error } = useToast();
  const [profile, setProfile] = useState<Employee | null>(null);
  const [runId, setRunId] = useState("");
  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [searching, setSearching] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    getMyProfile()
      .then((res) => setProfile(res.data.profile))
      .catch((err: ApiError) => error(err.message || "Failed to load profile."))
      .finally(() => setProfileLoading(false));
  }, [error]);

  const handleSearch = async () => {
    if (!runId.trim() || !profile) return;
    try {
      setSearching(true);
      setPayslip(null);
      const res = await getPayslip(runId.trim(), profile._id);
      setPayslip(res.data.payslip);
    } catch (err) {
      const apiErr = err as ApiError;
      error(apiErr.message || "No payslip found for that run ID.");
    } finally {
      setSearching(false);
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
          maxWidth: "48rem",
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
              background: "rgba(16,185,129,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-success, #10b981)",
            }}
          >
            <CreditCard size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>
              Payslips
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "0.85rem",
                color: "var(--color-text-muted, #94a3b8)",
              }}
            >
              Retrieve your payslip for a payroll run
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            padding: "1rem 1.25rem",
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: "0.75rem",
            alignItems: "flex-start",
          }}
        >
          <Info
            size={18}
            style={{
              color: "var(--color-primary, #6366f1)",
              flexShrink: 0,
              marginTop: "0.1rem",
            }}
          />
          <p
            style={{
              margin: 0,
              fontSize: "0.875rem",
              color: "var(--color-text-muted, #94a3b8)",
              lineHeight: 1.6,
            }}
          >
            Payslips are generated by HR for each payroll run. You need the{" "}
            <strong style={{ color: "white" }}>Payroll Run ID</strong> to
            retrieve your payslip. Contact HR if you need assistance.
          </p>
        </div>

        {/* Lookup Card */}
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
            Look Up Payslip
          </h2>
          {profileLoading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "var(--color-text-muted, #94a3b8)",
                fontSize: "0.875rem",
              }}
            >
              <Loader2
                size={16}
                style={{ animation: "spin 1s linear infinite" }}
              />{" "}
              Loading your profile…
            </div>
          ) : (
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--color-text-muted, #94a3b8)",
                    pointerEvents: "none",
                  }}
                >
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Enter Payroll Run ID…"
                  value={runId}
                  onChange={(e) => setRunId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  style={{
                    width: "100%",
                    padding: "0.8rem 1rem 0.8rem 2.5rem",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "0.75rem",
                    color: "white",
                    fontSize: "0.9rem",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "monospace",
                  }}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={!runId.trim() || searching || !profile}
                style={{
                  padding: "0.8rem 1.5rem",
                  background: "var(--color-primary, #6366f1)",
                  border: "none",
                  borderRadius: "0.75rem",
                  color: "white",
                  fontWeight: 500,
                  fontSize: "0.9rem",
                  cursor:
                    !runId.trim() || searching || !profile
                      ? "not-allowed"
                      : "pointer",
                  opacity: !runId.trim() || searching || !profile ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  whiteSpace: "nowrap",
                }}
              >
                {searching ? (
                  <Loader2
                    size={16}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  <Search size={16} />
                )}
                {searching ? "Searching…" : "Fetch"}
              </button>
            </div>
          )}
        </div>

        {/* Payslip Result */}
        {payslip && (
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "1rem",
              backdropFilter: "blur(12px)",
              padding: "1.5rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
                Payslip Details
              </h2>
              {statusBadge(payslip.payoutStatus)}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              {[
                {
                  label: "Gross Salary",
                  value: formatNPR(payslip.grossNPR),
                  accent: false,
                },
                {
                  label: "Tax Deducted",
                  value: formatNPR(payslip.taxNPR),
                  accent: false,
                },
                {
                  label: "Other Deductions",
                  value: formatNPR(payslip.deductionsNPR),
                  accent: false,
                },
                {
                  label: "Net Pay",
                  value: formatNPR(payslip.netNPR),
                  accent: true,
                },
              ].map(({ label, value, accent }) => (
                <div
                  key={label}
                  style={{
                    padding: "1rem",
                    background: accent
                      ? "rgba(16,185,129,0.08)"
                      : "rgba(0,0,0,0.2)",
                    borderRadius: "0.75rem",
                    border: `1px solid ${accent ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.05)"}`,
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 0.25rem",
                      fontSize: "0.75rem",
                      color: accent
                        ? "var(--color-success, #10b981)"
                        : "var(--color-text-muted, #94a3b8)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {label}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      color: accent ? "var(--color-success, #10b981)" : "white",
                    }}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <p
              style={{
                margin: "1rem 0 0",
                fontSize: "0.8rem",
                color: "var(--color-text-muted, #94a3b8)",
              }}
            >
              Generated on {new Date(payslip.generatedAt).toLocaleString()}
            </p>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
export default Payslips;
