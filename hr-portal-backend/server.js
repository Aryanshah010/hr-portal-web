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

const app = express();

await connectDatabase();

app.use(configureSecurityHeaders());
app.use(enforceSupplementalHeaders);
app.use(configureCors());
app.use(globalLimiter);

app.use(express.json());
app.use(cookieParser());

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
