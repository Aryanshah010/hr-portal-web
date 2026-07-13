import mongoose from "mongoose";
const reviewSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      immutable: true,
    },
    period: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    rating: { type: Number, required: true, min: 1, max: 5 },
    encryptedComment: { type: String, required: true, select: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { strict: true, timestamps: true, versionKey: false },
);
reviewSchema.index({ employeeId: 1, period: 1 }, { unique: true });
reviewSchema.index({ period: -1, rating: 1 });
export default mongoose.model("PerformanceReview", reviewSchema);
