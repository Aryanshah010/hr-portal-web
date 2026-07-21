import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext.js";
import { sendMfaRecovery } from "@/services/authService.js";
import { useToast } from "@/context/ToastContext.js";
import { ShieldCheck, Loader2, KeyRound } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import type { ApiError } from "@/types/index.js";

const mfaSchema = z.object({
  code: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d+$/, "Code must contain only numbers"),
});

type MfaFormValues = z.infer<typeof mfaSchema>;

export function MfaVerify() {
  const { mfaPending, completeMfa, completeMfaRecovery } = useAuth();
  const { error, success } = useToast();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [isRequestingRecovery, setIsRequestingRecovery] = useState(false);
  const [recoveryCooldown, setRecoveryCooldown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = useForm<MfaFormValues>({
    resolver: zodResolver(mfaSchema),
  });

  useEffect(() => {
    setFocus("code");
  }, [setFocus, isRecoveryMode]);

  // Handle recovery cooldown timer
  useEffect(() => {
    if (recoveryCooldown > 0) {
      const timer = setTimeout(
        () => setRecoveryCooldown((prev) => prev - 1),
        1000,
      );
      return () => clearTimeout(timer);
    }
  }, [recoveryCooldown]);

  if (!mfaPending) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: MfaFormValues) => {
    try {
      setIsSubmitting(true);
      if (isRecoveryMode) {
        await completeMfaRecovery(data.code);
      } else {
        await completeMfa(data.code, false);
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const apiErr = err as ApiError;
      error(
        apiErr.message ||
          "Verification failed. Please check the code and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestRecovery = async () => {
    if (recoveryCooldown > 0) return;
    try {
      setIsRequestingRecovery(true);
      await sendMfaRecovery();
      setIsRecoveryMode(true);
      setRecoveryCooldown(60);
      success("Recovery code sent to your registered phone number.");
    } catch (err) {
      const apiErr = err as ApiError;
      error(
        apiErr.message || "Failed to send recovery code. Please contact HR.",
      );
    } finally {
      setIsRequestingRecovery(false);
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
          maxWidth: "90rem",
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
              background: isRecoveryMode
                ? "rgba(245, 158, 11, 0.1)"
                : "rgba(16, 185, 129, 0.1)",
              color: isRecoveryMode
                ? "var(--color-warning, #f59e0b)"
                : "var(--color-success, #10b981)",
              marginBottom: "1rem",
              transition: "all 0.3s",
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              margin: "0 0 0.5rem 0",
            }}
          >
            {isRecoveryMode ? "SMS Recovery" : "Two-Factor Authentication"}
          </h1>
          <p
            style={{
              color: "var(--color-text-muted, #94a3b8)",
              margin: 0,
              fontSize: "0.9rem",
            }}
          >
            {isRecoveryMode
              ? "Enter the 6-digit code sent to your phone."
              : "Enter the 6-digit code from your authenticator app."}
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          <div>
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
                <KeyRound size={18} />
              </div>
              <input
                {...register("code")}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                autoComplete="one-time-code"
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  padding: "1rem 1rem 1rem 2.75rem",
                  backgroundColor: "rgba(0,0,0,0.2)",
                  border: `1px solid ${errors.code ? "var(--color-danger, #ef4444)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: "0.75rem",
                  color: "white",
                  fontSize: "1.25rem",
                  letterSpacing: "0.25em",
                  outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                  textAlign: "center",
                }}
              />
            </div>
            {errors.code && (
              <p
                style={{
                  color: "var(--color-danger, #ef4444)",
                  fontSize: "0.8rem",
                  margin: "0.5rem 0 0 0",
                  textAlign: "center",
                }}
              >
                {errors.code.message}
              </p>
            )}
          </div>

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
                Verifying...
              </>
            ) : (
              "Verify Code"
            )}
          </button>
        </form>

        <div
          style={{
            textAlign: "center",
            margin: "2rem 0 0 0",
            fontSize: "0.9rem",
          }}
        >
          {!isRecoveryMode ? (
            <p style={{ color: "var(--color-text-muted, #94a3b8)", margin: 0 }}>
              Lost access to your app?{" "}
              <button
                type="button"
                onClick={handleRequestRecovery}
                disabled={isRequestingRecovery || recoveryCooldown > 0}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color:
                    isRequestingRecovery || recoveryCooldown > 0
                      ? "var(--color-text-muted, #94a3b8)"
                      : "var(--color-primary, #6366f1)",
                  fontWeight: 500,
                  cursor:
                    isRequestingRecovery || recoveryCooldown > 0
                      ? "not-allowed"
                      : "pointer",
                  textDecoration: "none",
                }}
              >
                {isRequestingRecovery
                  ? "Sending..."
                  : recoveryCooldown > 0
                    ? `Try again in ${recoveryCooldown}s`
                    : "Use SMS recovery"}
              </button>
            </p>
          ) : (
            <p style={{ color: "var(--color-text-muted, #94a3b8)", margin: 0 }}>
              Didn't receive the code?{" "}
              <button
                type="button"
                onClick={handleRequestRecovery}
                disabled={isRequestingRecovery || recoveryCooldown > 0}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color:
                    isRequestingRecovery || recoveryCooldown > 0
                      ? "var(--color-text-muted, #94a3b8)"
                      : "var(--color-primary, #6366f1)",
                  fontWeight: 500,
                  cursor:
                    isRequestingRecovery || recoveryCooldown > 0
                      ? "not-allowed"
                      : "pointer",
                  textDecoration: "none",
                }}
              >
                {recoveryCooldown > 0
                  ? `Resend in ${recoveryCooldown}s`
                  : "Resend SMS"}
              </button>
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default MfaVerify;
