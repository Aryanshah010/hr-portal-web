import { env } from "../config/environment.js";

export const globalErrorHandler = (err, req, res, next) => {
  console.error(`[ERROR EXCEPTION] [${new Date().toISOString()}]`);
  console.error(`Path: ${req.method} ${req.path}`);
  console.error(err.stack);

  if (err.message && err.message.includes("CORS Policy violation")) {
    return res.status(403).json({
      error: "Security Exception",
      message: "Cross-Origin Request Blocked.",
    });
  }

  res.status(500).json({
    error: "Internal Server Error",
    message:
      "An internal system anomaly occurred. Please reference infrastructure administration logs.",
  });
};
