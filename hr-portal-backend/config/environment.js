import dotenv from "dotenv";

dotenv.config();

const required = (name, fallback = null) => process.env[name] || fallback;
const nodeEnv = required("NODE_ENV", "development");
const isProduction = nodeEnv === "production";

// Keep local coursework setup friendly, but never allow a production process to
// start without its security-critical configuration.
const requireInProduction = (name, fallback = null) => {
  const value = required(name, fallback);
  if (isProduction && !value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const encryptionKey = requireInProduction("DATABASE_ENCRYPTION_KEY", "0".repeat(64));
const payrollKey = requireInProduction("PAYROLL_ENCRYPTION_KEY", "1".repeat(64));
if (!/^[a-fA-F0-9]{64}$/.test(encryptionKey) || !/^[a-fA-F0-9]{64}$/.test(payrollKey)) {
  throw new Error("DATABASE_ENCRYPTION_KEY and PAYROLL_ENCRYPTION_KEY must be 64-character hex keys.");
}

const mongoUri = requireInProduction("MONGO_URI", "mongodb://127.0.0.1:27017/secure_hr_portal");
if (isProduction && !/^mongodb(\+srv)?:\/\//.test(mongoUri)) {
  throw new Error("MONGO_URI must use a MongoDB connection URI.");
}

export const env = Object.freeze({
  nodeEnv,
  isProduction,
  port: Number.parseInt(required("PORT", "5000"), 10),
  frontendUrl: required("FRONTEND_URL", "https://localhost:3000").replace(/\/$/, ""),
  mongoUri,
  jwtSecret: requireInProduction("JWT_SECRET", "development-only-jwt-secret-change-me"),
  flowSecret: requireInProduction("AUTH_FLOW_SECRET", required("JWT_SECRET", "development-only-flow-secret-change-me")),
  dbEncryptionKey: Buffer.from(encryptionKey, "hex"),
  payrollEncryptionKey: Buffer.from(payrollKey, "hex"),
  googleClientId: requireInProduction("GOOGLE_CLIENT_ID"),
  googleClientSecret: requireInProduction("GOOGLE_CLIENT_SECRET"),
  googleCallbackUrl: requireInProduction("GOOGLE_CALLBACK_URL"),
  oauthStateSecret: requireInProduction("OAUTH_STATE_SECRET", required("JWT_SECRET", "development-oauth-state-secret")),
  stripeSecretKey: requireInProduction("STRIPE_SECRET_KEY", "sk_test_placeholder"),
  stripeWebhookSecret: requireInProduction("STRIPE_WEBHOOK_SECRET", "whsec_placeholder"),
  twilioAccountSid: required("TWILIO_ACCOUNT_SID"),
  twilioAuthToken: required("TWILIO_AUTH_TOKEN"),
  twilioFromNumber: required("TWILIO_FROM_NUMBER"),
  initialHrEmails: new Set((required("INITIAL_HR_EMAILS", "").split(",")).map((email) => email.trim().toLowerCase()).filter(Boolean)),
  documentStoragePath: required("DOCUMENT_STORAGE_PATH", "./private-documents"),
  tlsCertPath: required("TLS_CERT_PATH"),
  tlsKeyPath: required("TLS_KEY_PATH"),
  httpsEnabled: process.env.HTTPS_ENABLED === "true" || isProduction,
  cloudflareEnabled: process.env.CLOUDFLARE_ENABLED === "true" || isProduction,
  payrollTaxRate: Number(required("PAYROLL_TAX_RATE", "0.1")),
  payrollDeductionRate: Number(required("PAYROLL_DEDUCTION_RATE", "0")),
  payrollBatchSize: Number.parseInt(required("PAYROLL_BATCH_SIZE", "25"), 10),
  rsaPrivateKeyPath: required("RSA_PRIVATE_KEY_PATH"),
  rsaPublicKeyId: required("RSA_PUBLIC_KEY_ID", "coursework-key-v1"),
});

if (env.isProduction && (!env.tlsCertPath || !env.tlsKeyPath)) {
  throw new Error("TLS_CERT_PATH and TLS_KEY_PATH are required in production.");
}
