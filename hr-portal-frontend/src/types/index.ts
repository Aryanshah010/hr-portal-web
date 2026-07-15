export const Role = {
  Employee: "Employee",
  HR: "HR",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const AccountStatus = {
  Registration: "REGISTRATION",
  Pending: "PENDING_APPROVAL",
  Active: "ACTIVE",
  Suspended: "SUSPENDED",
} as const;
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

export const AuditSeverity = {
  Low: "LOW",
  Medium: "MEDIUM",
  High: "HIGH",
  Critical: "CRITICAL",
} as const;
export type AuditSeverity = (typeof AuditSeverity)[keyof typeof AuditSeverity];

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
  tokenInvalidatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  _id: string;
  userId: string;
  name: string;
  email: string;
  department: string | null;
  jobTitle: string | null;
  employmentType: "Regular" | "PartTime" | "Contract";
  joinedAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  _id: string;
  employeeId: string;
  requestedBy: string;
  recordType: "ATTENDANCE" | "LEAVE";
  attendanceDate: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  leaveType: "ANNUAL" | "SICK" | "UNPAID" | "OTHER" | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  decidedBy: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollRun {
  _id: string;
  period: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface Payslip {
  _id: string;
  payrollRunId: string;
  employeeId: string;
  grossNPR: number;
  taxNPR: number;
  deductionsNPR: number;
  netNPR: number;
  payoutStatus: "PENDING" | "COMPLETED" | "FAILED";
  transactionId: string | null;
  generatedBy: string;
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceReview {
  _id: string;
  employeeId: string;
  period: string;
  rating: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  _id: string;
  employeeId: string;
  payrollRunId: string | null;
  payslipId: string | null;
  authorizedBy: string;
  type: "SALARY_DISBURSEMENT" | "PAYSLIP_PAYMENT" | "REFUND";
  status: "PENDING" | "COMPLETED" | "FAILED" | "ROLLED_BACK";
  amountNPR: number;
  idempotencyKey: string;
  digitalSignature: string;
  signaturePublicKeyId: string;
  errorDetails: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

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
  timestamp: string;
}

export interface EmployeeDocument {
  _id: string;
  employeeId: string;
  type: "BANK_PROOF" | "NATIONAL_ID";
  storageName: string;
  mimeType: "application/pdf" | "image/jpeg" | "image/png";
  sha256: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryHistory {
  _id: string;
  employeeId: string;
  effectiveDate: string;
  changedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  status: "success";
  data: T;
}

export interface ApiMessageResponse {
  status: "success";
  message: string;
}

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

export interface ApiError {
  statusCode: number;
  status: "fail" | "error";
  message: string;
  redirected?: boolean;
}

export interface MfaChallenge {
  nextStep:
    | "MFA_CHALLENGE"
    | "MFA_ENROLMENT"
    | "REGISTRATION"
    | "PENDING_APPROVAL"
    | "SUSPENDED";
}

export interface MfaSetupPayload {
  qrCodeUrl: string;
  secret: string;
}

export interface AuthState {
  user: User | null | undefined;
  loading: boolean;
  mfaPending: boolean;
  isAuthenticated: boolean;
}
