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
