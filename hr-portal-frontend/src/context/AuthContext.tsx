// ─────────────────────────────────────────────────────────────────────────────
// context/AuthContext.tsx
//
// Global authentication state for the HR Portal.
//
// Session model (mirrors the backend):
//  • The backend issues access_token + refresh_token as HttpOnly cookies.
//  • The frontend never sees or stores token strings.
//  • On mount we call GET /auth/me to rehydrate session state; a 401 means
//    the user is unauthenticated.
//  • The apiClient's 401 interceptor silently calls POST /auth/refresh; if
//    that succeeds the original request is retried. If it fails, the browser
//    is redirected to /login and this context's state is cleared.
//
// Multi-step auth flow:
//  • login()     — starts the flow; sets mfaPending = true when the backend
//                  returns a nextStep of MFA_CHALLENGE or MFA_ENROLMENT.
//  • completeMfa() — verifies the TOTP code; on success sets user + clears mfaPending.
//  • logout()    — calls POST /auth/logout and clears all local state.
//  • refresh()   — called automatically by the apiClient interceptor; also
//                  exposed here for manual session revalidation if needed.
//
// Usage:
//   const { user, isAuthenticated, login, logout } = useAuth();
// ─────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";

import * as authService from "@/services/authService.js";
import type { AuthState, MfaChallenge, Role, User } from "@/types";
import { normalizeError } from "@/services/apiClient.js";

// ─── Context value shape ──────────────────────────────────────────────────────

export interface AuthContextValue extends AuthState {
  /**
   * Start the password login flow.
   * Returns the nextStep from the backend. If nextStep requires MFA,
   * sets mfaPending = true so the UI can render the TOTP form.
   */
  login: (phone: string, password: string) => Promise<MfaChallenge>;

  /**
   * Verify a TOTP code during the MFA challenge or confirm MFA enrolment.
   * On success, sets the authenticated user and clears mfaPending.
   * Pass isEnrolment = true when confirming the first TOTP code after setup.
   */
  completeMfa: (code: string, isEnrolment?: boolean) => Promise<User>;

  /**
   * Verify an SMS recovery code when the user cannot access their TOTP app.
   * On success, sets the authenticated user and clears mfaPending.
   */
  completeMfaRecovery: (code: string) => Promise<User>;

  /**
   * Silently refresh the access token using the HttpOnly refresh_token cookie.
   * Normally called by the apiClient 401 interceptor; exposed here for
   * components that need to trigger a refresh manually.
   */
  refresh: () => Promise<void>;

  /**
   * End the session: calls POST /auth/logout, clears cookies server-side,
   * and resets all local auth state.
   */
  logout: () => Promise<void>;

  /**
   * Convenience flag — true only when user is non-null and fully authenticated
   * (MFA verified, session active).
   */
  isAuthenticated: boolean;

  /**
   * The authenticated user's role, or null when unauthenticated.
   */
  role: Role | null;
}

// ─── State shape & reducer ────────────────────────────────────────────────────

type AuthReducerState = Omit<AuthState, "isAuthenticated">;

type AuthAction =
  | { type: "LOADING" }
  | { type: "SET_USER"; user: User }
  | { type: "CLEAR_USER" }
  | { type: "MFA_PENDING" }
  | { type: "MFA_DONE" };

function authReducer(
  state: AuthReducerState,
  action: AuthAction,
): AuthReducerState {
  switch (action.type) {
    case "LOADING":
      return { ...state, loading: true };
    case "SET_USER":
      return { user: action.user, loading: false, mfaPending: false };
    case "CLEAR_USER":
      return { user: undefined, loading: false, mfaPending: false };
    case "MFA_PENDING":
      return { ...state, loading: false, mfaPending: true };
    case "MFA_DONE":
      return { ...state, mfaPending: false };
    default:
      return state;
  }
}

const initialState: AuthReducerState = {
  // null = loading; undefined = unauthenticated; User = authenticated
  user: null,
  loading: true,
  mfaPending: false,
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ── Session rehydration on mount ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "LOADING" });

    authService
      .getMe()
      .then(({ data }) => {
        if (!cancelled) dispatch({ type: "SET_USER", user: data.user });
      })
      .catch(() => {
        // 401 means no valid session — not an error worth surfacing.
        if (!cancelled) dispatch({ type: "CLEAR_USER" });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ── login ─────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (phone: string, password: string): Promise<MfaChallenge> => {
      const result = await authService.login({ phone, password });
      const { nextStep } = result.data;

      if (nextStep === "MFA_CHALLENGE" || nextStep === "MFA_ENROLMENT") {
        dispatch({ type: "MFA_PENDING" });
      }

      return { nextStep };
    },
    [],
  );

  // ── completeMfa ───────────────────────────────────────────────────────────
  const completeMfa = useCallback(
    async (code: string, isEnrolment = false): Promise<User> => {
      const fn = isEnrolment ? authService.confirmMfa : authService.verifyMfa;
      const result = await fn({ code });
      dispatch({ type: "SET_USER", user: result.data.user });
      return result.data.user;
    },
    [],
  );

  // ── completeMfaRecovery ───────────────────────────────────────────────────
  const completeMfaRecovery = useCallback(
    async (code: string): Promise<User> => {
      const result = await authService.verifyMfaRecovery({ code });
      dispatch({ type: "SET_USER", user: result.data.user });
      return result.data.user;
    },
    [],
  );

  // ── refresh ───────────────────────────────────────────────────────────────
  const refresh = useCallback(async (): Promise<void> => {
    try {
      const result = await authService.refresh();
      dispatch({ type: "SET_USER", user: result.data.user });
    } catch (err) {
      // If refresh fails the apiClient interceptor already redirected.
      dispatch({ type: "CLEAR_USER" });
      throw normalizeError(err);
    }
  }, []);

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } finally {
      // Always clear local state even if the network call fails.
      dispatch({ type: "CLEAR_USER" });
    }
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────
  const isAuthenticated =
    state.user !== null && state.user !== undefined && !state.mfaPending;

  const role = isAuthenticated ? (state.user as User).role : null;

  const value: AuthContextValue = {
    user: state.user,
    loading: state.loading,
    mfaPending: state.mfaPending,
    isAuthenticated,
    role,
    login,
    completeMfa,
    completeMfaRecovery,
    refresh,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useAuth() — returns the global authentication state and session actions.
 * Must be used inside <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>.");
  }
  return ctx;
}

export default AuthContext;
