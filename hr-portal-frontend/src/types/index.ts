// ─────────────────────────────────────────────────────────────────────────────
// types/index.ts
// Single source of truth for all shared TypeScript types.
// Mirrors backend Mongoose models exactly — keep in sync with /hr-portal-backend/models/*.js
// ─────────────────────────────────────────────────────────────────────────────

// ─── Enums & Constants ───────────────────────────────────────────────────────

/** Mirrors ROLES in models/User.js */
export const Role = {
  Employee: "Employee",
  HR: "HR",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

/** Mirrors ACCOUNT_STATUS in models/User.js */
export const AccountStatus = {
  Registration: "REGISTRATION",
  Pending: "PENDING_APPROVAL",
  Active: "ACTIVE",
  Suspended: "SUSPENDED",
} as const;
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

/** Mirrors AUDIT_SEVERITY in models/AuditLog.js */
export const AuditSeverity = {
  Low: "LOW",
  Medium: "MEDIUM",
  High: "HIGH",
  Critical: "CRITICAL",
} as const;
export type AuditSeverity = (typeof AuditSeverity)[keyof typeof AuditSeverity];

/** Mirrors AUDIT_EVENTS in models/AuditLog.js */
export type AuditEventType =
  | "AUTH_LOGIN_SUCCESS"
  | "AUTH_LOGIN_FAILURE"
  | "AUTH_LOGOUT"
  | "AUTH_TOKEN_INVALID"
  | "AUTH_ACCOUNT_LOCKED"
  | "AUTH_ACCOUNT_UNLOCKED"
  | "AUTH_PASSWORD_CHANGED"
  | "AUTH_PASSWORD_RESET_REQUESTED"
  | "AUTH_MFA_ENROLLED"
  | "AUTH_MFA_VERIFIED"
  | "AUTH_MFA_FAILED"
  | "NOSQL_INJECTION_ATTEMPT"
  | "SSRF_ATTEMPT"
  | "CSRF_TOKEN_INVALID"
  | "RATE_LIMIT_EXCEEDED"
  | "MALFORMED_PAYLOAD"
  | "AUTHZ_ACCESS_DENIED"
  | "AUTHZ_PRIVILEGE_ESCALATION_ATTEMPT"
  | "AUTHZ_IDOR_ATTEMPT"
  | "EMPLOYEE_CREATED"
  | "EMPLOYEE_UPDATED"
  | "EMPLOYEE_DELETED"
  | "SALARY_UPDATED"
  | "PAYSLIP_GENERATED"
  | "PAYROLL_RUN_CREATED"
  | "PAYROLL_RUN_APPROVED"
  | "SALARY_DISBURSEMENT_INITIATED"
  | "BANK_ACCOUNT_UPDATED"
  | "ATTENDANCE_SUBMITTED"
  | "ATTENDANCE_APPROVED"
  | "ATTENDANCE_REJECTED"
  | "PII_ACCESS"
  | "DATA_EXPORT_REQUESTED"
  | "BULK_QUERY_EXECUTED"
  | "SYSTEM_STARTUP"
  | "SYSTEM_ERROR";

// ─── Domain Models ────────────────────────────────────────────────────────────

/**
 * Mirrors models/User.js
 * Note: sensitive server-side fields (passwordHash, mfaSecretEncrypted,
 * googleId, phoneEncrypted, phoneLookupHash) are never sent to clients.
 */
export interface User {
  _id: string;
  email: string;
  role: Role;
  accountStatus: AccountStatus;
  name: string | null;
  jobTitle: string | null;
  department: string | null;
  phoneVerified: boolean;
  mfaEnabled: boolean;
  securityVersion: number;
  tokenInvalidatedAt: string | null; // ISO 8601
  createdAt: string;
  updatedAt: string;
}

/**
 * Mirrors models/Employee.js
 * Encrypted fields (nationalIdEncrypted, bankAccountEncrypted,
 * baseSalaryEncrypted) are never returned to clients.
 */
export interface Employee {
  _id: string;
  userId: string;
  name: string;
  email: string;
  department: string | null;
  jobTitle: string | null;
  employmentType: "Regular" | "PartTime" | "Contract";
  joinedAt: string; // ISO 8601
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors models/Attendance.js */
export interface Attendance {
  _id: string;
  employeeId: string;
  requestedBy: string;
  recordType: "ATTENDANCE" | "LEAVE";
  attendanceDate: string; // ISO 8601
  checkInAt: string | null;
  checkOutAt: string | null;
  leaveType: "ANNUAL" | "SICK" | "UNPAID" | "OTHER" | null;
  /** encryptedReason is select:false — never sent to the client */
  status: "PENDING" | "APPROVED" | "REJECTED";
  decidedBy: string | null;
  decidedAt: string | null;
  /** encryptedDecisionComment is select:false — never sent to the client */
  createdAt: string;
  updatedAt: string;
}

/** Mirrors models/PayrollRun.js */
export interface PayrollRun {
  _id: string;
  period: string; // "YYYY-MM"
  status:
    | "DRAFT"
    | "PENDING_APPROVAL"
    | "APPROVED"
    | "PROCESSING"
    | "COMPLETED"
    | "FAILED";
  employeeCount: number;
  totals: {
    grossNPR: number;
    taxNPR: number;
    deductionsNPR: number;
    netNPR: number;
  };
  createdBy: string;
  approvedBy: string | null;
  approvedAt: string | null;
  executionStartedAt: string | null;
  completedAt: string | null;
  failureReason: string | null;
  /** encryptedChecksum is select:false — never sent to the client */
  createdAt: string;
  updatedAt: string;
}

/** Mirrors models/Payslip.js */
export interface Payslip {
  _id: string;
  payrollRunId: string;
  employeeId: string;
  grossNPR: number;
  taxNPR: number;
  deductionsNPR: number;
  netNPR: number;
  /** encryptedPayload is select:false — never sent to the client */
  payoutStatus: "PENDING" | "COMPLETED" | "FAILED";
  transactionId: string | null;
  generatedBy: string;
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors models/PerformanceReview.js */
export interface PerformanceReview {
  _id: string;
  employeeId: string;
  period: string; // "YYYY-MM"
  rating: number; // 1–5
  /** encryptedComment is select:false — never sent to the client */
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors models/Transaction.js */
export interface Transaction {
  _id: string;
  employeeId: string;
  payrollRunId: string | null;
  payslipId: string | null;
  authorizedBy: string;
  type: "SALARY_DISBURSEMENT" | "PAYSLIP_PAYMENT" | "REFUND";
  status: "PENDING" | "COMPLETED" | "FAILED" | "ROLLED_BACK";
  amountNPR: number;
  /** stripePaymentIntentId is select:false — never sent to the client */
  idempotencyKey: string;
  digitalSignature: string;
  signaturePublicKeyId: string;
  errorDetails: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors models/AuditLog.js */
export interface AuditLog {
  _id: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  actorId: string | null;
  actorRole: Role | "Unauthenticated";
  targetResource: string;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, unknown>;
  timestamp: string; // ISO 8601
}

/** Mirrors models/EmployeeDocument.js */
export interface EmployeeDocument {
  _id: string;
  employeeId: string;
  type: "BANK_PROOF" | "NATIONAL_ID";
  /** originalNameEncrypted is select:false — never sent to the client */
  storageName: string;
  mimeType: "application/pdf" | "image/jpeg" | "image/png";
  sha256: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors models/SalaryHistory.js (supporting model) */
export interface SalaryHistory {
  _id: string;
  employeeId: string;
  /** oldBaseSalary / newBaseSalary are select:false encrypted values — never sent */
  effectiveDate: string;
  changedBy: string;
  createdAt: string;
  updatedAt: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

/** Backend success envelope: { status: "success", data: T } */
export interface ApiResponse<T> {
  status: "success";
  data: T;
}

/** Backend message-only success envelope: { status: "success", message: string } */
export interface ApiMessageResponse {
  status: "success";
  message: string;
}

/** Paginated list wrapper returned by list endpoints */
export interface PaginatedResponse<T> {
  status: "success";
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * Normalised client-side error shape.
 * The axios response interceptor in apiClient.ts always converts
 * backend error bodies into this shape so pages never render raw stack traces.
 */
export interface ApiError {
  /** HTTP status code */
  statusCode: number;
  /** "fail" (4xx client error) | "error" (5xx server error) */
  status: "fail" | "error";
  /** Human-readable message safe to display to the user */
  message: string;
  /** true when the 401 interceptor has already redirected to /login */
  redirected?: boolean;
}

// ─── Auth-specific Types ──────────────────────────────────────────────────────

/**
 * MFA challenge state returned by login / OAuth callback.
 * When nextStep === "MFA_CHALLENGE" the client must show the TOTP entry form.
 * When nextStep === "MFA_ENROLMENT" the client must show the QR setup flow.
 */
export interface MfaChallenge {
  nextStep:
    | "MFA_CHALLENGE"
    | "MFA_ENROLMENT"
    | "REGISTRATION"
    | "PENDING_APPROVAL"
    | "SUSPENDED";
}

/** Shape of the /auth/mfa/setup response */
export interface MfaSetupPayload {
  qrCodeUrl: string;
  secret: string;
}

/**
 * Global authentication state held in AuthContext.
 * Drives route guards, UI visibility, and session management.
 */
export interface AuthState {
  /** null while loading, undefined when unauthenticated */
  user: User | null | undefined;
  /** true while the initial /auth/me check is in flight */
  loading: boolean;
  /** true if a login attempt returned a nextStep that requires TOTP */
  mfaPending: boolean;
  /** true if the user has completed MFA and holds an active session */
  isAuthenticated: boolean;
}
