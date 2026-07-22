import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext.js";
import {
  User,
  Clock,
  FileText,
  Star,
  CreditCard,
  Shield,
  LayoutDashboard,
} from "lucide-react";

export function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const baseLinks = [
    {
      to: "/dashboard",
      icon: <LayoutDashboard size={20} />,
      label: "Dashboard",
    },
    { to: "/profile", icon: <User size={20} />, label: "Profile" },
    { to: "/attendance", icon: <Clock size={20} />, label: "Attendance" },
    { to: "/payslips", icon: <CreditCard size={20} />, label: "Payslips" },
    { to: "/documents", icon: <FileText size={20} />, label: "Documents" },
    { to: "/reviews", icon: <Star size={20} />, label: "Reviews" },
  ];

  const adminLinks = [
    {
      to: "/admin/dashboard",
      icon: <LayoutDashboard size={20} />,
      label: "Dashboard",
    },
    { to: "/profile", icon: <User size={20} />, label: "Profile" },
    { to: "/admin/employees", icon: <User size={20} />, label: "Employees" },
    { to: "/admin/payroll", icon: <CreditCard size={20} />, label: "Payroll" },
    {
      to: "/admin/transactions",
      icon: <FileText size={20} />,
      label: "Transactions",
    },
    { to: "/admin/reviews", icon: <Star size={20} />, label: "Reviews" },
    { to: "/admin/audit", icon: <Shield size={20} />, label: "Audit Logs" },
  ];

  const links = user.role === "HR" ? adminLinks : baseLinks;

  return (
    <aside
      style={{
        width: "16rem",
        backgroundColor: "rgba(255,255,255,0.02)",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        flexDirection: "column",
        padding: "1.5rem 1rem",
      }}
    >
      <div
        style={{
          padding: "0 0.5rem",
          marginBottom: "2rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <div
          style={{
            width: "2rem",
            height: "2rem",
            background: "var(--color-primary, #6366f1)",
            borderRadius: "0.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
          }}
        >
          N
        </div>
        <span style={{ fontSize: "1.1rem", fontWeight: 600, color: "white" }}>
          NexusHR
        </span>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {links.map((link) => {
          const isActive = location.pathname.startsWith(link.to);
          return (
            <Link
              key={link.to}
              to={link.to}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                textDecoration: "none",
                color: isActive ? "white" : "var(--color-text-muted, #94a3b8)",
                backgroundColor: isActive
                  ? "rgba(255,255,255,0.08)"
                  : "transparent",
                fontWeight: isActive ? 500 : 400,
                transition: "background-color 0.2s, color 0.2s",
              }}
              onMouseOver={(e) => {
                if (!isActive)
                  e.currentTarget.style.backgroundColor =
                    "rgba(255,255,255,0.04)";
              }}
              onMouseOut={(e) => {
                if (!isActive)
                  e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {link.icon}
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
