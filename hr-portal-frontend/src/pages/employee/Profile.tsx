import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Shield,
  Briefcase,
  Building2,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.js";
import { useToast } from "@/context/ToastContext.js";
import { getMyProfile, updateMyProfile } from "@/services/employeeService.js";
import type { Employee } from "@/types/index.js";
import { AvatarUpload } from "@/components/employee/AvatarUpload.js";
import { ChangePasswordCard } from "@/components/auth/ChangePasswordCard.js";

const safeStr = (label: string) =>
  z
    .string()
    .min(2, `${label} must be at least 2 characters`)
    .max(100, `${label} must be at most 100 characters`)
    .trim();

const profileSchema = z.object({
  name: safeStr("Name"),
  jobTitle: z.string().max(100).trim().optional().or(z.literal("")),
  department: z.string().max(100).trim().optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "1rem",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

export function Profile() {
  const { user } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", jobTitle: "", department: "" },
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMyProfile()
      .then((res) => {
        if (cancelled) return;
        const p = res.data.profile;
        setProfile(p);
        reset({
          name: p.name ?? "",
          jobTitle: p.jobTitle ?? "",
          department: p.department ?? "",
        });
      })
      .catch(() => {
        if (!cancelled) setLoadError("Failed to load profile. Please refresh.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsSaving(true);
      const res = await updateMyProfile({
        name: data.name,
        jobTitle: data.jobTitle || undefined,
        department: data.department || undefined,
      });
      const updated = res.data.profile;
      setProfile(updated);
      reset({
        name: updated.name ?? "",
        jobTitle: updated.jobTitle ?? "",
        department: updated.department ?? "",
      });
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === "ACTIVE") return "var(--color-success, #22c55e)";
    if (s === "SUSPENDED") return "var(--color-danger, #ef4444)";
    return "var(--color-warning, #f59e0b)";
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--color-bg, #0f1117)",
        color: "var(--color-text, #f8fafc)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "2rem 1rem",
      }}
    >
      <div
        style={{
          maxWidth: "90rem",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        {/* Header */}
        <div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              margin: "0 0 0.25rem 0",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
            }}
          >
            <User size={26} color="var(--color-primary, #6366f1)" />
            My Profile
          </h1>
          <p
            style={{
              color: "var(--color-text-muted, #94a3b8)",
              margin: 0,
              fontSize: "0.9rem",
            }}
          >
            View your account info and update your personal details.
          </p>
        </div>

        {/* Avatar */}
        <div style={{ ...glass, padding: "1.5rem" }}>
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              margin: "0 0 1.25rem 0",
              color: "var(--color-text-muted, #94a3b8)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Photo
          </h2>
          <AvatarUpload hasExisting={Boolean(profile?.hasAvatar)} />
        </div>

        {/* Account info (read-only) */}
        <div style={{ ...glass, padding: "1.5rem" }}>
          <h2
            style={{
              fontSize: "0.78rem",
              fontWeight: 600,
              margin: "0 0 1.25rem 0",
              color: "var(--color-text-muted, #94a3b8)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Account Information
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(14rem, 1fr))",
              gap: "1rem",
            }}
          >
            {[
              {
                label: "Email",
                value: user?.email ?? "—",
                icon: <Shield size={14} />,
              },
              {
                label: "Role",
                value: user?.role ?? "—",
                icon: <Shield size={14} />,
              },
              {
                label: "Account Status",
                value: user?.accountStatus ?? "—",
                icon: <CheckCircle2 size={14} />,
                color: user?.accountStatus
                  ? statusColor(user.accountStatus)
                  : undefined,
              },
              {
                label: "MFA",
                value: user?.mfaEnabled ? "Enabled" : "Disabled",
                icon: <Shield size={14} />,
                color: user?.mfaEnabled
                  ? "var(--color-success, #22c55e)"
                  : "var(--color-warning, #f59e0b)",
              },
            ].map(({ label, value, icon, color }) => (
              <div
                key={label}
                style={{
                  padding: "1rem",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "0.75rem",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p
                  style={{
                    margin: "0 0 0.35rem 0",
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted, #94a3b8)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  {icon} {label}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.95rem",
                    fontWeight: 500,
                    color: color ?? "var(--color-text, #f8fafc)",
                  }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Editable employee fields */}
        <div style={{ ...glass, padding: "1.5rem" }}>
          <h2
            style={{
              fontSize: "0.78rem",
              fontWeight: 600,
              margin: "0 0 1.25rem 0",
              color: "var(--color-text-muted, #94a3b8)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Personal Details
          </h2>

          {loading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                color: "var(--color-text-muted, #94a3b8)",
                padding: "1rem 0",
              }}
            >
              <Loader2
                size={18}
                style={{ animation: "spin 1s linear infinite" }}
              />
              Loading profile…
            </div>
          )}

          {loadError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "var(--color-danger, #ef4444)",
                padding: "0.75rem",
                background: "rgba(239,68,68,0.1)",
                borderRadius: "0.5rem",
              }}
            >
              <AlertCircle size={16} />
              {loadError}
            </div>
          )}

          {!loading && !loadError && (
            <form
              onSubmit={handleSubmit(onSubmit)}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              {/* Name */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    marginBottom: "0.5rem",
                  }}
                >
                  Full Name{" "}
                  <span style={{ color: "var(--color-danger, #ef4444)" }}>
                    *
                  </span>
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
                    <User size={16} />
                  </div>
                  <input
                    {...register("name")}
                    type="text"
                    placeholder="Your full name"
                    disabled={isSaving}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem 0.75rem 2.4rem",
                      backgroundColor: "rgba(0,0,0,0.25)",
                      border: `1px solid ${errors.name ? "var(--color-danger, #ef4444)" : "rgba(255,255,255,0.1)"}`,
                      borderRadius: "0.6rem",
                      color: "var(--color-text, #f8fafc)",
                      fontSize: "0.95rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                {errors.name && (
                  <p
                    style={{
                      color: "var(--color-danger, #ef4444)",
                      fontSize: "0.78rem",
                      margin: "0.35rem 0 0 0",
                    }}
                  >
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Job Title */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    marginBottom: "0.5rem",
                  }}
                >
                  Job Title
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
                    <Briefcase size={16} />
                  </div>
                  <input
                    {...register("jobTitle")}
                    type="text"
                    placeholder="e.g. Software Engineer"
                    disabled={isSaving}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem 0.75rem 2.4rem",
                      backgroundColor: "rgba(0,0,0,0.25)",
                      border: `1px solid ${errors.jobTitle ? "var(--color-danger, #ef4444)" : "rgba(255,255,255,0.1)"}`,
                      borderRadius: "0.6rem",
                      color: "var(--color-text, #f8fafc)",
                      fontSize: "0.95rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                {errors.jobTitle && (
                  <p
                    style={{
                      color: "var(--color-danger, #ef4444)",
                      fontSize: "0.78rem",
                      margin: "0.35rem 0 0 0",
                    }}
                  >
                    {errors.jobTitle.message}
                  </p>
                )}
              </div>

              {/* Department */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    marginBottom: "0.5rem",
                  }}
                >
                  Department
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
                    <Building2 size={16} />
                  </div>
                  <input
                    {...register("department")}
                    type="text"
                    placeholder="e.g. Engineering"
                    disabled={isSaving}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem 0.75rem 2.4rem",
                      backgroundColor: "rgba(0,0,0,0.25)",
                      border: `1px solid ${errors.department ? "var(--color-danger, #ef4444)" : "rgba(255,255,255,0.1)"}`,
                      borderRadius: "0.6rem",
                      color: "var(--color-text, #f8fafc)",
                      fontSize: "0.95rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                {errors.department && (
                  <p
                    style={{
                      color: "var(--color-danger, #ef4444)",
                      fontSize: "0.78rem",
                      margin: "0.35rem 0 0 0",
                    }}
                  >
                    {errors.department.message}
                  </p>
                )}
              </div>

              {/* Employment meta (read-only from Employee record) — only for employees */}
              {profile && user?.role !== "HR" && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(11rem, 1fr))",
                    gap: "0.75rem",
                    padding: "1rem",
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: "0.75rem",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  {[
                    { label: "Employment Type", value: profile.employmentType },
                    {
                      label: "Joined",
                      value: new Date(profile.joinedAt).toLocaleDateString(),
                    },
                    {
                      label: "Status",
                      value: profile.isActive ? "Active" : "Inactive",
                    },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p
                        style={{
                          margin: "0 0 0.2rem 0",
                          fontSize: "0.73rem",
                          color: "var(--color-text-muted, #94a3b8)",
                        }}
                      >
                        {label}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.875rem",
                          fontWeight: 500,
                        }}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={isSaving || !isDirty}
                style={{
                  padding: "0.875rem 1.5rem",
                  backgroundColor: isDirty
                    ? "var(--color-primary, #6366f1)"
                    : "rgba(99,102,241,0.3)",
                  color: "white",
                  border: "none",
                  borderRadius: "0.75rem",
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  cursor: isSaving || !isDirty ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  alignSelf: "flex-start",
                  transition: "background-color 0.2s",
                  opacity: isSaving ? 0.7 : 1,
                }}
              >
                {isSaving ? (
                  <>
                    <Loader2
                      size={16}
                      style={{ animation: "spin 1s linear infinite" }}
                    />{" "}
                    Saving…
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save Changes
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <ChangePasswordCard />
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default Profile;
