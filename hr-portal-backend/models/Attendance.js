import mongoose from "mongoose";

const encryptedValue = (value) =>
  value == null || (typeof value === "string" && value.split(":").length === 3);

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      immutable: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    recordType: {
      type: String,
      enum: ["ATTENDANCE", "LEAVE"],
      required: true,
      immutable: true,
    },
    attendanceDate: { type: Date, required: true, immutable: true },
    checkInAt: { type: Date, default: null, immutable: true },
    checkOutAt: { type: Date, default: null, immutable: true },
    leaveType: {
      type: String,
      enum: ["ANNUAL", "SICK", "UNPAID", "OTHER", null],
      default: null,
      immutable: true,
    },
    encryptedReason: {
      type: String,
      default: null,
      select: false,
      validate: {
        validator: encryptedValue,
        message: "Attendance reason must be encrypted before persistence.",
      },
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      required: true,
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    decidedAt: { type: Date, default: null },
    encryptedDecisionComment: {
      type: String,
      default: null,
      select: false,
      validate: {
        validator: encryptedValue,
        message: "Decision comment must be encrypted before persistence.",
      },
    },
  },
  { strict: true, strictQuery: true, timestamps: true, versionKey: false },
);

attendanceSchema.index({ employeeId: 1, attendanceDate: -1 });
attendanceSchema.index({ status: 1, createdAt: -1 });
attendanceSchema.index({ requestedBy: 1, createdAt: -1 });
attendanceSchema.index({ employeeId: 1, attendanceDate: 1 }, { unique: true });

attendanceSchema.pre("save", function (next) {
  if (
    !this.isNew &&
    this.isModified("status") &&
    this._originalStatus !== "PENDING"
  ) {
    return next(
      new Error("A finalized attendance request cannot be decided again."),
    );
  }
  next();
});

attendanceSchema.post("init", function (doc) {
  doc._originalStatus = doc.status;
});

export default mongoose.model("Attendance", attendanceSchema);
