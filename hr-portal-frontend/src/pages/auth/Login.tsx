import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext.js";
import {
  startGoogleOAuth,
  requestPasswordReset,
  confirmPasswordReset,
} from "@/services/authService.js";
import { useToast } from "@/context/ToastContext.js";
import { LogIn, Phone, Lock, Loader2, X, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { ApiError } from "@/types/index.js";
import Captcha from "@/components/Captcha.js";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter.js";

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const { error: toastError, success } = useToast();
  const [step, setStep] = useState<"REQUEST" | "CONFIRM">("REQUEST");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const trimmedPhone = phone.trim();
  const phoneError = !trimmedPhone
    ? "Registered phone number is required"
    : !/^\+[1-9]\d{7,14}$/.test(trimmedPhone)
      ? "Use E.164 format, e.g. +9771234567890"
      : "";
  const codeError = /^\d{6}$/.test(code.trim())
    ? ""
    : "Enter the 6-digit code from the SMS.";
  const passwordError =
    newPassword.length < 12
      ? "Password must be at least 12 characters."
      : newPassword !== confirmPassword
        ? "Passwords do not match."
        : "";

  const handleRequest = async () => {
    setAttempted(true);
    if (phoneError) return;
    try {
      setSubmitting(true);
      const res = await requestPasswordReset(trimmedPhone);
      success(
        res.message ||
          "If that phone number is registered, a reset code has been sent.",
      );
      setAttempted(false);
      setStep("CONFIRM");
    } catch (e) {
      toastError(
        (e as ApiError).message ||
          "Could not send a reset code. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    setAttempted(true);
    if (phoneError || codeError || passwordError) return;
    try {
      setSubmitting(true);
      const res = await confirmPasswordReset({
        phone: trimmedPhone,
        code: code.trim(),
        newPassword,
      });
      success(
        res.message ||
          "Your password has been reset. Sign in with your new password.",
      );
      onClose();
    } catch (e) {
      toastError(
        (e as ApiError).message || "Could not reset your password.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const fieldError = (message: string) =>
    attempted && message ? (
      <span
        style={{
          display: "block",
          marginTop: "0.3rem",
          color: "var(--color-danger, #ef4444)",
          fontSize: "0.75rem",
        }}
      >
        {message}
      </span>
    ) : null;

  const inputStyle = (hasError: boolean) => ({
    width: "100%",
    padding: "0.6rem 0.8rem",
    borderRadius: "0.5rem",
    background: "rgba(0,0,0,0.25)",
    border: `1px solid ${
      attempted && hasError
        ? "var(--color-danger, #ef4444)"
        : "rgba(255,255,255,0.1)"
    }`,
    color: "#fff",
    fontSize: "0.9rem",
    outline: "none",
    boxSizing: "border-box" as const,
  });

  const labelStyle = {
    display: "block",
    fontSize: "0.8rem",
    color: "#94a3b8",
    marginBottom: "0.25rem",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1.5rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "26rem",
          background: "#1a1d27",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "1.25rem",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: "2.25rem",
                height: "2.25rem",
                borderRadius: "0.6rem",
                background: "rgba(99,102,241,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-primary, #6366f1)",
              }}
            >
              {step === "REQUEST" ? <Phone size={16} /> : <Lock size={16} />}
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#f8fafc",
              }}
            >
              Reset Password
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#94a3b8",
              padding: "0.25rem",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <p
          style={{
            margin: 0,
            fontSize: "0.9rem",
            color: "#94a3b8",
            lineHeight: 1.6,
          }}
        >
          {step === "REQUEST"
            ? "Enter your registered phone number. If it matches an account, we'll text you a 6-digit reset code."
            : `Enter the code sent to ${trimmedPhone} and choose a new password. The code expires in 10 minutes.`}
        </p>

        {step === "REQUEST" ? (
          <>
            <div>
              <label style={labelStyle}>Registered Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+9771234567890"
                autoComplete="tel"
                disabled={submitting}
                style={inputStyle(Boolean(phoneError))}
              />
              {fieldError(phoneError)}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}
            >
              <button
                onClick={handleRequest}
                disabled={submitting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.875rem",
                  background: "var(--color-primary, #6366f1)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.75rem",
                  fontWeight: 500,
                  fontSize: "0.9rem",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? (
                  <>
                    <Loader2
                      size={16}
                      style={{ animation: "spin 1s linear infinite" }}
                    />{" "}
                    Sending…
                  </>
                ) : (
                  "Send reset code"
                )}
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: "0.75rem",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "0.75rem",
                  color: "#94a3b8",
                  fontWeight: 500,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div>
                <label style={labelStyle}>6-Digit Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  autoComplete="one-time-code"
                  disabled={submitting}
                  style={{
                    ...inputStyle(Boolean(codeError)),
                    letterSpacing: "0.3em",
                    textAlign: "center",
                  }}
                />
                {fieldError(codeError)}
              </div>
              <div>
                <label style={labelStyle}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 12 characters"
                  autoComplete="new-password"
                  disabled={submitting}
                  style={inputStyle(
                    Boolean(passwordError) && newPassword.length < 12,
                  )}
                />
                {newPassword.length > 0 && (
                  <PasswordStrengthMeter password={newPassword} />
                )}
              </div>
              <div>
                <label style={labelStyle}>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  autoComplete="new-password"
                  disabled={submitting}
                  style={inputStyle(Boolean(passwordError))}
                />
                {fieldError(passwordError)}
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.73rem",
                  color: "#94a3b8",
                  lineHeight: 1.5,
                }}
              >
                Use 12+ characters with upper- and lower-case letters, a number
                and a symbol. Avoid common words and past passwords.
              </p>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}
            >
              <button
                onClick={handleConfirm}
                disabled={submitting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.875rem",
                  background: "var(--color-primary, #6366f1)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.75rem",
                  fontWeight: 500,
                  fontSize: "0.9rem",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? (
                  <>
                    <Loader2
                      size={16}
                      style={{ animation: "spin 1s linear infinite" }}
                    />{" "}
                    Resetting…
                  </>
                ) : (
                  "Reset password"
                )}
              </button>
              <button
                onClick={() => {
                  setStep("REQUEST");
                  setAttempted(false);
                  setCode("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                disabled={submitting}
                style={{
                  padding: "0.75rem",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "0.75rem",
                  color: "#94a3b8",
                  fontWeight: 500,
                  fontSize: "0.9rem",
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                Use a different number
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const loginSchema = z.object({
  phone: z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/, "Use E.164 format, e.g. +9771234567890"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function Login() {
  const { login } = useAuth();
  const { error } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsSubmitting(true);
      const { nextStep } = await login(
        data.phone,
        data.password,
        showCaptcha ? captchaAnswer : undefined,
        showCaptcha ? captchaToken : undefined,
      );

      if (nextStep === "MFA_ENROLMENT") {
        navigate("/mfa/setup", { replace: true });
      } else if (nextStep === "MFA_CHALLENGE") {
        navigate("/mfa/verify", { replace: true });
      }
    } catch (err) {
      const apiErr = err as ApiError;
      setCaptchaAnswer("");
      setCaptchaKey((n) => n + 1);

      if (apiErr.statusCode === 428) {
        setShowCaptcha(true);
        error("CAPTCHA required. Please complete the security check below.");
      } else {
        setShowCaptcha(true);
        error(apiErr.message || "Failed to sign in. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        background: "var(--color-bg, #0f1117)",
        color: "var(--color-text, #f8fafc)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "28rem",
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "1.5rem",
          padding: "2.5rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "3.5rem",
              height: "3.5rem",
              borderRadius: "1rem",
              background: "rgba(99, 102, 241, 0.1)",
              color: "var(--color-primary, #6366f1)",
              marginBottom: "1rem",
            }}
          >
            <LogIn size={28} />
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              margin: "0 0 0.5rem 0",
            }}
          >
            Welcome back
          </h1>
          <p
            style={{
              color: "var(--color-text-muted, #94a3b8)",
              margin: 0,
              fontSize: "0.9rem",
            }}
          >
            Enter your credentials to access your account
          </p>
        </div>

        <button
          type="button"
          onClick={() => startGoogleOAuth()}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            padding: "0.875rem",
            backgroundColor: "#ffffff",
            color: "#0f1117",
            border: "none",
            borderRadius: "0.75rem",
            fontSize: "0.9rem",
            fontWeight: 500,
            cursor: "pointer",
            transition: "opacity 0.2s",
            marginBottom: "1.5rem",
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            margin: "1.5rem 0",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "1px",
              background: "rgba(255,255,255,0.1)",
            }}
          />
          <span
            style={{
              fontSize: "0.8rem",
              color: "var(--color-text-muted, #94a3b8)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Or continue with phone
          </span>
          <div
            style={{
              flex: 1,
              height: "1px",
              background: "rgba(255,255,255,0.1)",
            }}
          />
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 500,
                marginBottom: "0.5rem",
              }}
            >
              Phone Number
            </label>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-text-muted, #94a3b8)",
                  pointerEvents: "none",
                }}
              >
                <Phone size={18} />
              </div>
              <input
                {...register("phone")}
                type="tel"
                placeholder="+9771234567890"
                autoComplete="tel"
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  padding: "0.875rem 1rem 0.875rem 2.75rem",
                  backgroundColor: "rgba(0,0,0,0.2)",
                  border: `1px solid ${errors.phone ? "var(--color-danger, #ef4444)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: "0.75rem",
                  color: "white",
                  fontSize: "0.95rem",
                  outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
              />
            </div>
            {errors.phone && (
              <p
                style={{
                  color: "var(--color-danger, #ef4444)",
                  fontSize: "0.8rem",
                  margin: "0.5rem 0 0 0",
                }}
              >
                {errors.phone.message}
              </p>
            )}
          </div>

          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.5rem",
              }}
            >
              <label style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                style={{
                  fontSize: "0.8rem",
                  color: "var(--color-primary, #6366f1)",
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontWeight: 500,
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                }}
              >
                Forgot password? Contact HR
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-text-muted, #94a3b8)",
                  pointerEvents: "none",
                }}
              >
                <Lock size={18} />
              </div>
              <input
                {...register("password")}
                type="password"
                placeholder="••••••••"
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  padding: "0.875rem 1rem 0.875rem 2.75rem",
                  backgroundColor: "rgba(0,0,0,0.2)",
                  border: `1px solid ${errors.password ? "var(--color-danger, #ef4444)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: "0.75rem",
                  color: "white",
                  fontSize: "0.95rem",
                  outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
              />
            </div>
            {errors.password && (
              <p
                style={{
                  color: "var(--color-danger, #ef4444)",
                  fontSize: "0.8rem",
                  margin: "0.5rem 0 0 0",
                }}
              >
                {errors.password.message}
              </p>
            )}
          </div>

          {/* CAPTCHA — shown after first failed attempt */}
          {showCaptcha && (
            <Captcha
              key={captchaKey}
              onToken={setCaptchaToken}
              onAnswer={setCaptchaAnswer}
            />
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%",
              padding: "0.875rem",
              backgroundColor: "var(--color-primary, #6366f1)",
              color: "white",
              border: "none",
              borderRadius: "0.75rem",
              fontSize: "0.95rem",
              fontWeight: 500,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "0.5rem",
              transition: "background-color 0.2s",
              marginTop: "0.5rem",
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2
                  size={18}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            margin: "2rem 0 0 0",
            fontSize: "0.9rem",
            color: "var(--color-text-muted, #94a3b8)",
          }}
        >
          Don't have an account?{" "}
          <Link
            to="/register"
            style={{
              color: "var(--color-primary, #6366f1)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Request access
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>

      {showForgotModal && (
        <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />
      )}
    </div>
  );
}

export default Login;
