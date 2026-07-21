import { useToast, type ToastItem } from "@/context/ToastContext.js";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "1rem",
        right: "1rem",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <ToastCard
          key={toast.id}
          toast={toast}
          onDismiss={() => dismiss(toast.id)}
        />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  const getIcon = () => {
    switch (toast.variant) {
      case "success":
        return <CheckCircle size={20} color="#10b981" />;
      case "error":
        return <AlertCircle size={20} color="#ef4444" />;
      case "warning":
        return <AlertTriangle size={20} color="#f59e0b" />;
      case "info":
        return <Info size={20} color="#3b82f6" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.variant) {
      case "success":
        return "#10b981";
      case "error":
        return "#ef4444";
      case "warning":
        return "#f59e0b";
      case "info":
        return "#3b82f6";
    }
  };

  return (
    <div
      style={{
        pointerEvents: "auto",
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        background: "rgba(30, 30, 30, 0.95)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderLeft: `4px solid ${getBorderColor()}`,
        borderRadius: "0.5rem",
        padding: "1rem",
        width: "350px",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
        color: "#fff",
        animation: "slideIn 0.3s ease-out forwards",
      }}
    >
      <div style={{ flexShrink: 0, marginTop: "2px" }}>{getIcon()}</div>
      <div style={{ flex: 1 }}>
        {toast.title && (
          <div
            style={{
              fontWeight: 600,
              fontSize: "0.9rem",
              marginBottom: "0.25rem",
            }}
          >
            {toast.title}
          </div>
        )}
        <div
          style={{
            fontSize: "0.85rem",
            color: "rgba(255, 255, 255, 0.8)",
            lineHeight: "1.4",
          }}
        >
          {toast.message}
        </div>
      </div>
      <button
        onClick={onDismiss}
        style={{
          background: "none",
          border: "none",
          color: "rgba(255, 255, 255, 0.5)",
          cursor: "pointer",
          padding: "0.25rem",
          display: "flex",
        }}
        aria-label="Dismiss toast"
      >
        <X size={16} />
      </button>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
