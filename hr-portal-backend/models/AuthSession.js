import mongoose from "mongoose";
const authSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    mfaVerifiedAt: { type: Date, required: true },
    userAgent: { type: String, maxlength: 512, default: "UNKNOWN" },
  },
  { strict: true, timestamps: true, versionKey: false },
);
authSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.model("AuthSession", authSessionSchema);
