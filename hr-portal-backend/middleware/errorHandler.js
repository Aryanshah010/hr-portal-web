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

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      status: "fail",
      message: "The submitted data does not meet record requirements.",
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      status: "fail",
      message: "A record with these unique values already exists.",
    });
  }

  res.status(500).json({
    status: "error",
    message:
      "An internal system anomaly occurred. Please reference infrastructure administration logs.",
  });
};
