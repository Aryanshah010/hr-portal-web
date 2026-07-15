import mongoose from "mongoose";

export const ROLES = Object.freeze({ EMPLOYEE: "Employee", HR: "HR" });
export const ACCOUNT_STATUS = Object.freeze({
  REGISTRATION: "REGISTRATION",
  PENDING: "PENDING_APPROVAL",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
});

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    googleId: { type: String, unique: true, sparse: true, select: false },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.EMPLOYEE,
      required: true,
    },
    accountStatus: {
      type: String,
      enum: Object.values(ACCOUNT_STATUS),
      default: ACCOUNT_STATUS.REGISTRATION,
      required: true,
      index: true,
    },
    name: { type: String, trim: true, maxlength: 100, default: null },
    jobTitle: { type: String, trim: true, maxlength: 100, default: null },
    department: { type: String, trim: true, maxlength: 100, default: null },
    phoneEncrypted: { type: String, select: false, default: null },
    phoneLookupHash: {
      type: String,
      unique: true,
      sparse: true,
      select: false,
    },
    phoneVerified: { type: Boolean, default: false },
    passwordHash: { type: String, select: false, default: null },
    failedLoginAttempts: { type: Number, default: 0 },
    lockoutUntil: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
    passwordHistory: { type: [String], select: false, default: [] },
    mfaSecretEncrypted: { type: String, select: false, default: null },
    mfaEnabled: { type: Boolean, default: false },
    securityVersion: { type: Number, default: 0, min: 0 },
    tokenInvalidatedAt: { type: Date, default: null },
  },
  { strict: true, strictQuery: true, timestamps: true, versionKey: false },
);

userSchema.index({ role: 1, accountStatus: 1 });
export default mongoose.model("User", userSchema);
