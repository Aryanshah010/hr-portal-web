import dotenv from "dotenv";
import path from "path";

dotenv.config();

const requiredEnvVars = [
  "NODE_ENV",
  "PORT",
  "MONGO_URI",
  "FRONTEND_URL",
  "DATABASE_ENCRYPTION_KEY",
];


for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.error(
      `[FATAL ERROR] Missing required environment variable: ${varName}`,
    );
    process.exit(1);
  }
}

const aesKey = process.env.DATABASE_ENCRYPTION_KEY;
if (aesKey.length !== 64) {
  console.error(
    "[FATAL ERROR] DATABASE_ENCRYPTION_KEY must be a 64-character hex string (256-bit).",
  );
  process.exit(1);
}

export const env = {
  nodeEnv: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGO_URI,
  frontendUrl: process.env.FRONTEND_URL,
  encryptionKey: Buffer.from(aesKey, "hex"),
};
