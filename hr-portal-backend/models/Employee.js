import mongoose from "mongoose";

const encrypted = (value) =>
  value === null ||
  (typeof value === "string" && value.split(":").length === 3);
const employeeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      immutable: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    department: { type: String, trim: true, maxlength: 100, default: null },
    jobTitle: { type: String, trim: true, maxlength: 100, default: null },
    avatarStorageName: { type: String, default: null },
    avatarMimeType: {
      type: String,
      enum: ["image/jpeg", "image/png", null],
      default: null,
    },
    avatarSourceUrl: { type: String, default: null, maxlength: 2048 },
    nationalIdEncrypted: {
      type: String,
      select: false,
      default: null,
      validate: {
        validator: encrypted,
        message: "National ID must be encrypted.",
      },
    },
    bankAccountEncrypted: {
      type: String,
      select: false,
      default: null,
      validate: {
        validator: encrypted,
        message: "Bank account must be encrypted.",
      },
    },
    baseSalaryEncrypted: {
      type: String,
      select: false,
      default: null,
      validate: { validator: encrypted, message: "Salary must be encrypted." },
    },
    employmentType: {
      type: String,
      enum: ["Regular", "PartTime", "Contract"],
      default: "Regular",
    },
    joinedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { strict: true, strictQuery: true, timestamps: true, versionKey: false },
);
employeeSchema.index({ isActive: 1, department: 1 });
export default mongoose.model("Employee", employeeSchema);
