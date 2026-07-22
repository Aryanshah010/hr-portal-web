import fs from "fs";
import https from "https";
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
import {
  globalLimiter,
  ipBlocklistMiddleware,
} from "./middleware/rateLimiter.js";
import { cleanNoSqlInjection } from "./middleware/nosqlSanitizer.js";
import authRoutes from "./routes/authRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import payrollRoutes from "./routes/payrollRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
await connectDatabase();
app.use(configureSecurityHeaders());
app.use(enforceSupplementalHeaders);
app.use(configureCors());
app.use(ipBlocklistMiddleware);
app.use(globalLimiter);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(cleanNoSqlInjection);
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api", employeeRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/audit-logs", auditRoutes);
app.get("/health", (_req, res) =>
  res
    .status(200)
    .json({ status: "healthy", timestamp: new Date().toISOString() }),
);
app.use(globalErrorHandler);

const start = () => {
  if (env.httpsEnabled) {
    const options = {
      cert: fs.readFileSync(env.tlsCertPath),
      key: fs.readFileSync(env.tlsKeyPath),
      minVersion: "TLSv1.3",
      maxVersion: "TLSv1.3",
    };
    https
      .createServer(options, app)
      .listen(env.port, () =>
        console.log(`[SERVER] TLS 1.3 origin listening on ${env.port}`),
      );
  } else
    app.listen(env.port, () =>
      console.log(
        `[SERVER] Development HTTP listening on ${env.port}; enable HTTPS_ENABLED for TLS testing.`,
      ),
    );
};
start();
export default app;
