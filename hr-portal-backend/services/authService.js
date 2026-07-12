import crypto from "crypto";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import AppError from "../utils/appError.js";
import { decrypt, encrypt, hashSecret } from "../utils/cryptoUtil.js";
import {
  generateAccessToken,
  signFlowToken,
  verifyFlowToken,
} from "../utils/generateToken.js";
import { env } from "../config/environment.js";
import * as users from "../repositories/userRepository.js";
import * as employees from "../repositories/employeeRepository.js";
import * as auth from "../repositories/authRepository.js";
import * as audit from "../repositories/auditRepository.js";
import { ROLES, ACCOUNT_STATUS } from "../models/User.js";
import { sendSms } from "./smsService.js";

const refreshDays = 7;
const flow = (user, purpose, expiresIn = "10m") =>
  signFlowToken({ sub: user.id || user._id.toString(), purpose }, expiresIn);
const verifyPurpose = (token, purpose) => {
  try {
    const data = verifyFlowToken(token);
    if (data.purpose !== purpose) throw new Error();
    return data.sub;
  } catch {
    throw new AppError("Authentication flow expired. Start again.", 401);
  }
};
const cleanUser = (user) => ({
  id: user.id || user._id.toString(),
  email: user.email,
  role: user.role,
  accountStatus: user.accountStatus,
  name: user.name,
  jobTitle: user.jobTitle,
  department: user.department,
  mfaEnabled: user.mfaEnabled,
});
const newOtp = () => crypto.randomInt(100000, 1000000).toString();

export const registerGoogleIdentity = async ({ googleId, email, name }) => {
  let user = await users.findByEmail(email, "+googleId");
  if (!user) {
    user = await users.createGoogleUser({
      email,
      googleId,
      name: name?.slice(0, 100) || null,
      role: env.initialHrEmails.has(email) ? ROLES.HR : ROLES.EMPLOYEE,
      accountStatus: env.initialHrEmails.has(email)
        ? ACCOUNT_STATUS.ACTIVE
        : ACCOUNT_STATUS.REGISTRATION,
    });
  } else if (user.googleId && user.googleId !== googleId) {
    throw new AppError("Google account identity mismatch.", 403);
  } else if (!user.googleId) {
    user = await users.updateById(user.id, { googleId });
  }
  return user;
};

export const nextGoogleStep = (user) => {
  if (user.accountStatus === ACCOUNT_STATUS.REGISTRATION)
    return { state: "REGISTRATION", flowToken: flow(user, "REGISTRATION") };
  if (user.accountStatus === ACCOUNT_STATUS.PENDING)
    return { state: "PENDING_APPROVAL" };
  if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE)
    return { state: "SUSPENDED" };
  return user.mfaEnabled
    ? { state: "MFA_CHALLENGE", flowToken: flow(user, "MFA_CHALLENGE", "5m") }
    : { state: "MFA_ENROLMENT", flowToken: flow(user, "MFA_ENROLMENT", "10m") };
};

