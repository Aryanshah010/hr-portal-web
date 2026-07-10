import express from "express";
import cookieParser from "cookie-parser";
import { env } from "./config/environment.js";
import { connectDatabase } from "./config/db.js";

import {
  configureSecurityHeaders,
  enforceSupplementalHeaders,
} from "./middleware/securityHeaders.js";
import { configureCors } from "./middleware/corsPolicy.js";
import { globalErrorHandler } from "./middleware/errorHandler.js";
import { globalLimiter } from "./middleware/rateLimiter.js";

import {
  cleanNoSqlInjection,
  injectionThreatBus,
} from "./middleware/nosqlSanitizer.js";

import AuditLog, { AUDIT_EVENTS, AUDIT_SEVERITY } from "./models/AuditLog.js";

import { enforceCloudflareGateway } from "./middleware/cloudflareGateway.js";
import authRoutes from "./routes/authRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";

const app = express();

await connectDatabase();

injectionThreatBus.on("nosql:threat", ({ req, metadata }) => {
  AuditLog.record({
    eventType: AUDIT_EVENTS.NOSQL_INJECTION_ATTEMPT,
    severity: AUDIT_SEVERITY.CRITICAL,
    req,
    actorId: req.user?.id ?? null,
    actorRole: req.user?.role ?? "Unauthenticated",
    metadata,
  }).catch((err) => {
    console.error(
      "[SERVER] AuditLog write failed for injection event:",
      err.message,
    );
  });
});

app.use(enforceCloudflareGateway);
app.use(configureSecurityHeaders());
app.use(enforceSupplementalHeaders);
app.use(configureCors());
app.use(globalLimiter);

app.use("/api/transactions/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(cookieParser());

app.use(cleanNoSqlInjection);
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/attendance", attendanceRoutes);

app.get("/health", (req, res) => {
  res
    .status(200)
    .json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.get("/api/test-error", (req, res, next) => {
  throw new Error("DATABASE CORRUPTION: CRITICAL FIELD LEAK ON OBJECT 0x7FFF");
});

app.use(globalErrorHandler);

app.listen(env.port, () => {
  console.log(
    `[SERVER] Perimeter active. Listening on secure port: ${env.port}`,
  );
});
