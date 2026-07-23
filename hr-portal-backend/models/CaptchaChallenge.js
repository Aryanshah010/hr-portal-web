import mongoose from "mongoose";

const captchaChallengeSchema = new mongoose.Schema(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    answerHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date, default: null },
  },
  { strict: true, timestamps: true, versionKey: false },
);

captchaChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("CaptchaChallenge", captchaChallengeSchema);