export const sendPhoneVerification = async ({ registrationToken, phone }) => {
  const userId = verifyPurpose(registrationToken, "REGISTRATION");
  const user = await users.findById(userId);
  if (!user || user.accountStatus !== ACCOUNT_STATUS.REGISTRATION)
    throw new AppError("Registration is not available.", 409);
  const code = newOtp();
  await users.updateById(userId, {
    phoneEncrypted: encrypt(phone),
    phoneVerified: false,
  });
  await auth.createOtp({
    userId,
    purpose: "PHONE_VERIFY",
    codeHash: hashSecret(code),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  await sendSms({
    to: phone,
    body: `Your HR Portal verification code is ${code}. It expires in 10 minutes.`,
  });
};

const verifyOtp = async ({ userId, purpose, code }) => {
  const challenge = await auth.latestOtp(userId, purpose);
  if (!challenge || challenge.attempts >= 3)
    throw new AppError("Invalid or expired verification code.", 400);
  if (
    !crypto.timingSafeEqual(
      Buffer.from(challenge.codeHash),
      Buffer.from(hashSecret(code)),
    )
  ) {
    await auth.recordOtpFailure(challenge.id);
    throw new AppError("Invalid or expired verification code.", 400);
  }
  await auth.consumeOtp(challenge.id);
};
export const verifyPhone = async ({ registrationToken, code }) => {
  const userId = verifyPurpose(registrationToken, "REGISTRATION");
  await verifyOtp({ userId, purpose: "PHONE_VERIFY", code });
  return users.updateById(userId, { phoneVerified: true });
};

export const completeRegistration = async ({
  registrationToken,
  profile,
  req,
}) => {
  const userId = verifyPurpose(registrationToken, "REGISTRATION");
  const user = await users.findById(userId);
  if (!user?.phoneVerified)
    throw new AppError(
      "Verify your phone number before submitting registration.",
      400,
    );
  const updated = await users.completeRegistration(userId, profile);
  await employees.create({
    userId,
    name: profile.name,
    email: updated.email,
    department: profile.department,
    jobTitle: profile.jobTitle,
  });
  await audit.record({
    eventType: "EMPLOYEE_CREATED",
    severity: "MEDIUM",
    req,
    actorId: userId,
    actorRole: ROLES.EMPLOYEE,
    metadata: { registration: true },
  });
  return cleanUser(updated);
};

export const approveEmployee = async ({ userId, hrId, req }) => {
  const user = await users.findById(userId);
  if (
    !user ||
    user.role !== ROLES.EMPLOYEE ||
    user.accountStatus !== ACCOUNT_STATUS.PENDING
  )
    throw new AppError("Pending employee not found.", 404);
  const active = await users.activate(userId);
  await audit.record({
    eventType: "EMPLOYEE_UPDATED",
    severity: "HIGH",
    req,
    actorId: hrId,
    actorRole: ROLES.HR,
    metadata: { targetUserId: userId, action: "APPROVED" },
  });
  return cleanUser(active);
};

export const mfaSetup = async (token) => {
  const userId = verifyPurpose(token, "MFA_ENROLMENT");
  const user = await users.findById(userId);
  if (!user || user.accountStatus !== ACCOUNT_STATUS.ACTIVE)
    throw new AppError("Account is not active.", 403);
  const secret = authenticator.generateSecret();
  await users.updateById(userId, {
    mfaSecretEncrypted: encrypt(secret),
    mfaEnabled: false,
  });
  return {
    otpauthUrl: authenticator.keyuri(user.email, "Secure HR Portal", secret),
    qrCodeDataUrl: await QRCode.toDataURL(
      authenticator.keyuri(user.email, "Secure HR Portal", secret),
    ),
  };
};

export const confirmMfa = async ({ token, code, req }) => {
  const userId = verifyPurpose(token, "MFA_ENROLMENT");
  const user = await users.findById(userId, "+mfaSecretEncrypted");
  if (
    !user?.mfaSecretEncrypted ||
    !authenticator.verify({
      token: code,
      secret: decrypt(user.mfaSecretEncrypted),
    })
  )
    throw new AppError("Invalid authenticator code.", 400);
  const updated = await users.updateById(userId, { mfaEnabled: true });
  await audit.record({
    eventType: "AUTH_MFA_ENROLLED",
    severity: "HIGH",
    req,
    actorId: userId,
    actorRole: updated.role,
  });
  return createSession(updated, req);
};

export const createSession = async (user, req) => {
  const rawRefreshToken = crypto.randomBytes(48).toString("base64url");
  const session = await auth.createSession({
    userId: user.id || user._id,
    refreshTokenHash: hashSecret(rawRefreshToken),
    expiresAt: new Date(Date.now() + refreshDays * 86400000),
    mfaVerifiedAt: new Date(),
    userAgent: req.get("user-agent") || "UNKNOWN",
  });
  return {
    user: cleanUser(user),
    accessToken: generateAccessToken({ user, sessionId: session.id }),
    refreshToken: rawRefreshToken,
    sessionId: session.id,
  };
};

export const verifyTotp = async ({ token, code, req }) => {
  const userId = verifyPurpose(token, "MFA_CHALLENGE");
  const user = await users.findById(userId, "+mfaSecretEncrypted");
  if (
    !user?.mfaEnabled ||
    !authenticator.verify({
      token: code,
      secret: decrypt(user.mfaSecretEncrypted),
    })
  ) {
    await audit.record({
      eventType: "AUTH_MFA_FAILED",
      severity: "HIGH",
      req,
      actorId: userId,
      actorRole: user?.role || "Unauthenticated",
    });
    throw new AppError("Invalid authenticator code.", 401);
  }
  await audit.record({
    eventType: "AUTH_MFA_VERIFIED",
    severity: "MEDIUM",
    req,
    actorId: userId,
    actorRole: user.role,
  });
  return createSession(user, req);
};

export const sendRecoverySms = async ({ token }) => {
  const userId = verifyPurpose(token, "MFA_CHALLENGE");
  const user = await users.findById(userId, "+phoneEncrypted");
  if (!user?.phoneVerified || !user.phoneEncrypted)
    throw new AppError("SMS recovery is unavailable for this account.", 400);
  const code = newOtp();
  await auth.createOtp({
    userId,
    purpose: "MFA_RECOVERY",
    codeHash: hashSecret(code),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  await sendSms({
    to: decrypt(user.phoneEncrypted),
    body: `Your HR Portal recovery code is ${code}. It expires in 10 minutes.`,
  });
};
export const verifyRecoverySms = async ({ token, code, req }) => {
  const userId = verifyPurpose(token, "MFA_CHALLENGE");
  await verifyOtp({ userId, purpose: "MFA_RECOVERY", code });
  const user = await users.findById(userId);
  return createSession(user, req);
};
export const refresh = async ({ refreshToken, req }) => {
  const current = await auth.findRefreshSession(hashSecret(refreshToken));
  if (!current) throw new AppError("Session expired. Sign in again.", 401);
  await auth.revokeSession(current.id);
  const user = await users.findById(current.userId);
  if (!user || user.accountStatus !== ACCOUNT_STATUS.ACTIVE || !user.mfaEnabled)
    throw new AppError("Session is no longer valid.", 401);
  return createSession(user, req);
};
export const logout = async (sessionId) => {
  if (sessionId) await auth.revokeSession(sessionId);
};
export const currentUser = async (id) => cleanUser(await users.findById(id));
