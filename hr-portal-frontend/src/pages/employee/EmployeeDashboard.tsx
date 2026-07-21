import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext.js";
import { getMyAttendance } from "@/services/attendanceService.js";
import { getMyReviews } from "@/services/reviewService.js";
import type { Attendance, PerformanceReview } from "@/types/index.js";
import {
  User,
  Clock,
  FileText,
  Star,
  ChevronRight,
  CreditCard,
  Shield,
  TrendingUp,
} from "lucide-react";

const card = (children: React.ReactNode, extra: React.CSSProperties = {}) => (
  <div
    style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "1rem",
      backdropFilter: "blur(12px)",
      padding: "1.5rem",
      ...extra,
    }}
  >
    {children}
  </div>
);

const statusColor = (s: Attendance["status"]) =>
  s === "APPROVED" ? "#10b981" : s === "REJECTED" ? "#ef4444" : "#f59e0b";

export function EmployeeDashboard() {
  const { user } = useAuth();
  const [recentAttendance, setRecentAttendance] = useState<Attendance[]>([]);
  const [recentReviews, setRecentReviews] = useState<PerformanceReview[]>([]);

  useEffect(() => {
    getMyAttendance({ limit: 3 })
      .then((r) => setRecentAttendance(r.data.items))
      .catch(() => {});
    getMyReviews()
      .then((r) => setRecentReviews(r.data.reviews.slice(0, 2)))
      .catch(() => {});
  }, []);

  const navCards = [
    {
      to: "/profile",
      icon: <User size={22} />,
      label: "My Profile",
      desc: "View and update your info",
      color: "#6366f1",
      bg: "rgba(99,102,241,0.12)",
    },
    {
      to: "/attendance",
      icon: <Clock size={22} />,
      label: "Attendance",
      desc: "Log time & request leave",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.12)",
    },
    {
      to: "/payslips",
      icon: <CreditCard size={22} />,
      label: "Payslips",
      desc: "Look up your payslip",
      color: "#10b981",
      bg: "rgba(16,185,129,0.12)",
    },
    {
      to: "/documents",
      icon: <FileText size={22} />,
      label: "Documents",
      desc: "Upload bank proof & ID",
      color: "#8b5cf6",
      bg: "rgba(139,92,246,0.12)",
    },
    {
      to: "/reviews",
      icon: <TrendingUp size={22} />,
      label: "Reviews",
      desc: "View performance history",
      color: "#f97316",
      bg: "rgba(249,115,22,0.12)",
    },
  ];

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
        {/* Hero greeting */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <h1
              style={{
                margin: "0 0 0.25rem",
                fontSize: "1.75rem",
                fontWeight: 700,
              }}
            >
              Welcome back, {user?.name ?? "Employee"} 👋
            </h1>
            <p
              style={{
                margin: 0,
                color: "var(--color-text-muted, #94a3b8)",
                fontSize: "0.95rem",
              }}
            >
              Here's an overview of your HR activity.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.2)",
              borderRadius: "0.75rem",
              fontSize: "0.85rem",
              color: "#10b981",
            }}
          >
            <Shield size={16} />
            Session Secured
          </div>
        </div>

        {/* Navigation cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(16rem, 1fr))",
            gap: "1rem",
          }}
        >
          {navCards.map(({ to, icon, label, desc, color, bg }) => (
            <Link
              key={to}
              to={to}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "1rem",
                  backdropFilter: "blur(12px)",
                  padding: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  transition: "border-color 0.2s, background 0.2s",
                  cursor: "pointer",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = color;
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                }}
              >
                <div
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "0.75rem",
                    background: bg,
                    color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: "0 0 0.2rem",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                    }}
                  >
                    {label}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.8rem",
                      color: "var(--color-text-muted, #94a3b8)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {desc}
                  </p>
                </div>
                <ChevronRight
                  size={16}
                  style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }}
                />
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom row: recent attendance + recent reviews */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
          }}
        >
          {/* Recent Attendance */}
          {card(
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Clock size={16} style={{ color: "#f59e0b" }} /> Recent
                  Attendance
                </h2>
                <Link
                  to="/attendance"
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--color-primary, #6366f1)",
                    textDecoration: "none",
                  }}
                >
                  View all →
                </Link>
              </div>
              {recentAttendance.length === 0 ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.875rem",
                    color: "var(--color-text-muted, #94a3b8)",
                    textAlign: "center",
                    padding: "1.5rem 0",
                  }}
                >
                  No records yet.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {recentAttendance.map((a) => (
                    <div
                      key={a._id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            margin: "0 0 0.15rem",
                            fontSize: "0.875rem",
                            fontWeight: 500,
                          }}
                        >
                          {a.attendanceDate}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.75rem",
                            color: "var(--color-text-muted, #94a3b8)",
                          }}
                        >
                          {a.recordType === "LEAVE"
                            ? `Leave · ${a.leaveType}`
                            : "Attendance"}
                        </p>
                      </div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          padding: "0.2rem 0.6rem",
                          borderRadius: "999px",
                          background: `${statusColor(a.status)}22`,
                          color: statusColor(a.status),
                        }}
                      >
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>,
          )}

          {/* Recent Reviews */}
          {card(
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Star size={16} style={{ color: "#f97316" }} /> Recent Reviews
                </h2>
                <Link
                  to="/reviews"
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--color-primary, #6366f1)",
                    textDecoration: "none",
                  }}
                >
                  View all →
                </Link>
              </div>
              {recentReviews.length === 0 ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.875rem",
                    color: "var(--color-text-muted, #94a3b8)",
                    textAlign: "center",
                    padding: "1.5rem 0",
                  }}
                >
                  No reviews yet.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {recentReviews.map((r) => (
                    <div
                      key={r._id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            margin: "0 0 0.15rem",
                            fontSize: "0.875rem",
                            fontWeight: 500,
                          }}
                        >
                          {r.period}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.75rem",
                            color: "var(--color-text-muted, #94a3b8)",
                          }}
                        >
                          {new Date(r.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.2rem",
                        }}
                      >
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill={i < r.rating ? "#f59e0b" : "transparent"}
                            stroke={
                              i < r.rating ? "#f59e0b" : "rgba(255,255,255,0.2)"
                            }
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>,
          )}
        </div>
      </div>
    </div>
  );
}
export default EmployeeDashboard;
