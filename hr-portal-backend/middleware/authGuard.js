import jwt from "jsonwebtoken";
import { env } from "../config/environment.js";
import * as authRepository from "../repositories/authRepository.js";
import * as userRepository from "../repositories/userRepository.js";
import { ACCOUNT_STATUS } from "../models/User.js";
import { uaHash } from "../utils/generateToken.js";

const PASSWORD_EXPIRY_DAYS = 90;

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.access_token;
    if (!token)
      return res
        .status(401)
        .json({ status: "fail", message: "Authentication required." });
    const decoded = jwt.verify(token, env.jwtSecret, {
      issuer: "secure-hr-portal",
      audience: "secure-hr-web",
    });
    if (!decoded.mfaVerified || !decoded.sid)
      return res
        .status(401)
        .json({ status: "fail", message: "MFA session required." });
    const [session, user] = await Promise.all([
      authRepository.findSession(decoded.sid),
      userRepository.findById(decoded.sub),
    ]);
    if (
      !session ||
      !user ||
      user.accountStatus !== ACCOUNT_STATUS.ACTIVE ||
      user.securityVersion !== decoded.sv
    )
      return res
        .status(401)
        .json({ status: "fail", message: "Session invalid or expired." });

    const currentUah = uaHash(req.get("user-agent"));
    if (decoded.uah && decoded.uah !== currentUah)
      return res.status(401).json({
        status: "fail",
        message: "Session device mismatch. Please sign in again.",
      });

    if (user.passwordChangedAt) {
      const expiryDate = new Date(user.passwordChangedAt);
      expiryDate.setDate(expiryDate.getDate() + PASSWORD_EXPIRY_DAYS);
      if (new Date() > expiryDate)
        return res.status(403).json({
          status: "fail",
          message: "Password expired. Please reset your password.",
          code: "PASSWORD_EXPIRED",
        });
    }
    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      sessionId: session.id,
    };
    next();
  } catch {
    return res
      .status(401)
      .json({ status: "fail", message: "Session invalid or expired." });
  }
};
export const restrictTo =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user?.role)
      ? next()
      : res.status(403).json({
          status: "fail",
          message: "You do not have permission to perform this action.",
        });
