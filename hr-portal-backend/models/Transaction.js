import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee reference is required."],
    },
    payrollRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PayrollRun",
      default: null,
    },
    payslipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payslip",
      default: null,
    },
    authorizedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Authorizing user reference is required."],
    },
    type: {
      type: String,
      enum: {
        values: ["SALARY_DISBURSEMENT", "PAYSLIP_PAYMENT", "REFUND"],
        message: "Transaction type '{VALUE}' is not a recognized system type.",
      },
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: ["PENDING", "COMPLETED", "FAILED", "ROLLED_BACK"],
        message: "Transaction status '{VALUE}' is not a recognized state.",
      },
      default: "PENDING",
      required: true,
    },
    amountNPR: {
      type: Number,
      required: [true, "Amount in NPR is required."],
      min: [0.01, "Transaction amount must be positive."],
    },
    esewaReference: {
      type: String,
      default: null,
      select: false,
    },
    idempotencyKey: {
      type: String,
      required: [
        true,
        "Idempotency key is required to prevent duplicate operations.",
      ],
      unique: true,
    },
    digitalSignature: {
      type: String,
      required: [
        true,
        "Digital signature is required to guarantee transaction payload integrity.",
      ],
    },
    signaturePublicKeyId: {
      type: String,
      required: [
        true,
        "Signature public key ID is required for audit trail tracking.",
      ],
    },
    errorDetails: {
      type: String,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    strict: true,
    strictQuery: true,
    timestamps: true,
    versionKey: false,
  },
);

transactionSchema.index({ employeeId: 1, createdAt: -1 });
transactionSchema.index({ authorizedBy: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ esewaReference: 1 }, { sparse: true });
transactionSchema.index({ payrollRunId: 1, status: 1 }, { sparse: true });

transactionSchema.pre("save", function (next) {
  if (!this.isNew) {
    const originalStatus = this.modifiedPaths().includes("status")
      ? this._originalStatus
      : this.status;
    if (originalStatus === "COMPLETED" || originalStatus === "ROLLED_BACK") {
      return next(
        new Error(
          "[Transaction Ledger] IMMUTABILITY VIOLATION: Existing transactions with terminal states (COMPLETED, ROLLED_BACK) cannot be altered.",
        ),
      );
    }
  }
  next();
});

transactionSchema.post("init", function (doc) {
  doc._originalStatus = doc.status;
});

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
