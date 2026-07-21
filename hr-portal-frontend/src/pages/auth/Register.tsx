import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  sendPhoneOtp,
  verifyPhoneOtp,
  completeRegistration,
} from "@/services/authService.js";
import { useToast } from "@/context/ToastContext.js";
import {
  UserPlus,
  Phone,
  KeyRound,
  User,
  Briefcase,
  Building,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter.js";
import type { ApiError } from "@/types/index.js";

const phoneSchema = z.object({
  phone: z
    .string()
    .min(10, "Please enter a valid phone number (min 10 digits)"),
});

const otpSchema = z.object({
  code: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d+$/, "Numbers only"),
});

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  password: z
    .string()
    .min(12, "Password must contain at least 12 characters")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/\d/, "Password must contain a number")
    .regex(/[^A-Za-z0-9\s]/, "Password must contain a symbol")
    .refine((val) => !/\s/.test(val), "Password cannot contain spaces"),
});

type PhoneFormValues = z.infer<typeof phoneSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;
type ProfileFormValues = z.infer<typeof profileSchema>;

export function Register() {
  const { error, success } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forms
  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
  });
  const otpForm = useForm<OtpFormValues>({ resolver: zodResolver(otpSchema) });
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  const passwordValue = profileForm.watch("password");

  //  Step 1: Send Phone OTP
  const onPhoneSubmit = async (data: PhoneFormValues) => {
    try {
      setIsSubmitting(true);
      await sendPhoneOtp(data);
      success("Verification code sent to your phone.");
      setStep(2);
    } catch (err) {
      const apiErr = err as ApiError;
      error(apiErr.message || "Failed to send verification code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify Phone OTP
  const onOtpSubmit = async (data: OtpFormValues) => {
    try {
      setIsSubmitting(true);
      await verifyPhoneOtp(data);
      success("Phone number verified successfully.");
      setStep(3);
    } catch (err) {
      const apiErr = err as ApiError;
      error(apiErr.message || "Invalid or expired verification code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Complete Registration
  const onProfileSubmit = async (data: ProfileFormValues) => {
    try {
      setIsSubmitting(true);
      await completeRegistration(data);
      success(
        "Registration complete! Please log in when your account is approved.",
      );
      navigate("/login?status=pending", { replace: true });
    } catch (err) {
      const apiErr = err as ApiError;
      error(apiErr.message || "Failed to complete registration.");
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
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
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
            <UserPlus size={28} />
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              margin: "0 0 0.5rem 0",
            }}
          >
            Complete Registration
          </h1>
          <p
            style={{
              color: "var(--color-text-muted, #94a3b8)",
              margin: 0,
              fontSize: "0.9rem",
            }}
          >
            {step === 1 && "Secure your account with a verified phone number."}
            {step === 2 && "Enter the code sent to your phone."}
            {step === 3 && "Set up your profile and password."}
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem" }}>
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                height: "4px",
                borderRadius: "2px",
                background:
                  step >= idx
                    ? "var(--color-primary, #6366f1)"
                    : "rgba(255,255,255,0.1)",
                transition: "background-color 0.3s",
              }}
            />
          ))}
        </div>

        {step === 1 && (
          <form
            onSubmit={phoneForm.handleSubmit(onPhoneSubmit)}
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
                Phone Number (with country code)
              </label>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--color-text-muted, #94a3b8)",
                  }}
                >
                  <Phone size={18} />
                </div>
                <input
                  {...phoneForm.register("phone")}
                  type="tel"
                  placeholder="+1234567890"
                  disabled={isSubmitting}
                  style={inputStyle(phoneForm.formState.errors.phone?.message)}
                />
              </div>
              {phoneForm.formState.errors.phone && (
                <p style={errorStyle}>
                  {phoneForm.formState.errors.phone.message}
                </p>
              )}
            </div>
            <SubmitButton isSubmitting={isSubmitting} text="Send Code" />
          </form>
        )}

        {step === 2 && (
          <form
            onSubmit={otpForm.handleSubmit(onOtpSubmit)}
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
                Verification Code
              </label>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--color-text-muted, #94a3b8)",
                  }}
                >
                  <KeyRound size={18} />
                </div>
                <input
                  {...otpForm.register("code")}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  disabled={isSubmitting}
                  style={{
                    ...inputStyle(otpForm.formState.errors.code?.message),
                    letterSpacing: "0.25em",
                  }}
                />
              </div>
              {otpForm.formState.errors.code && (
                <p style={errorStyle}>
                  {otpForm.formState.errors.code.message}
                </p>
              )}
            </div>
            <SubmitButton isSubmitting={isSubmitting} text="Verify Code" />
          </form>
        )}

        {step === 3 && (
          <form
            onSubmit={profileForm.handleSubmit(onProfileSubmit)}
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
                Full Name
              </label>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--color-text-muted, #94a3b8)",
                  }}
                >
                  <User size={18} />
                </div>
                <input
                  {...profileForm.register("name")}
                  type="text"
                  placeholder="Jane Doe"
                  disabled={isSubmitting}
                  style={inputStyle(profileForm.formState.errors.name?.message)}
                />
              </div>
              {profileForm.formState.errors.name && (
                <p style={errorStyle}>
                  {profileForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
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
                  Job Title <span style={{ color: "#94a3b8" }}>(Optional)</span>
                </label>
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: "1rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--color-text-muted, #94a3b8)",
                    }}
                  >
                    <Briefcase size={18} />
                  </div>
                  <input
                    {...profileForm.register("jobTitle")}
                    type="text"
                    placeholder="Software Engineer"
                    disabled={isSubmitting}
                    style={inputStyle(
                      profileForm.formState.errors.jobTitle?.message,
                    )}
                  />
                </div>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    marginBottom: "0.5rem",
                  }}
                >
                  Department{" "}
                  <span style={{ color: "#94a3b8" }}>(Optional)</span>
                </label>
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: "1rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--color-text-muted, #94a3b8)",
                    }}
                  >
                    <Building size={18} />
                  </div>
                  <input
                    {...profileForm.register("department")}
                    type="text"
                    placeholder="Engineering"
                    disabled={isSubmitting}
                    style={inputStyle(
                      profileForm.formState.errors.department?.message,
                    )}
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  marginBottom: "0.5rem",
                }}
              >
                Secure Password
              </label>
              <input
                {...profileForm.register("password")}
                type="password"
                placeholder="Must be at least 12 characters..."
                disabled={isSubmitting}
                style={{
                  ...inputStyle(profileForm.formState.errors.password?.message),
                  paddingLeft: "1rem",
                }}
              />
              <PasswordStrengthMeter password={passwordValue} />
              {profileForm.formState.errors.password && (
                <p style={{ ...errorStyle, marginTop: "0.5rem" }}>
                  {profileForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <SubmitButton
              isSubmitting={isSubmitting}
              text="Complete Registration"
              icon={<UserPlus size={18} />}
            />
          </form>
        )}
      </div>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const inputStyle = (error?: string) => ({
  width: "100%",
  padding: "0.875rem 1rem 0.875rem 2.75rem",
  backgroundColor: "rgba(0,0,0,0.2)",
  border: `1px solid ${error ? "var(--color-danger, #ef4444)" : "rgba(255,255,255,0.1)"}`,
  borderRadius: "0.75rem",
  color: "white",
  fontSize: "0.95rem",
  outline: "none",
  transition: "border-color 0.2s",
  boxSizing: "border-box" as const,
});

const errorStyle = {
  color: "var(--color-danger, #ef4444)",
  fontSize: "0.8rem",
  margin: "0.5rem 0 0 0",
};

function SubmitButton({
  isSubmitting,
  text,
  icon = <ArrowRight size={18} />,
}: {
  isSubmitting: boolean;
  text: string;
  icon?: React.ReactNode;
}) {
  return (
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
        <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
      ) : (
        text
      )}
      {!isSubmitting && icon}
    </button>
  );
}

export default Register;
