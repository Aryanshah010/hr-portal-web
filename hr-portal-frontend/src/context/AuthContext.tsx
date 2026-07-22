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

export interface AuthContextValue extends AuthState {
  login: (
    phone: string,
    password: string,
    captchaAnswer?: string,
    captchaToken?: string,
  ) => Promise<MfaChallenge>;

  completeMfa: (code: string, isEnrolment?: boolean) => Promise<User>;
  completeMfaRecovery: (code: string) => Promise<User>;

  refresh: () => Promise<void>;

  logout: () => Promise<void>;

  isAuthenticated: boolean;
  role: Role | null;
}

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
  user: null,
  loading: true,
  mfaPending: false,
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "LOADING" });

    authService
      .getMe()
      .then(({ data }) => {
        if (!cancelled) dispatch({ type: "SET_USER", user: data.user });
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: "CLEAR_USER" });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (
      phone: string,
      password: string,
      captchaAnswer?: string,
      captchaToken?: string,
    ): Promise<MfaChallenge> => {
      const result = await authService.login({
        phone,
        password,
        captchaAnswer,
        captchaToken,
      });
      const { nextStep } = result.data;

      if (nextStep === "MFA_CHALLENGE" || nextStep === "MFA_ENROLMENT") {
        dispatch({ type: "MFA_PENDING" });
      }

      return { nextStep };
    },
    [],
  );

  const completeMfa = useCallback(
    async (code: string, isEnrolment = false): Promise<User> => {
      const fn = isEnrolment ? authService.confirmMfa : authService.verifyMfa;
      const result = await fn({ code });
      dispatch({ type: "SET_USER", user: result.data.user });
      return result.data.user;
    },
    [],
  );

  const completeMfaRecovery = useCallback(
    async (code: string): Promise<User> => {
      const result = await authService.verifyMfaRecovery({ code });
      dispatch({ type: "SET_USER", user: result.data.user });
      return result.data.user;
    },
    [],
  );

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const result = await authService.refresh();
      dispatch({ type: "SET_USER", user: result.data.user });
    } catch (err) {
      dispatch({ type: "CLEAR_USER" });
      throw normalizeError(err);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } finally {
      dispatch({ type: "CLEAR_USER" });
    }
  }, []);

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

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>.");
  }
  return ctx;
}

export default AuthContext;
