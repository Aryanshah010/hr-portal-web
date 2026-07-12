import jwt from "jsonwebtoken";
import { env } from "../config/environment.js";

export const generateAccessToken = ({ user, sessionId }) =>
  jwt.sign(
    {
      sub: user.id || user._id.toString(),
      role: user.role,
      sid: sessionId,
      mfaVerified: true,
      sv: user.securityVersion,
    },
    env.jwtSecret,
    { expiresIn: "30d", issuer: "secure-hr-portal", audience: "secure-hr-web" },
  );

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
