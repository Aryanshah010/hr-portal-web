import rateLimit from "express-rate-limit";

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too Many Requests",
    message:
      "Rate limit exceeded. System security limits temporary throughput to defend against automated scripting.",
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Authentication Blocked",
    message:
      "Too many authentication failures detected from this source. Access locked for 15 minutes to prevent brute-force profiling.",
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
