// ─────────────────────────────────────────────────────────────────────────────
// components/RoleGuard.tsx
//
// Client-side RBAC guard. Wraps routes or UI sections that are restricted to
// specific roles. This is a defense-in-depth UX measure — the backend's
// restrictTo() middleware is the authoritative enforcement point.
//
// Backend restrictTo() signature (authGuard.js):
//   restrictTo(...roles) — roles are the exact string values from ROLES:
//     "Employee" | "HR"
//
// Role hierarchy for this portal:
//   HR       — full access to all routes + HR-only admin operations
//   Employee — access to self-service routes only
//
// Behaviour:
//  • loading          → render skeleton (same as ProtectedRoute)
//  • !isAuthenticated → render nothing / redirect (ProtectedRoute handles this
//                        upstream; RoleGuard assumes it is always inside one)
//  • role not allowed → render the fallback (default: 403 Access Denied UI)
//  • role allowed     → render children
//
// Usage (wrapping an entire route):
//   <Route
//     path="/admin/payroll"
//     element={
//       <ProtectedRoute>
//         <RoleGuard allowedRoles={["HR"]}>
//           <PayrollPage />
//         </RoleGuard>
//       </ProtectedRoute>
//     }
//   />
//
// Usage (hiding a UI section):
//   <RoleGuard allowedRoles={["HR"]} renderNothing>
//     <ApproveButton />
//   </RoleGuard>
// ─────────────────────────────────────────────────────────────────────────────

import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext.js";
import type { Role } from "@/types/index.js";

// ─── 403 Fallback UI ─────────────────────────────────────────────────────────
// Shown when the user is authenticated but lacks the required role.
// Matches the backend's 403 response message:
//   "You do not have permission to perform this action."

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

// ─── Component ────────────────────────────────────────────────────────────────

interface RoleGuardProps {
  /**
   * The roles that are permitted to see this content.
   * Values must match the backend ROLES object exactly: "Employee" | "HR".
   */
  allowedRoles: Role[];
  children: ReactNode;
  /**
   * When true, renders nothing instead of the 403 fallback UI.
   * Use for hiding UI elements (e.g., action buttons) rather than full pages.
   */
  renderNothing?: boolean;
  /**
   * Custom fallback to render when the role check fails.
   * Defaults to <AccessDeniedFallback />.
   */
  fallback?: ReactNode;
}

export function RoleGuard({
  allowedRoles,
  children,
  renderNothing = false,
  fallback,
}: RoleGuardProps) {
  const { role, loading, isAuthenticated } = useAuth();

  // While the session is loading, render nothing — ProtectedRoute shows the
  // skeleton upstream. Rendering the fallback here would cause a flash.
  if (loading || !isAuthenticated) {
    return null;
  }

  // Check if the current user's role is in the allowed list.
  // role is typed as Role | null; null means unauthenticated (shouldn't reach
  // here inside ProtectedRoute, but guard defensively).
  const permitted = role !== null && allowedRoles.includes(role);

  if (permitted) {
    return <>{children}</>;
  }

  // Not permitted — render nothing or the fallback UI.
  if (renderNothing) {
    return null;
  }

  return <>{fallback ?? <AccessDeniedFallback />}</>;
}

export default RoleGuard;
