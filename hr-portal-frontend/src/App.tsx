import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext.js";
import { ToastProvider } from "@/context/ToastContext.js";
import { ErrorBoundary } from "@/components/ErrorBoundary.js";
import { ProtectedRoute } from "@/components/ProtectedRoute.js";
import { RoleGuard } from "@/components/RoleGuard.js";
import { Layout } from "@/components/layout/Layout.js";

// ─── Auth Pages ───────────────────────────────────────────────────────────────
import Login from "@/pages/auth/Login.js";
import Register from "@/pages/auth/Register.js";
import MfaVerify from "@/pages/auth/MfaVerify.js";

// ─── Employee Pages ───────────────────────────────────────────────────────────
import EmployeeDashboard from "@/pages/employee/EmployeeDashboard.js";
import Profile from "@/pages/employee/Profile.js";
import { Attendance } from "@/pages/employee/Attendance.js";
import Payslips from "@/pages/employee/Payslips.js";
import Documents from "@/pages/employee/Documents.js";
import Reviews from "@/pages/employee/Reviews.js";

// ─── Admin Pages ──────────────────────────────────────────────────────────────
import AdminDashboard from "@/pages/admin/AdminDashboard.js";

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* ── Public-only routes (redirect to /dashboard if authenticated) ── */}
              <Route
                path="/login"
                element={
                  <ProtectedRoute invertGuard fallback="/dashboard">
                    <Login />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <ProtectedRoute invertGuard fallback="/dashboard">
                    <Register />
                  </ProtectedRoute>
                }
              />

              {/* ── MFA: self-gated (redirects to /dashboard when not mfaPending) ── */}
              <Route path="/mfa/verify" element={<MfaVerify />} />

              {/* ── Protected Employee Routes (wrapped in Layout) ───────────────── */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<EmployeeDashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/payslips" element={<Payslips />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/reviews" element={<Reviews />} />

                {/* ── HR Admin Routes ────────────────────────────────────────────── */}
                <Route
                  path="/admin"
                  element={
                    <RoleGuard allowedRoles={["HR"]}>
                      <Navigate to="/admin/dashboard" replace />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/admin/dashboard"
                  element={
                    <RoleGuard allowedRoles={["HR"]}>
                      <AdminDashboard />
                    </RoleGuard>
                  }
                />
              </Route>

              {/* ── Fallback ───────────────────────────────────────────────────── */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
