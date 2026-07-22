import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      immutable: true,
    },
    type: {
      type: String,
      enum: ["BANK_PROOF", "NATIONAL_ID"],
      required: true,
      immutable: true,
    },
    originalNameEncrypted: { type: String, required: true, select: false },
    storageName: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
    },
    mimeType: {
      type: String,
      enum: ["application/pdf", "image/jpeg", "image/png"],
      required: true,
    },
    sha256: { type: String, required: true, immutable: true },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
  },
  { strict: true, timestamps: true, versionKey: false },
);

documentSchema.index({ employeeId: 1, type: 1 }, { unique: true });
documentSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("EmployeeDocument", documentSchema);
