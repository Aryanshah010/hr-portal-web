import mongoose from "mongoose";

const payrollRunSchema = new mongoose.Schema(
  {
    period: {
      type: String,
      required: true,
      unique: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
      immutable: true,
    },
    status: {
      type: String,
      enum: [
        "DRAFT",
        "PENDING_APPROVAL",
        "APPROVED",
        "PROCESSING",
        "COMPLETED",
        "FAILED",
      ],
      default: "DRAFT",
      required: true,
    },
    employeeCount: { type: Number, required: true, min: 0, immutable: true },
    totals: {
      grossNPR: { type: Number, required: true, min: 0, immutable: true },
      taxNPR: { type: Number, required: true, min: 0, immutable: true },
      deductionsNPR: { type: Number, required: true, min: 0, immutable: true },
      netNPR: { type: Number, required: true, min: 0, immutable: true },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: { type: Date, default: null },
    executionStartedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    failureReason: { type: String, default: null, maxlength: 500 },
    encryptedChecksum: { type: String, required: true, select: false },
  },
  { strict: true, strictQuery: true, timestamps: true, versionKey: false },
);

payrollRunSchema.index({ status: 1, createdAt: -1 });
payrollRunSchema.index({ createdBy: 1, createdAt: -1 });

export default mongoose.model("PayrollRun", payrollRunSchema);
