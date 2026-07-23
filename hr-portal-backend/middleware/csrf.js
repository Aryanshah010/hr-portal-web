import crypto from "crypto";
import { env } from "../config/environment.js";
import * as audit from "../repositories/auditRepository.js";

const cookieOptions = {
  httpOnly: true,
  secure: env.httpsEnabled,
  sameSite: "strict",
  path: "/",
};
const tokenFor = (secret) =>
  crypto.createHmac("sha256", env.csrfSecret).update(secret).digest("hex");
const equal = (left, right) => {
  const a = Buffer.from(left || "");
  const b = Buffer.from(right || "");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

export const issueCsrfToken = (req, res) => {
  const secret =
    req.cookies?.csrf_secret || crypto.randomBytes(32).toString("hex");
  if (!req.cookies?.csrf_secret)
    res.cookie("csrf_secret", secret, cookieOptions);
  const token = tokenFor(secret);
  res.cookie("csrf_token", token, { ...cookieOptions, httpOnly: false });
  return token;
};

export const csrfProtection = (req, res, next) => {
  if (
    ["GET", "HEAD", "OPTIONS"].includes(req.method) ||
    req.path === "/webhook"
  )
    return next();

  const origin = req.get("origin");
  if (!origin || origin !== env.frontendUrl) {
    audit.record({
      eventType: "CSRF_TOKEN_INVALID",
      severity: "CRITICAL",
      req,
      actorId: req.user?.id ?? null,
      actorRole: req.user?.role ?? "Unauthenticated",
      metadata: {
        reason: origin ? "UNTRUSTED_ORIGIN" : "MISSING_ORIGIN",
        origin: origin ?? null,
      },
    });
    return res
      .status(403)
      .json({ status: "fail", message: "Untrusted request origin." });
  }
  const secret = req.cookies?.csrf_secret;
  const supplied = req.get("x-csrf-token");
  if (!secret || !supplied || !equal(supplied, tokenFor(secret))) {
    audit.record({
      eventType: "CSRF_TOKEN_INVALID",
      severity: "CRITICAL",
      req,
      actorId: req.user?.id ?? null,
      actorRole: req.user?.role ?? "Unauthenticated",
      metadata: {
        reason: !secret
          ? "NO_SECRET_COOKIE"
          : !supplied
            ? "NO_TOKEN_HEADER"
            : "TOKEN_MISMATCH",
      },
    });
    return res
      .status(403)
      .json({ status: "fail", message: "CSRF validation failed." });
  }
  next();
};
