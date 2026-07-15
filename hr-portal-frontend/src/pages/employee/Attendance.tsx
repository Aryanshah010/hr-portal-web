import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Clock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";

import { useToast } from "@/context/ToastContext.js";
import {
  submitAttendance,
  getMyAttendance,
} from "@/services/attendanceService.js";
import type { Attendance } from "@/types/index.js";

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "1rem",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

function StatusBadge({ status }: { status: Attendance["status"] }) {
  const colors: Record<Attendance["status"], { bg: string; text: string }> = {
    PENDING: {
      bg: "rgba(245,158,11,0.15)",
      text: "var(--color-warning, #f59e0b)",
    },
    APPROVED: {
      bg: "rgba(34,197,94,0.15)",
      text: "var(--color-success, #22c55e)",
    },
    REJECTED: {
      bg: "rgba(239,68,68,0.15)",
      text: "var(--color-danger, #ef4444)",
    },
  };
  const c = colors[status];
  return (
    <span
      style={{
        padding: "0.2rem 0.65rem",
        borderRadius: "999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        background: c.bg,
        color: c.text,
      }}
    >
      {status}
    </span>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem 1rem",
  backgroundColor: "rgba(0,0,0,0.25)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "0.6rem",
  color: "var(--color-text, #f8fafc)",
  fontSize: "0.95rem",
  outline: "none",
  boxSizing: "border-box",
};

const attendanceSchema = z.discriminatedUnion("recordType", [
  z.object({
    recordType: z.literal("ATTENDANCE"),
    attendanceDate: z.string().min(1, "Date is required"),
    checkInAt: z.string().min(1, "Check-in time is required"),
    checkOutAt: z.string().optional(),
    reason: z.string().max(500).optional(),
  }),
  z.object({
    recordType: z.literal("LEAVE"),
    attendanceDate: z.string().min(1, "Date is required"),
    leaveType: z.enum(["ANNUAL", "SICK", "UNPAID", "OTHER"], {
      message: "Select a leave type",
    }),
    reason: z.string().max(500).optional(),
  }),
]);

type AttendanceFormValues = z.infer<typeof attendanceSchema>;

function SubmitTab() {
  const toast = useToast();
  const [recordType, setRecordType] = useState<"ATTENDANCE" | "LEAVE">(
    "ATTENDANCE",
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: { recordType: "ATTENDANCE", attendanceDate: "" },
  });

  const handleTypeChange = (t: "ATTENDANCE" | "LEAVE") => {
    setRecordType(t);
    reset({
      recordType: t,
      attendanceDate: watch("attendanceDate"),
    } as AttendanceFormValues);
  };

  const onSubmit = async (data: AttendanceFormValues) => {
    try {
      await submitAttendance({
        recordType: data.recordType,
        attendanceDate: data.attendanceDate,
        ...(data.recordType === "ATTENDANCE"
          ? {
              checkInAt: data.checkInAt
                ? `${data.attendanceDate}T${data.checkInAt}:00`
                : undefined,
              checkOutAt: data.checkOutAt
                ? `${data.attendanceDate}T${data.checkOutAt}:00`
                : undefined,
            }
          : {
              leaveType: data.leaveType,
            }),
        reason: ("reason" in data ? data.reason : undefined) || undefined,
      });
      toast.success("Request submitted successfully!");
      reset({ recordType, attendanceDate: "" } as AttendanceFormValues);
    } catch {
      toast.error("Failed to submit. Please try again.");
    }
  };

  const errs = errors as Record<string, { message?: string }>;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
    >
      {/* Toggle */}
      <div>
        <label
          style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: 500,
            marginBottom: "0.6rem",
          }}
        >
          Request Type
        </label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {(["ATTENDANCE", "LEAVE"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeChange(t)}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "0.5rem",
                border: "1px solid",
                borderColor:
                  recordType === t
                    ? "var(--color-primary, #6366f1)"
                    : "rgba(255,255,255,0.1)",
                background:
                  recordType === t
                    ? "rgba(99,102,241,0.2)"
                    : "rgba(255,255,255,0.03)",
                color:
                  recordType === t
                    ? "var(--color-primary, #6366f1)"
                    : "var(--color-text-muted, #94a3b8)",
                fontWeight: 500,
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {t === "ATTENDANCE" ? "🕐 Attendance" : "🌴 Leave"}
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <div>
        <label
          style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: 500,
            marginBottom: "0.5rem",
          }}
        >
          Date <span style={{ color: "var(--color-danger, #ef4444)" }}>*</span>
        </label>
        <input
          {...register("attendanceDate")}
          type="date"
          disabled={isSubmitting}
          style={{
            ...inputStyle,
            borderColor: errs.attendanceDate
              ? "var(--color-danger, #ef4444)"
              : "rgba(255,255,255,0.1)",
            colorScheme: "dark",
          }}
        />
        {errs.attendanceDate && (
          <p
            style={{
              color: "var(--color-danger, #ef4444)",
              fontSize: "0.78rem",
              margin: "0.3rem 0 0 0",
            }}
          >
            {errs.attendanceDate.message}
          </p>
        )}
      </div>

      {/* Conditional fields */}
      {recordType === "ATTENDANCE" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 500,
                marginBottom: "0.5rem",
              }}
            >
              Check-In Time{" "}
              <span style={{ color: "var(--color-danger, #ef4444)" }}>*</span>
            </label>
            <input
              {...register("checkInAt" as keyof AttendanceFormValues)}
              type="time"
              disabled={isSubmitting}
              style={{
                ...inputStyle,
                colorScheme: "dark",
                borderColor: errs.checkInAt
                  ? "var(--color-danger, #ef4444)"
                  : "rgba(255,255,255,0.1)",
              }}
            />
            {errs.checkInAt && (
              <p
                style={{
                  color: "var(--color-danger, #ef4444)",
                  fontSize: "0.78rem",
                  margin: "0.3rem 0 0 0",
                }}
              >
                {errs.checkInAt.message}
              </p>
            )}
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 500,
                marginBottom: "0.5rem",
              }}
            >
              Check-Out Time
            </label>
            <input
              {...register("checkOutAt" as keyof AttendanceFormValues)}
              type="time"
              disabled={isSubmitting}
              style={{ ...inputStyle, colorScheme: "dark" }}
            />
          </div>
        </div>
      )}

      {recordType === "LEAVE" && (
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: 500,
              marginBottom: "0.5rem",
            }}
          >
            Leave Type{" "}
            <span style={{ color: "var(--color-danger, #ef4444)" }}>*</span>
          </label>
          <select
            {...register("leaveType" as keyof AttendanceFormValues)}
            disabled={isSubmitting}
            style={{
              ...inputStyle,
              borderColor: errs.leaveType
                ? "var(--color-danger, #ef4444)"
                : "rgba(255,255,255,0.1)",
            }}
          >
            <option value="">Select leave type…</option>
            <option value="ANNUAL">Annual Leave</option>
            <option value="SICK">Sick Leave</option>
            <option value="UNPAID">Unpaid Leave</option>
            <option value="OTHER">Other</option>
          </select>
          {errs.leaveType && (
            <p
              style={{
                color: "var(--color-danger, #ef4444)",
                fontSize: "0.78rem",
                margin: "0.3rem 0 0 0",
              }}
            >
              {errs.leaveType.message}
            </p>
          )}
        </div>
      )}

      {/* Reason */}
      <div>
        <label
          style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: 500,
            marginBottom: "0.5rem",
          }}
        >
          Reason{" "}
          <span
            style={{
              color: "var(--color-text-muted, #94a3b8)",
              fontWeight: 400,
            }}
          >
            (optional)
          </span>
        </label>
        <textarea
          {...register("reason" as keyof AttendanceFormValues)}
          rows={3}
          placeholder="Additional context for your request…"
          disabled={isSubmitting}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          padding: "0.875rem 1.5rem",
          backgroundColor: "var(--color-primary, #6366f1)",
          color: "white",
          border: "none",
          borderRadius: "0.75rem",
          fontSize: "0.95rem",
          fontWeight: 500,
          cursor: isSubmitting ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          alignSelf: "flex-start",
          opacity: isSubmitting ? 0.7 : 1,
          transition: "background-color 0.2s",
        }}
      >
        {isSubmitting ? (
          <>
            <Loader2
              size={16}
              style={{ animation: "spin 1s linear infinite" }}
            />{" "}
            Submitting…
          </>
        ) : (
          <>
            <CheckCircle2 size={16} /> Submit Request
          </>
        )}
      </button>
    </form>
  );
}

