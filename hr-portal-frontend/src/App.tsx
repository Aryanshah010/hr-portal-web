import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext.js';
import { ToastProvider } from '@/context/ToastContext.js';
import { ErrorBoundary } from '@/components/ErrorBoundary.js';
import { ProtectedRoute } from '@/components/ProtectedRoute.js';

// Auth Pages
import Login from '@/pages/auth/Login.js';
import Register from '@/pages/auth/Register.js';
import MfaVerify from '@/pages/auth/MfaVerify.js';

// App Pages (Placeholders)
const Dashboard = () => (
  <div style={{ padding: '2rem', color: 'white' }}>
    <h1>Dashboard</h1>
    <p>Welcome to the HR Portal!</p>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public/Auth Routes (Inverted Guard: redirect to dashboard if already logged in) */}
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
              {/* MFA Verify: Unprotected by ProtectedRoute directly, it handles its own redirect if mfaPending is false */}
              <Route path="/mfa/verify" element={<MfaVerify />} />

              {/* Protected App Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Redirect root to dashboard */}
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
