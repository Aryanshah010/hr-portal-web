import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext.js";
import type { Role } from "@/types/index.js";

function AccessDeniedFallback() {
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60dvh",
        padding: "2rem",
      }}
    >
      <div
        style={{
          maxWidth: "28rem",
          width: "100%",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        {/* Shield / lock icon */}
        <svg
          aria-hidden="true"
          width="56"
          height="56"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--color-danger, #ef4444)", opacity: 0.8 }}
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>

        <div>
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "var(--color-text, #f1f5f9)",
              margin: "0 0 0.5rem",
            }}
          >
            Access Denied
          </h1>
          <p
            style={{
              fontSize: "0.9rem",
              color: "var(--color-text-muted, #94a3b8)",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            You do not have permission to perform this action.
          </p>
        </div>

        <a
          href="/dashboard"
          style={{
            marginTop: "0.5rem",
            padding: "0.5rem 1.25rem",
            borderRadius: "0.5rem",
            background: "var(--color-primary, #6366f1)",
            color: "#fff",
            textDecoration: "none",
            fontSize: "0.875rem",
            fontWeight: 500,
            display: "inline-block",
          }}
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}

interface RoleGuardProps {
  allowedRoles: Role[];
  children: ReactNode;
  renderNothing?: boolean;
  fallback?: ReactNode;
}

export function RoleGuard({
  allowedRoles,
  children,
  renderNothing = false,
  fallback,
}: RoleGuardProps) {
  const { role, loading, isAuthenticated } = useAuth();

  if (loading || !isAuthenticated) {
    return null;
  }

  const permitted = role !== null && allowedRoles.includes(role);

  if (permitted) {
    return <>{children}</>;
  }

  if (renderNothing) {
    return null;
  }

  return <>{fallback ?? <AccessDeniedFallback />}</>;
}

export default RoleGuard;
