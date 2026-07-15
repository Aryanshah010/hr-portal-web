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

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
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
