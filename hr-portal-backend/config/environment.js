import dotenv from "dotenv";

dotenv.config();

const required = (name, fallback = null) => process.env[name] || fallback;
const nodeEnv = required("NODE_ENV", "development");
const isProduction = nodeEnv === "production";

const requireInProduction = (name, fallback = null) => {
  const value = required(name, fallback);
  if (isProduction && !value)
    throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const INSECURE_DEFAULT_KEYS = new Set(["0".repeat(64), "1".repeat(64)]);
const allowInsecureDevKeys = process.env.ALLOW_INSECURE_DEV_KEYS === "true";

const encryptionKey = requireInProduction(
  "DATABASE_ENCRYPTION_KEY",
  "0".repeat(64),
);
const payrollKey = requireInProduction(
  "PAYROLL_ENCRYPTION_KEY",
  "1".repeat(64),
);
if (
  !/^[a-fA-F0-9]{64}$/.test(encryptionKey) ||
  !/^[a-fA-F0-9]{64}$/.test(payrollKey)
) {
  throw new Error(
    "DATABASE_ENCRYPTION_KEY and PAYROLL_ENCRYPTION_KEY must be 64-character hex keys.",
  );
}
for (const [name, value] of [
  ["DATABASE_ENCRYPTION_KEY", encryptionKey],
  ["PAYROLL_ENCRYPTION_KEY", payrollKey],
]) {
  if (!INSECURE_DEFAULT_KEYS.has(value)) continue;
  if (isProduction || !allowInsecureDevKeys)
    throw new Error(
      `${name} is the built-in placeholder key. Generate one with ` +
        `"openssl rand -hex 32" and set it in .env. To run without real keys ` +
        `for throwaway local testing, set ALLOW_INSECURE_DEV_KEYS=true — data ` +
        `written under the placeholder key is not protected.`,
    );
  console.warn(
    `[SECURITY WARNING] ${name} is the built-in placeholder key. Stored data is NOT protected.`,
  );
}

const mongoUri = requireInProduction(
  "MONGO_URI",
  "mongodb://127.0.0.1:27017/secure_hr_portal",
);
if (isProduction && !/^mongodb(\+srv)?:\/\//.test(mongoUri)) {
  throw new Error("MONGO_URI must use a MongoDB connection URI.");
}

export const env = Object.freeze({
  nodeEnv,
  isProduction,
  port: Number.parseInt(required("PORT", "5000"), 10),
  frontendUrl: required("FRONTEND_URL", "https://localhost:3000").replace(
    /\/$/,
    "",
  ),
  mongoUri,
  jwtSecret: requireInProduction(
    "JWT_SECRET",
    "development-only-jwt-secret-change-me",
  ),
  flowSecret: requireInProduction(
    "AUTH_FLOW_SECRET",
    required("JWT_SECRET", "development-only-flow-secret-change-me"),
  ),
  csrfSecret: requireInProduction(
    "CSRF_SECRET",
    "development-only-csrf-secret-change-me",
  ),
  phoneLookupSecret: requireInProduction(
    "PHONE_LOOKUP_SECRET",
    "development-only-phone-lookup-secret-change-me",
  ),
  dbEncryptionKey: Buffer.from(encryptionKey, "hex"),
  payrollEncryptionKey: Buffer.from(payrollKey, "hex"),
  googleClientId: requireInProduction("GOOGLE_CLIENT_ID"),
  googleClientSecret: requireInProduction("GOOGLE_CLIENT_SECRET"),
  googleCallbackUrl: requireInProduction("GOOGLE_CALLBACK_URL"),
  oauthStateSecret: requireInProduction(
    "OAUTH_STATE_SECRET",
    required("JWT_SECRET", "development-oauth-state-secret"),
  ),
  // eSewa Configurations
  esewaMerchantCode: process.env.ESEWA_MERCHANT_CODE || "EPAYTEST",
  esewaSecretKey: process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q",
  twilioAccountSid: required("TWILIO_ACCOUNT_SID"),
  twilioAuthToken: required("TWILIO_AUTH_TOKEN"),
  twilioFromNumber: required("TWILIO_FROM_NUMBER"),
  initialHrEmails: new Set(
    required("INITIAL_HR_EMAILS", "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  ),
  documentStoragePath: required("DOCUMENT_STORAGE_PATH", "./private-documents"),
  tlsCertPath: required("TLS_CERT_PATH"),
  tlsKeyPath: required("TLS_KEY_PATH"),
  httpsEnabled: process.env.HTTPS_ENABLED === "true" || isProduction,
  payrollTaxRate: Number(required("PAYROLL_TAX_RATE", "0.1")),
  payrollDeductionRate: Number(required("PAYROLL_DEDUCTION_RATE", "0")),
  payrollBatchSize: Number.parseInt(required("PAYROLL_BATCH_SIZE", "25"), 10),
  rsaPrivateKeyPath: required("RSA_PRIVATE_KEY_PATH"),
  rsaPublicKeyPath: required("RSA_PUBLIC_KEY_PATH", "./public.pem"),
  rsaPublicKeyId: required("RSA_PUBLIC_KEY_ID", "coursework-key-v1"),
  trustProxy: Number.parseInt(required("TRUST_PROXY", "0"), 10) || 0,
  avatarHostAllowlist: new Set(
    required("AVATAR_HOST_ALLOWLIST", "")
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
  ),
});

if (env.isProduction && (!env.tlsCertPath || !env.tlsKeyPath)) {
  throw new Error("TLS_CERT_PATH and TLS_KEY_PATH are required in production.");
}
