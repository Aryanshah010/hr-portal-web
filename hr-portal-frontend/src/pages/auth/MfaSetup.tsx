import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext.js";
import { getMfaSetup } from "@/services/authService.js";
import { useToast } from "@/context/ToastContext.js";
import { QrCode, Loader2, KeyRound } from "lucide-react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import type { ApiError, MfaSetupPayload } from "@/types/index.js";

const mfaSchema = z.object({
  code: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d+$/, "Code must contain only numbers"),
});

type MfaFormValues = z.infer<typeof mfaSchema>;

export function MfaSetup() {
  const { mfaPending, completeMfa } = useAuth();
  const { error, success } = useToast();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setupData, setSetupData] = useState<MfaSetupPayload | null>(null);
  const [loadingSetup, setLoadingSetup] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = useForm<MfaFormValues>({
    resolver: zodResolver(mfaSchema),
  });

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isOAuth = searchParams.get("oauth") === "true";

  useEffect(() => {
    if (!mfaPending && !isOAuth) return;

    let mounted = true;

    const fetchSetup = async () => {
      try {
        const result = await getMfaSetup();
        if (mounted) {
          setSetupData(result.data);
          setLoadingSetup(false);
          setTimeout(() => setFocus("code"), 100);
        }
      } catch (err) {
        const apiErr = err as ApiError;
        error(apiErr.message || "Failed to load MFA setup details.");
        if (mounted) setLoadingSetup(false);
      }
    };

    fetchSetup();

    return () => {
      mounted = false;
    };
  }, [mfaPending, error, setFocus]);

  if (!mfaPending && !isOAuth) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: MfaFormValues) => {
    try {
      setIsSubmitting(true);
      const user = await completeMfa(data.code, true);
      success("Two-Factor Authentication successfully enabled!");

      const targetDashboard =
        user?.role === "HR" ? "/admin/dashboard" : "/dashboard";
      navigate(targetDashboard, { replace: true });
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
              background: "rgba(99, 102, 241, 0.1)",
              color: "var(--color-primary, #6366f1)",
              marginBottom: "1rem",
            }}
          >
            <QrCode size={28} />
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              margin: "0 0 0.5rem 0",
            }}
          >
            Set Up Authenticator
          </h1>
          <p
            style={{
              color: "var(--color-text-muted, #94a3b8)",
              margin: 0,
              fontSize: "0.9rem",
            }}
          >
            Scan the QR code with your authenticator app, then enter the 6-digit
            code.
          </p>
        </div>

        {loadingSetup ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "2rem 0",
            }}
          >
            <Loader2
              size={32}
              style={{
                animation: "spin 1s linear infinite",
                color: "var(--color-primary, #6366f1)",
              }}
            />
          </div>
        ) : setupData ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <div
              style={{
                background: "white",
                padding: "1rem",
                borderRadius: "1rem",
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
              }}
            >
              <img
                src={setupData.qrCodeUrl}
                alt="MFA QR Code"
                width={180}
                height={180}
                style={{ display: "block" }}
              />
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
                width: "100%",
              }}
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
                  "Verify & Enable"
                )}
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default MfaSetup;
