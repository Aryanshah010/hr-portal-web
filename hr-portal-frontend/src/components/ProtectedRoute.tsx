// ─────────────────────────────────────────────────────────────────────────────
// components/ProtectedRoute.tsx
//
// Route guard that enforces authentication before rendering a protected page.
//
// Behaviour matrix (mirrors backend protect middleware exactly):
//  • loading === true          → render a full-page skeleton (AuthContext is
//                                 performing the initial GET /auth/me check)
//  • user === undefined        → unauthenticated: redirect to /login,
//                                 preserving the attempted URL as ?redirect=
//  • mfaPending === true       → MFA step incomplete: redirect to /mfa/verify
//                                 (the backend requires mfaVerified in the JWT)
//  • user.accountStatus !== ACTIVE → account not approved or suspended:
//                                 redirect to /login with a ?status= param
//                                 (matches the backend OAuth callback pattern)
//  • isAuthenticated === true  → render children
//
// Usage:
//   <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
// ─────────────────────────────────────────────────────────────────────────────

import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext.js";
import { AccountStatus } from "@/types/index.js";

// ─── Full-page loading skeleton ───────────────────────────────────────────────
// Shown only during the brief window while AuthContext resolves /auth/me.
// Prevents a flash of redirect on hard refresh.

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

      {/* Keyframe injected inline so the component is self-contained */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ProtectedRouteProps {
  children: ReactNode;
  /**
   * When true, a user who IS authenticated will be redirected to `fallback`
   * instead of rendered. Useful for login/register pages that should not be
   * accessible once signed in.
   */
  invertGuard?: boolean;
  /**
   * Where to redirect an authenticated user when invertGuard is true.
   * Defaults to "/dashboard".
   */
  fallback?: string;
}

export function ProtectedRoute({
  children,
  invertGuard = false,
  fallback = "/dashboard",
}: ProtectedRouteProps) {
  const { user, loading, mfaPending, isAuthenticated } = useAuth();
  const location = useLocation();

  // ── 1. Still resolving session — show skeleton, never redirect yet ──────────
  if (loading) {
    return <AuthLoadingSkeleton />;
  }

  // ── invertGuard: public-only pages (login, register) ────────────────────────
  // If the user is fully authenticated and tries to visit /login, send them
  // to the app instead.
  if (invertGuard) {
    if (isAuthenticated) {
      // Honor a ?redirect= param in case we bounced them here from a deep link.
      const params = new URLSearchParams(location.search);
      const next = params.get("redirect");
      return <Navigate to={next ?? fallback} replace />;
    }
    // Not authenticated → render the public page normally.
    return <>{children}</>;
  }

  // ── 2. MFA step pending — TOTP not yet verified ──────────────────────────────
  // Backend protect middleware requires mfaVerified in the JWT.
  // We redirect to /mfa/verify so the user can complete the challenge.
  if (mfaPending) {
    return <Navigate to="/mfa/verify" replace />;
  }

  // ── 3. Not authenticated at all ──────────────────────────────────────────────
  // user === undefined means /auth/me returned 401.
  if (user === undefined || user === null) {
    // Preserve the intended destination so we can redirect back after login.
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectTo}`} replace />;
  }

  // ── 4. Account status check ───────────────────────────────────────────────────
  // Backend protect middleware: user.accountStatus must be "ACTIVE".
  // Mirrors the OAuth callback redirect pattern in authController.js:
  //   PENDING_APPROVAL → /login?status=pending
  //   SUSPENDED        → /login?status=suspended
  if (user.accountStatus === AccountStatus.Pending) {
    return <Navigate to="/login?status=pending" replace />;
  }
  if (user.accountStatus === AccountStatus.Suspended) {
    return <Navigate to="/login?status=suspended" replace />;
  }
  if (user.accountStatus === AccountStatus.Registration) {
    // Should not normally reach here — registration flow handles this.
    return <Navigate to="/register/complete" replace />;
  }

  // ── 5. Fully authenticated with ACTIVE account — render the protected page ───
  return <>{children}</>;
}

export default ProtectedRoute;