function HistoryTab() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const PAGE_SIZE = 10;

  const fetchPage = (p: number) => {
    setLoading(true);
    setError(null);
    getMyAttendance({ page: p, limit: PAGE_SIZE })
      .then((res) => {
        setRecords(res.data.items);
        setTotalPages(res.data.pages);
        setPage(res.data.page);
      })
      .catch(() => setError("Failed to load records."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPage(1);
  }, []);

  return (
    <div>
      {loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            color: "var(--color-text-muted, #94a3b8)",
            padding: "2rem 0",
          }}
        >
          <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
          Loading records…
        </div>
      )}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--color-danger, #ef4444)",
            padding: "0.75rem",
            background: "rgba(239,68,68,0.1)",
            borderRadius: "0.5rem",
          }}
        >
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {!loading && !error && records.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "3rem 1rem",
            color: "var(--color-text-muted, #94a3b8)",
          }}
        >
          <ClipboardList
            size={40}
            style={{ opacity: 0.3, marginBottom: "1rem" }}
          />
          <p style={{ margin: 0 }}>No attendance records yet.</p>
        </div>
      )}
      {!loading && records.length > 0 && (
        <>
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
                  {[
                    "Date",
                    "Type",
                    "Leave Type",
                    "Check In",
                    "Check Out",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "0.75rem 0.5rem",
                        color: "var(--color-text-muted, #94a3b8)",
                        fontWeight: 500,
                        fontSize: "0.78rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr
                    key={r._id}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      transition: "background 0.15s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255,255,255,0.02)")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td style={{ padding: "0.875rem 0.5rem", fontWeight: 500 }}>
                      {new Date(r.attendanceDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "0.875rem 0.5rem" }}>
                      <span
                        style={{
                          padding: "0.2rem 0.55rem",
                          borderRadius: "999px",
                          fontSize: "0.73rem",
                          fontWeight: 600,
                          background:
                            r.recordType === "ATTENDANCE"
                              ? "rgba(99,102,241,0.15)"
                              : "rgba(139,92,246,0.15)",
                          color:
                            r.recordType === "ATTENDANCE"
                              ? "var(--color-primary, #6366f1)"
                              : "#a78bfa",
                        }}
                      >
                        {r.recordType}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "0.875rem 0.5rem",
                        color: "var(--color-text-muted, #94a3b8)",
                      }}
                    >
                      {r.leaveType ?? "—"}
                    </td>
                    <td
                      style={{
                        padding: "0.875rem 0.5rem",
                        color: "var(--color-text-muted, #94a3b8)",
                      }}
                    >
                      {r.checkInAt
                        ? new Date(r.checkInAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td
                      style={{
                        padding: "0.875rem 0.5rem",
                        color: "var(--color-text-muted, #94a3b8)",
                      }}
                    >
                      {r.checkOutAt
                        ? new Date(r.checkOutAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td style={{ padding: "0.875rem 0.5rem" }}>
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "1rem",
              paddingTop: "1rem",
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <span
              style={{
                fontSize: "0.83rem",
                color: "var(--color-text-muted, #94a3b8)",
              }}
            >
              Page {page} of {totalPages}
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {[
                {
                  icon: <ChevronLeft size={16} />,
                  disabled: page <= 1,
                  onClick: () => fetchPage(page - 1),
                  label: "Previous",
                },
                {
                  icon: <ChevronRight size={16} />,
                  disabled: page >= totalPages,
                  onClick: () => fetchPage(page + 1),
                  label: "Next",
                },
              ].map(({ icon, disabled, onClick, label }) => (
                <button
                  key={label}
                  onClick={onClick}
                  disabled={disabled}
                  aria-label={label}
                  style={{
                    padding: "0.4rem 0.75rem",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "0.5rem",
                    background: "rgba(255,255,255,0.04)",
                    color: disabled
                      ? "rgba(255,255,255,0.2)"
                      : "var(--color-text, #f8fafc)",
                    cursor: disabled ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function Attendance() {
  const [activeTab, setActiveTab] = useState<"submit" | "history">("submit");

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--color-bg, #0f1117)",
        color: "var(--color-text, #f8fafc)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "2rem 1rem",
      }}
    >
      <div
        style={{
          maxWidth: "56rem",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        {/* Header */}
        <div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              margin: "0 0 0.25rem 0",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
            }}
          >
            <Clock size={26} color="var(--color-primary, #6366f1)" />
            Attendance
          </h1>
          <p
            style={{
              color: "var(--color-text-muted, #94a3b8)",
              margin: 0,
              fontSize: "0.9rem",
            }}
          >
            Submit requests and view your attendance history.
          </p>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            paddingBottom: "0",
          }}
        >
          {[
            {
              id: "submit" as const,
              label: "✏️ Submit Request",
              icon: <CalendarDays size={15} />,
            },
            {
              id: "history" as const,
              label: "📋 My History",
              icon: <ClipboardList size={15} />,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "0.625rem 1.25rem",
                background: "none",
                border: "none",
                borderBottom: `2px solid ${activeTab === tab.id ? "var(--color-primary, #6366f1)" : "transparent"}`,
                color:
                  activeTab === tab.id
                    ? "var(--color-primary, #6366f1)"
                    : "var(--color-text-muted, #94a3b8)",
                fontWeight: activeTab === tab.id ? 600 : 400,
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                marginBottom: "-1px",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ ...glass, padding: "1.75rem" }}>
          {activeTab === "submit" ? <SubmitTab /> : <HistoryTab />}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default Attendance;
