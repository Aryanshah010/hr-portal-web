// ─────────────────────────────────────────────────────────────────────────────
// context/ToastContext.tsx
//
// Global toast / notification system.
// Provides useToast() hook for displaying success/error/warning/info messages
// from any component without prop-drilling.
//
// Usage:
//   const { toast } = useToast();
//   toast.success("Employee approved.");
//   toast.error("Failed to submit attendance.");
// ─────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useReducer,
  type ReactNode,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title?: string;
  message: string;
  /** Duration in ms before auto-dismiss. Pass 0 to disable auto-dismiss. */
  duration: number;
}

type ToastAction =
  | { type: "ADD"; payload: ToastItem }
  | { type: "REMOVE"; id: string }
  | { type: "CLEAR" };

interface ToastContextValue {
  toasts: ToastItem[];
  /** Show a success toast */
  success: (message: string, title?: string, duration?: number) => void;
  /** Show an error toast */
  error: (message: string, title?: string, duration?: number) => void;
  /** Show a warning toast */
  warning: (message: string, title?: string, duration?: number) => void;
  /** Show an info toast */
  info: (message: string, title?: string, duration?: number) => void;
  /** Dismiss a specific toast by ID */
  dismiss: (id: string) => void;
  /** Dismiss all toasts */
  dismissAll: () => void;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 4000,
  error: 6000,
  warning: 5000,
  info: 4000,
};

// ─── Reducer ─────────────────────────────────────────────────────────────────

function toastReducer(state: ToastItem[], action: ToastAction): ToastItem[] {
  switch (action.type) {
    case "ADD":
      // Prevent exact duplicate messages from stacking.
      if (state.some((t) => t.message === action.payload.message)) return state;
      return [...state, action.payload];
    case "REMOVE":
      return state.filter((t) => t.id !== action.id);
    case "CLEAR":
      return [];
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);
  // useId generates a stable base; individual toasts append a counter.
  const baseId = useId();
  let counter = 0;

  const add = useCallback(
    (
      variant: ToastVariant,
      message: string,
      title?: string,
      duration?: number,
    ) => {
      const id = `${baseId}-${++counter}`;
      const resolvedDuration = duration ?? DEFAULT_DURATION[variant];
      const item: ToastItem = {
        id,
        variant,
        title,
        message,
        duration: resolvedDuration,
      };
      dispatch({ type: "ADD", payload: item });

      if (resolvedDuration > 0) {
        setTimeout(() => dispatch({ type: "REMOVE", id }), resolvedDuration);
      }
    },
    [baseId],
  );

  const dismiss = useCallback((id: string) => {
    dispatch({ type: "REMOVE", id });
  }, []);

  const dismissAll = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  const value: ToastContextValue = {
    toasts,
    success: (msg, title, dur) => add("success", msg, title, dur),
    error: (msg, title, dur) => add("error", msg, title, dur),
    warning: (msg, title, dur) => add("warning", msg, title, dur),
    info: (msg, title, dur) => add("info", msg, title, dur),
    dismiss,
    dismissAll,
  };

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useToast() — returns toast helpers and the current toast list.
 * Must be used inside <ToastProvider>.
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>.");
  }
  return ctx;
}

export default ToastContext;
