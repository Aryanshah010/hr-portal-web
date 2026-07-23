import AuthSession from "../models/AuthSession.js";
import OtpChallenge from "../models/OtpChallenge.js";
import CaptchaChallenge from "../models/CaptchaChallenge.js";

export const createSession = (data) => AuthSession.create(data);

export const findSession = (id) =>
  AuthSession.findOne({
    _id: id,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });

export const revokeSession = (id) =>
  AuthSession.findByIdAndUpdate(
    id,
    { $set: { revokedAt: new Date() } },
    { new: true },
  );

export const revokeUserSessions = (userId) =>
  AuthSession.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );

export const findRefreshSession = (tokenHash) =>
  AuthSession.findOne({
    refreshTokenHash: tokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).select("+refreshTokenHash");

export const createOtp = (data) => OtpChallenge.create(data);

export const latestOtp = (userId, purpose) =>
  OtpChallenge.findOne({
    userId,
    purpose,
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .select("+codeHash");

export const recordOtpFailure = (id) =>
  OtpChallenge.findByIdAndUpdate(id, { $inc: { attempts: 1 } }, { new: true });

export const consumeOtp = (id) =>
  OtpChallenge.findByIdAndUpdate(
    id,
    { $set: { consumedAt: new Date() } },
    { new: true },
  );

export const createCaptcha = (data) => CaptchaChallenge.create(data);

export const consumeCaptcha = (tokenHash) =>
  CaptchaChallenge.findOneAndUpdate(
    { tokenHash, consumedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { consumedAt: new Date() } },
    { new: true },
  ).select("+answerHash");
