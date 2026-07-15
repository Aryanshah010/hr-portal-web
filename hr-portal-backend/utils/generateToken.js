import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/environment.js";

/** Hash a User-Agent string so raw UA is never stored in the token. */
const uaHash = (ua) =>
  crypto
    .createHash("sha256")
    .update(ua || "")
    .digest("hex")
    .slice(0, 16);

export const generateAccessToken = ({ user, sessionId, userAgent }) =>
  jwt.sign(
    {
      sub: user.id || user._id.toString(),
      role: user.role,
      sid: sessionId,
      mfaVerified: true,
      sv: user.securityVersion,
      uah: uaHash(userAgent), // User-Agent hash for session binding
    },
    env.jwtSecret,
    { expiresIn: "30d", issuer: "secure-hr-portal", audience: "secure-hr-web" },
  );

export { uaHash };

export const signFlowToken = (payload, expiresIn = "30d") =>
  jwt.sign(payload, env.flowSecret, {
    expiresIn,
    issuer: "secure-hr-portal",
    audience: "secure-hr-flow",
  });
export const verifyFlowToken = (token) =>
  jwt.verify(token, env.flowSecret, {
    issuer: "secure-hr-portal",
    audience: "secure-hr-flow",
  });
