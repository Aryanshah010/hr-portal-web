import rateLimit from "express-rate-limit";
import * as audit from "../repositories/auditRepository.js";

const blocklist = new Map();

const blockIp = (ip, durationMs = 24 * 60 * 60 * 1000) => {
  blocklist.set(ip, Date.now() + durationMs);
};

export const unblockIp = (ip) => blocklist.delete(ip);

export const isBlocked = (ip) => {
  const expiry = blocklist.get(ip);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    blocklist.delete(ip);
    return false;
  }
  return true;
};

export const ipBlocklistMiddleware = (req, res, next) => {
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  if (isBlocked(ip)) {
    return res.status(403).json({
      status: "error",
      error: "IP Blocked",
      message: "Your IP address has been blocked due to suspicious activity.",
    });
  }
  next();
};

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const ip = req.ip || req.socket?.remoteAddress;
    if (ip) blockIp(ip, 60 * 60 * 1000); // 1-hour block
    audit.record({
      eventType: "RATE_LIMIT_EXCEEDED",
      severity: "HIGH",
      req,
      actorId: req.user?.id ?? null,
      actorRole: req.user?.role ?? "Unauthenticated",
      metadata: { limiter: "GLOBAL", blockedForMs: 60 * 60 * 1000 },
    });
    res.status(429).json({
      status: "error",
      error: "Too Many Requests",
      message:
        "Rate limit exceeded. Your IP has been temporarily blocked for excessive requests.",
    });
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Authentication Blocked",
    message:
      "Too many authentication failures detected from this source. Access locked for 15 minutes to prevent brute-force profiling.",
  },
});

export const avatarLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Avatar Update Limit Reached",
    message: "Too many avatar updates. Please try again later.",
  },
});

export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Password Reset Limit Reached",
    message:
      "Too many password reset requests from this source. Please wait before trying again.",
  },
});

export const captchaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "CAPTCHA Request Limit Reached",
    message: "Too many CAPTCHA requests. Please wait before trying again.",
  },
});

export const attendanceMutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Attendance Request Limit Reached",
    message:
      "Too many attendance changes were requested. Please try again later.",
  },
});

export const payrollExecutionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Payroll Execution Limit Reached",
    message: "Too many payroll execution requests. Please try again later.",
  },
});

export const payslipReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Payslip Access Limit Reached",
    message: "Too many payslip access requests. Please try again later.",
  },
});
