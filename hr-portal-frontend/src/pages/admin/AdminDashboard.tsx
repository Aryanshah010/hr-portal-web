import { useEffect, useState } from "react";
import { getDashboardStats } from "@/services/dashboardService.js";
import { useToast } from "@/context/ToastContext.js";
import {
  Users,
  Clock,
  ShieldCheck,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner.js";

export function AdminDashboard() {
  const { error } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then((res) => setStats(res.data))
      .catch(() => error("Failed to load dashboard statistics."))
      .finally(() => setLoading(false));
  }, [error]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          padding: "4rem",
        }}
      >
        <LoadingSpinner text="Loading dashboard..." />
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: "2rem", color: "var(--color-danger, #ef4444)" }}>
        Failed to load dashboard.
      </div>
    );
  }

  const statCards = [
    {
      label: "Active Employees",
      value: stats.activeEmployees ?? 0,
      icon: <Users size={24} />,
      color: "#6366f1",
      bg: "rgba(99,102,241,0.15)",
    },
    {
      label: "Pending Attendance",
      value: stats.pendingAttendance ?? 0,
      icon: <Clock size={24} />,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.15)",
    },
    {
      label: "HR Admins",
      value: stats.hrCount ?? 0,
      icon: <ShieldCheck size={24} />,
      color: "#10b981",
      bg: "rgba(16,185,129,0.15)",
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
          style={{ margin: "0 0 0.5rem", fontSize: "1.75rem", fontWeight: 700 }}
        >
          HR Admin Dashboard
        </h1>
        <p
          style={{
            margin: 0,
            color: "var(--color-text-muted, #94a3b8)",
            fontSize: "0.95rem",
          }}
        >
          Overview of company metrics and pending actions.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
          gap: "1.5rem",
        }}
      >
        {statCards.map((s) => (
          <div
            key={s.label}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "1rem",
              padding: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "1.25rem",
            }}
          >
            <div
              style={{
                width: "3.5rem",
                height: "3.5rem",
                borderRadius: "0.75rem",
                background: s.bg,
                color: s.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {s.icon}
            </div>
            <div>
              <p
                style={{
                  margin: "0 0 0.25rem",
                  fontSize: "0.875rem",
                  color: "var(--color-text-muted, #94a3b8)",
                  fontWeight: 500,
                }}
              >
                {s.label}
              </p>
              <p style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>
                {s.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(24rem, 1fr))",
          gap: "1.5rem",
        }}
      >
        {/* Latest Payroll */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "1rem",
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.25rem",
            }}
          >
            <CreditCard
              size={20}
              style={{ color: "var(--color-primary, #6366f1)" }}
            />
            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>
              Latest Payroll Run
            </h2>
          </div>
          {stats.latestPayroll ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-muted, #94a3b8)" }}>
                  Period
                </span>
                <span style={{ fontWeight: 600 }}>
                  {stats.latestPayroll.period}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-muted, #94a3b8)" }}>
                  Status
                </span>
                <span
                  style={{
                    fontWeight: 600,
                    color:
                      stats.latestPayroll.status === "COMPLETED"
                        ? "var(--color-success, #10b981)"
                        : "var(--color-warning, #f59e0b)",
                  }}
                >
                  {stats.latestPayroll.status}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-muted, #94a3b8)" }}>
                  Gross Outflow (NPR)
                </span>
                <span style={{ fontWeight: 600 }}>
                  {stats.latestPayroll.totals?.grossNPR?.toLocaleString() ?? 0}
                </span>
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--color-text-muted, #94a3b8)" }}>
              No payroll runs found.
            </p>
          )}
        </div>

        {/* Performance Metrics */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "1rem",
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.25rem",
            }}
          >
            <TrendingUp
              size={20}
              style={{ color: "var(--color-primary, #6366f1)" }}
            />
            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>
              Performance Reviews
            </h2>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-text-muted, #94a3b8)" }}>
                Company Average Rating
              </span>
              <span style={{ fontWeight: 600, fontSize: "1.25rem" }}>
                {stats.performance?.averageRating
                  ? stats.performance.averageRating.toFixed(1)
                  : "N/A"}{" "}
                <span
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--color-warning, #f59e0b)",
                  }}
                >
                  ★
                </span>
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-text-muted, #94a3b8)" }}>
                Total Reviews Logged
              </span>
              <span style={{ fontWeight: 600 }}>
                {stats.performance?.reviewCount ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default AdminDashboard;
