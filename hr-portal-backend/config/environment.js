import dotenv from "dotenv";

dotenv.config();

const requiredEnvVars = [
  "NODE_ENV",
  "PORT",
  "MONGO_URI",
  "FRONTEND_URL",
  "DATABASE_ENCRYPTION_KEY",
  "JWT_SECRET",
  "PAYROLL_ENCRYPTION_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_CALLBACK_URL",
  "OAUTH_STATE_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
];

for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.error(
      `[FATAL ERROR] Missing required environment variable: ${varName}`,
    );
    process.exit(1);
  }
}

const aesDbKey = process.env.DATABASE_ENCRYPTION_KEY;
if (aesDbKey.length !== 64) {
  console.error(
    "[FATAL ERROR] DATABASE_ENCRYPTION_KEY must be exactly a 64-character hex string (256-bit key structure).",
  );
  process.exit(1);
}

const aesPayrollKey = process.env.PAYROLL_ENCRYPTION_KEY;
if (aesPayrollKey.length !== 64) {
  console.error(
    "[FATAL ERROR] PAYROLL_ENCRYPTION_KEY must be exactly a 64-character hex string (256-bit key structure).",
  );
  process.exit(1);
}

export const env = {
  nodeEnv: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGO_URI,
  frontendUrl: process.env.FRONTEND_URL,
  jwtSecret: process.env.JWT_SECRET,
  dbEncryptionKey: Buffer.from(aesDbKey, "hex"),
  payrollEncryptionKey: Buffer.from(aesPayrollKey, "hex"),

  // Google OAuth 2.0 Configuration
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL,
  oauthStateSecret: process.env.OAUTH_STATE_SECRET,

  // Stripe Payment Integration
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,

  // Cloudflare Edge Gate Configuration
  cloudflareEnabled: process.env.CLOUDFLARE_ENABLED === "true",
  cfThreatScoreThreshold: parseInt(process.env.CF_THREAT_SCORE_THRESHOLD, 10) || 50,

  // RSA Key Management for Digital Signatures
  rsaPrivateKeyPath: process.env.RSA_PRIVATE_KEY_PATH || "./private.pem",
  rsaPublicKeyId: process.env.RSA_PUBLIC_KEY_ID || "key-2026-v1",
};
