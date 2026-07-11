import mongoose from "mongoose";

const payslipSchema = new mongoose.Schema(
  {
    payrollRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PayrollRun",
      required: true,
      immutable: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      immutable: true,
    },
    grossNPR: { type: Number, required: true, min: 0, immutable: true },
    taxNPR: { type: Number, required: true, min: 0, immutable: true },
    deductionsNPR: { type: Number, required: true, min: 0, immutable: true },
    netNPR: { type: Number, required: true, min: 0, immutable: true },
    encryptedPayload: { type: String, required: true, select: false },
    payoutStatus: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED"],
      default: "PENDING",
      required: true,
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    generatedAt: { type: Date, default: Date.now, immutable: true },
  },
  { strict: true, strictQuery: true, timestamps: true, versionKey: false },
);

payslipSchema.index({ payrollRunId: 1, employeeId: 1 }, { unique: true });
payslipSchema.index({ employeeId: 1, createdAt: -1 });
payslipSchema.index({ payrollRunId: 1, payoutStatus: 1 });

export default mongoose.model("Payslip", payslipSchema);
