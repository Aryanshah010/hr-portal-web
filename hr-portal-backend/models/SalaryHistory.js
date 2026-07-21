import mongoose from "mongoose";

const encryptedValue = (value) =>
  typeof value === "string" && value.split(":").length === 3;

const salaryHistorySchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      immutable: true,
    },
    oldBaseSalary: {
      type: String,
      required: true,
      select: false,
      immutable: true,
      validate: {
        validator: encryptedValue,
        message: "Salary history must be encrypted.",
      },
    },
    newBaseSalary: {
      type: String,
      required: true,
      select: false,
      immutable: true,
      validate: {
        validator: encryptedValue,
        message: "Salary history must be encrypted.",
      },
    },
    effectiveDate: { type: Date, required: true, immutable: true },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
  },
  { strict: true, strictQuery: true, timestamps: true, versionKey: false },
);

salaryHistorySchema.index({ employeeId: 1, effectiveDate: -1 });

export default mongoose.model("SalaryHistory", salaryHistorySchema);
