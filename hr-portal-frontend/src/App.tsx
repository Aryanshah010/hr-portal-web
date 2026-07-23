import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext.js";
import { ToastProvider } from "@/context/ToastContext.js";
import { ErrorBoundary } from "@/components/ErrorBoundary.js";
import { ProtectedRoute } from "@/components/ProtectedRoute.js";
import { RoleGuard } from "@/components/RoleGuard.js";
import { Layout } from "@/components/layout/Layout.js";
import { LandingPage } from "@/pages/LandingPage.js";

// Auth Pages
import Login from "@/pages/auth/Login.js";
import Register from "@/pages/auth/Register.js";
import MfaVerify from "@/pages/auth/MfaVerify.js";
import MfaSetup from "@/pages/auth/MfaSetup.js";

// Employee Pages
import EmployeeDashboard from "@/pages/employee/EmployeeDashboard.js";
import Profile from "@/pages/employee/Profile.js";
import { Attendance } from "@/pages/employee/Attendance.js";
import Payslips from "@/pages/employee/Payslips.js";
import Documents from "@/pages/employee/Documents.js";
import Reviews from "@/pages/employee/Reviews.js";

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard.js";
import EmployeeManagement from "@/pages/admin/EmployeeManagement.js";
import AuditLogViewer from "@/pages/admin/AuditLogViewer.js";
import ReviewManagement from "./pages/admin/ReviewManagement";
import Transactions from "./pages/admin/Transactions";
import PayrollRuns from "./pages/admin/PayrollRuns";

import { ToastContainer } from "@/components/ToastContainer.js";

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <ToastContainer />
          <BrowserRouter>
            <Routes>
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

              <Route path="/mfa/verify" element={<MfaVerify />} />
              <Route path="/mfa/setup" element={<MfaSetup />} />

              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                {/* /dashboard is the generic post-login landing spot, so HR is
                    forwarded to their own dashboard rather than shown a denial. */}
                <Route
                  path="/dashboard"
                  element={
                    <RoleGuard
                      allowedRoles={["Employee"]}
                      fallback={<Navigate to="/admin/dashboard" replace />}
                    >
                      <EmployeeDashboard />
                    </RoleGuard>
                  }
                />
                <Route path="/profile" element={<Profile />} />
                <Route
                  path="/attendance"
                  element={
                    <RoleGuard allowedRoles={["Employee"]}>
                      <Attendance />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/payslips"
                  element={
                    <RoleGuard allowedRoles={["Employee"]}>
                      <Payslips />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/documents"
                  element={
                    <RoleGuard allowedRoles={["Employee"]}>
                      <Documents />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/reviews"
                  element={
                    <RoleGuard allowedRoles={["Employee"]}>
                      <Reviews />
                    </RoleGuard>
                  }
                />

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
                <Route
                  path="/admin/employees"
                  element={
                    <RoleGuard allowedRoles={["HR"]}>
                      <EmployeeManagement />
                    </RoleGuard>
                  }
                />

                <Route
                  path="/admin/audit"
                  element={
                    <RoleGuard allowedRoles={["HR"]}>
                      <AuditLogViewer />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/admin/payroll"
                  element={
                    <RoleGuard allowedRoles={["HR"]}>
                      <PayrollRuns />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/admin/transactions"
                  element={
                    <RoleGuard allowedRoles={["HR"]}>
                      <Transactions />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/admin/reviews"
                  element={
                    <RoleGuard allowedRoles={["HR"]}>
                      <ReviewManagement />
                    </RoleGuard>
                  }
                />
              </Route>

              {/*  Fallback  */}
              <Route
                path="/"
                element={
                  <ProtectedRoute invertGuard fallback="/dashboard">
                    <LandingPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
