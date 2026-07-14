// ─────────────────────────────────────────────────────────────────────────────
// components/ErrorBoundary.tsx
//
// Catches React render errors in the component tree and displays a safe,
// generic fallback UI.
//
// Matches the backend's "Generic System Error Fallbacks" requirement:
// "An internal system anomaly occurred. Please reference infrastructure administration logs."
//
// Usage:
//   <ErrorBoundary>
//     <App />
//   </ErrorBoundary>
// ─────────────────────────────────────────────────────────────────────────────

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Optional custom fallback UI. If not provided, uses the generic system error UI. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to the console for debugging (or to an error reporting service)
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <SystemAnomalyFallback />;
    }

    return this.props.children;
  }
}

// ─── Generic Fallback UI ──────────────────────────────────────────────────────

function SystemAnomalyFallback() {
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        padding: "2rem",
        background: "var(--color-bg, #0f1117)",
        color: "var(--color-text, #f1f5f9)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "32rem",
          width: "100%",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
          padding: "2.5rem",
          backgroundColor: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "1rem",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
      >
        {/* Warning Icon */}
        <svg
          aria-hidden="true"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--color-warning, #f59e0b)", opacity: 0.9 }}
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>

        <div>
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              margin: "0 0 0.75rem",
              letterSpacing: "-0.025em",
            }}
          >
            System Anomaly
          </h1>
          <p
            style={{
              fontSize: "0.9375rem",
              color: "var(--color-text-muted, #94a3b8)",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            An internal system anomaly occurred. Please reference infrastructure
            administration logs.
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: "0.5rem",
            padding: "0.625rem 1.25rem",
            borderRadius: "0.5rem",
            background: "var(--color-primary, #6366f1)",
            color: "#ffffff",
            border: "none",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#4f46e5")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "#6366f1")
          }
        >
          Reload Application
        </button>
      </div>
    </div>
  );
}

export default ErrorBoundary;
