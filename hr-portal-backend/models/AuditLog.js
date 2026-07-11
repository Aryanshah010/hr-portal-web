import mongoose from "mongoose";

export const AUDIT_EVENTS = Object.freeze({
  // ── Authentication ──
  AUTH_LOGIN_SUCCESS: "AUTH_LOGIN_SUCCESS",
  AUTH_LOGIN_FAILURE: "AUTH_LOGIN_FAILURE",
  AUTH_LOGOUT: "AUTH_LOGOUT",
  AUTH_TOKEN_INVALID: "AUTH_TOKEN_INVALID",
  AUTH_ACCOUNT_LOCKED: "AUTH_ACCOUNT_LOCKED",
  AUTH_ACCOUNT_UNLOCKED: "AUTH_ACCOUNT_UNLOCKED",
  AUTH_PASSWORD_CHANGED: "AUTH_PASSWORD_CHANGED",
  AUTH_PASSWORD_RESET_REQUESTED: "AUTH_PASSWORD_RESET_REQUESTED",
  AUTH_MFA_ENROLLED: "AUTH_MFA_ENROLLED",
  AUTH_MFA_VERIFIED: "AUTH_MFA_VERIFIED",
  AUTH_MFA_FAILED: "AUTH_MFA_FAILED",

  // ── Injection & Threat Detection ───
  NOSQL_INJECTION_ATTEMPT: "NOSQL_INJECTION_ATTEMPT",
  SSRF_ATTEMPT: "SSRF_ATTEMPT",
  CSRF_TOKEN_INVALID: "CSRF_TOKEN_INVALID",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  MALFORMED_PAYLOAD: "MALFORMED_PAYLOAD",

  // ── Authorization & RBAC ────
  AUTHZ_ACCESS_DENIED: "AUTHZ_ACCESS_DENIED",
  AUTHZ_PRIVILEGE_ESCALATION_ATTEMPT: "AUTHZ_PRIVILEGE_ESCALATION_ATTEMPT",
  AUTHZ_IDOR_ATTEMPT: "AUTHZ_IDOR_ATTEMPT",

  // ── Data Mutations ─────
  EMPLOYEE_CREATED: "EMPLOYEE_CREATED",
  EMPLOYEE_UPDATED: "EMPLOYEE_UPDATED",
  EMPLOYEE_DELETED: "EMPLOYEE_DELETED",
  SALARY_UPDATED: "SALARY_UPDATED",
  PAYSLIP_GENERATED: "PAYSLIP_GENERATED",
  PAYROLL_RUN_CREATED: "PAYROLL_RUN_CREATED",
  PAYROLL_RUN_APPROVED: "PAYROLL_RUN_APPROVED",
  SALARY_DISBURSEMENT_INITIATED: "SALARY_DISBURSEMENT_INITIATED",
  BANK_ACCOUNT_UPDATED: "BANK_ACCOUNT_UPDATED",
  ATTENDANCE_SUBMITTED: "ATTENDANCE_SUBMITTED",
  ATTENDANCE_APPROVED: "ATTENDANCE_APPROVED",
  ATTENDANCE_REJECTED: "ATTENDANCE_REJECTED",

  // ── Data Access ─────
  PII_ACCESS: "PII_ACCESS",
  DATA_EXPORT_REQUESTED: "DATA_EXPORT_REQUESTED",
  BULK_QUERY_EXECUTED: "BULK_QUERY_EXECUTED",

  // ── System ──────
  SYSTEM_STARTUP: "SYSTEM_STARTUP",
  SYSTEM_ERROR: "SYSTEM_ERROR",
});

export const AUDIT_SEVERITY = Object.freeze({
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
});

const auditLogSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: [true, "Audit event type is required."],
      enum: {
        values: Object.values(AUDIT_EVENTS),
        message:
          "Event type '{VALUE}' is not a recognized audit event. " +
          "This may indicate an unauthorized write attempt.",
      },
    },

    severity: {
      type: String,
      required: [true, "Audit event severity is required."],
      enum: {
        values: Object.values(AUDIT_SEVERITY),
        message: "Severity '{VALUE}' is not a recognized level.",
      },
      default: AUDIT_SEVERITY.MEDIUM,
    },

    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    actorRole: {
      type: String,
      enum: {
        values: ["Employee", "Manager", "Admin", "Unauthenticated"],
        message: "Actor role '{VALUE}' is not valid.",
      },
      default: "Unauthenticated",
    },

    targetResource: {
      type: String,
      trim: true,
      maxlength: [500, "Target resource path must not exceed 500 characters."],
      default: "UNKNOWN",
    },

    ipAddress: {
      type: String,
      trim: true,
      maxlength: [45, "IP address must not exceed 45 characters (IPv6 max)."],
      default: "UNKNOWN",
    },

    userAgent: {
      type: String,
      trim: true,
      maxlength: [512, "User-Agent must not exceed 512 characters."],
      default: "UNKNOWN",
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    timestamp: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  {
    strict: true,
    strictQuery: true,
    timestamps: false,
    versionKey: false,
  },
);

// Primary query patterns
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ eventType: 1, timestamp: -1 });
auditLogSchema.index({ actorId: 1, timestamp: -1 }, { sparse: true });
auditLogSchema.index({ ipAddress: 1, eventType: 1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 });

auditLogSchema.pre("save", function (next) {
  if (!this.isNew) {
    return next(
      new Error(
        "[AuditLog] WRITE-ONCE VIOLATION: Audit log records are immutable. " +
          "Modification of existing audit entries is strictly forbidden.",
      ),
    );
  }
  next();
});

auditLogSchema.statics.record = async function ({
  eventType,
  severity = AUDIT_SEVERITY.MEDIUM,
  req = null,
  actorId = null,
  actorRole = "Unauthenticated",
  metadata = {},
}) {
  const entry = new this({
    eventType,
    severity,
    actorId,
    actorRole,
    targetResource: req
      ? `${req.method} ${req.originalUrl || req.path || "UNKNOWN"}`
      : "INTERNAL",
    ipAddress: req
      ? (req.headers["x-forwarded-for"] || req.ip || "UNKNOWN")
          .split(",")[0]
          .trim()
          .substring(0, 45)
      : "INTERNAL",
    userAgent: req
      ? (req.headers["user-agent"] || "UNKNOWN").substring(0, 512)
      : "INTERNAL",
    metadata,
  });

  try {
    await entry.save();
  } catch (err) {
    console.error(
      `[AUDIT LOG] Failed to persist audit entry [${eventType}]:`,
      err.message,
    );
  }

  return entry;
};

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
