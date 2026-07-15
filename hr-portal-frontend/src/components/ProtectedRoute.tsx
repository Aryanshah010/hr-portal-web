import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext.js";
import { AccountStatus } from "@/types/index.js";

function AuthLoadingSkeleton() {
  return (
    <div
      role="status"
      aria-label="Verifying session…"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        background: "var(--color-bg, #0f1117)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        {/* Spinner */}
        <div
          aria-hidden="true"
          style={{
            width: "2.5rem",
            height: "2.5rem",
            borderRadius: "50%",
            border: "3px solid rgba(255,255,255,0.1)",
            borderTopColor: "var(--color-primary, #6366f1)",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <span
          style={{
            fontSize: "0.875rem",
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.05em",
          }}
        >
          Verifying session…
        </span>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

interface ProtectedRouteProps {
  children: ReactNode;
  invertGuard?: boolean;
  fallback?: string;
}

export function ProtectedRoute({
  children,
  invertGuard = false,
  fallback = "/dashboard",
}: ProtectedRouteProps) {
  const { user, loading, mfaPending, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoadingSkeleton />;
  }

  if (invertGuard) {
    if (isAuthenticated) {
      const params = new URLSearchParams(location.search);
      const next = params.get("redirect");
      return <Navigate to={next ?? fallback} replace />;
    }
    return <>{children}</>;
  }

  if (mfaPending) {
    return <Navigate to="/mfa/verify" replace />;
  }

  if (user === undefined || user === null) {
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectTo}`} replace />;
  }

  if (user.accountStatus === AccountStatus.Pending) {
    return <Navigate to="/login?status=pending" replace />;
  }
  if (user.accountStatus === AccountStatus.Suspended) {
    return <Navigate to="/login?status=suspended" replace />;
  }
  if (user.accountStatus === AccountStatus.Registration) {
    return <Navigate to="/register/complete" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
