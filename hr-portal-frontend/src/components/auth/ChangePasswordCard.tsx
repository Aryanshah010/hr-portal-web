import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { changeMyPassword } from "@/services/employeeService.js";
import { useAuth } from "@/context/AuthContext.js";
import { useToast } from "@/context/ToastContext.js";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter.js";
import type { ApiError } from "@/types/index.js";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(12, "At least 12 characters")
      .max(128)
      .regex(/[a-z]/, "Needs a lowercase letter")
      .regex(/[A-Z]/, "Needs an uppercase letter")
      .regex(/\d/, "Needs a number")
      .regex(/[^A-Za-z0-9\s]/, "Needs a symbol")
      .refine((v) => !/\s/.test(v), "Cannot contain spaces"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    path: ["newPassword"],
    message: "New password must differ from the current one",
  });

type FormValues = z.infer<typeof schema>;

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "1rem",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

const inputStyle = (invalid?: boolean): React.CSSProperties => ({
  width: "100%",
  padding: "0.75rem 1rem 0.75rem 2.4rem",
  backgroundColor: "rgba(0,0,0,0.25)",
  border: `1px solid ${invalid ? "var(--color-danger, #ef4444)" : "rgba(255,255,255,0.1)"}`,
  borderRadius: "0.6rem",
  color: "var(--color-text, #f8fafc)",
  fontSize: "0.95rem",
  outline: "none",
  boxSizing: "border-box",
});

export function ChangePasswordCard() {
  const { logout } = useAuth();
  const { error, success } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const newPassword = watch("newPassword") ?? "";

  const onSubmit = async (data: FormValues) => {
    try {
      setSubmitting(true);
      await changeMyPassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      reset();
      success("Password changed. Please sign in again.");
      // The server revoked every session, so the current cookie is already dead.
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      error((err as ApiError).message || "Could not change password.");
    } finally {
      setSubmitting(false);
    }
  };

  const field = (
    name: keyof FormValues,
    label: string,
    autoComplete: string,
  ) => (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "0.8rem",
          fontWeight: 500,
          color: "var(--color-text-muted, #94a3b8)",
          marginBottom: "0.5rem",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: "0.875rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--color-text-muted, #94a3b8)",
            pointerEvents: "none",
          }}
        >
          <KeyRound size={16} />
        </div>
        <input
          {...register(name)}
          type="password"
          autoComplete={autoComplete}
          disabled={submitting}
          style={inputStyle(Boolean(errors[name]))}
        />
      </div>
      {errors[name] && (
        <p
          style={{
            color: "var(--color-danger, #ef4444)",
            fontSize: "0.78rem",
            margin: "0.35rem 0 0 0",
          }}
        >
          {errors[name]?.message}
        </p>
      )}
    </div>
  );

  return (
    <div style={{ ...glass, padding: "1.5rem" }}>
      <h2
        style={{
          fontSize: "0.78rem",
          fontWeight: 600,
          margin: "0 0 0.5rem 0",
          color: "var(--color-text-muted, #94a3b8)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        Password
      </h2>
      <p
        style={{
          margin: "0 0 1.25rem 0",
          fontSize: "0.82rem",
          color: "var(--color-text-muted, #94a3b8)",
          lineHeight: 1.6,
        }}
      >
        Passwords expire after 90 days. You cannot reuse any of your last five.
        Changing it signs you out of every device.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        {field("currentPassword", "Current Password", "current-password")}
        {field("newPassword", "New Password", "new-password")}
        <PasswordStrengthMeter password={newPassword} />
        {field("confirmPassword", "Confirm New Password", "new-password")}

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "0.875rem 1.5rem",
            backgroundColor: "var(--color-primary, #6366f1)",
            color: "white",
            border: "none",
            borderRadius: "0.75rem",
            fontSize: "0.95rem",
            fontWeight: 500,
            cursor: submitting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            alignSelf: "flex-start",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? (
            <>
              <Loader2
                size={16}
                style={{ animation: "spin 1s linear infinite" }}
              />{" "}
              Updating…
            </>
          ) : (
            <>
              <ShieldCheck size={16} /> Change Password
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default ChangePasswordCard;
