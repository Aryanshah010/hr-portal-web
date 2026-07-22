import mongoose from "mongoose";

const otpChallengeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ["PHONE_VERIFY", "MFA_RECOVERY"],
      required: true,
    },
    codeHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0, min: 0, max: 3 },
    consumedAt: { type: Date, default: null },
  },
  { strict: true, timestamps: true, versionKey: false },
);

otpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpChallengeSchema.index({ userId: 1, purpose: 1, createdAt: -1 });

export default mongoose.model("OtpChallenge", otpChallengeSchema);
