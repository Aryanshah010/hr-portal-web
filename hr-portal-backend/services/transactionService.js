import Stripe from "stripe";
import crypto from "crypto";
import fs from "fs";
import https from "https";
import { env } from "../config/environment.js";
import Transaction from "../models/Transaction.js";
import Employee from "../models/Employee.js";
import AppError from "../utils/appError.js";

const stripe = new Stripe(env.stripeSecretKey, {
  maxNetworkRetries: 3,
  httpAgent: new https.Agent({
    minVersion: "TLSv1.3",
    keepAlive: true,
  }),
});

let privateKey;
try {
  if (env.rsaPrivateKeyPath && fs.existsSync(env.rsaPrivateKeyPath)) {
    privateKey = fs.readFileSync(env.rsaPrivateKeyPath, "utf8");
  } else {
    console.warn(
      `[SECURITY WARN] RSA private key not found at path "${env.rsaPrivateKeyPath}". ` +
        `Generating temporary ephemeral 2048-bit RSA key pair in memory for dev testing.`,
    );
    const { privateKey: tempKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    privateKey = tempKey;
  }
} catch (error) {
  console.error(
    "[FATAL ERROR] Cryptographic RSA private key initialization failed:",
    error.message,
  );
  process.exit(1);
}

export const signTransactionPayload = (canonicalPayload) => {
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(canonicalPayload);
  return sign.sign(privateKey, "hex");
};

export const buildCanonicalPayload = (
  employeeId,
  amount,
  idempotencyKey,
  adminId,
) => {
  return `employee=${employeeId}&amountNPR=${amount}&currency=NPR&idempotency=${idempotencyKey}&authorizedBy=${adminId}`;
};

export const initiateSalaryDisbursement = async ({
  employeeId,
  amount,
  adminId,
  idempotencyKey = crypto.randomUUID(),
}) => {
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw new AppError("Target employee record not found.", 404);
  }

  const canonical = buildCanonicalPayload(
    employeeId,
    amount,
    idempotencyKey,
    adminId,
  );
  const signature = signTransactionPayload(canonical);

  let transaction;
  try {
    transaction = await Transaction.create({
      employeeId,
      authorizedBy: adminId,
      type: "SALARY_DISBURSEMENT",
      status: "PENDING",
      amountNPR: amount,
      idempotencyKey,
      digitalSignature: signature,
      signaturePublicKeyId: env.rsaPublicKeyId,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError(
        "Duplicate transaction detected via idempotency guard.",
        409,
      );
    }
    throw new AppError("Failed to record transaction intent in ledger.", 500);
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: Math.round(amount * 100),
        currency: "npr",
        description: `Salary disbursement for Employee ID: ${employeeId}`,
        metadata: {
          transactionId: transaction._id.toString(),
          idempotencyKey,
        },
      },
      {
        idempotencyKey,
      },
    );

    transaction.stripePaymentIntentId = paymentIntent.id;
    await transaction.save();

    return {
      status: "success",
      transactionId: transaction._id,
      clientSecret: paymentIntent.client_secret,
    };
  } catch (stripeError) {
    console.error(
      `[TRANSACTION FAILURE] Rolling back payment intent ${transaction._id}:`,
      stripeError.message,
    );

    transaction.status = "FAILED";
    transaction.errorDetails =
      stripeError.message || "External payment gateway call failed.";
    await transaction.save();

    throw new AppError(
      `Transaction failed at payment provider: ${stripeError.message}`,
      502,
    );
  }
};

export const processSuccessfulPayment = async (paymentIntentId) => {
  const transaction = await Transaction.findOne({
    stripePaymentIntentId: paymentIntentId,
  }).select("+stripePaymentIntentId");
  if (!transaction) {
    console.warn(
      `[WEBHOOK WARN] Transaction not found for PaymentIntent: ${paymentIntentId}`,
    );
    return;
  }

  if (transaction.status === "PENDING") {
    transaction.status = "COMPLETED";
    transaction.completedAt = new Date();
    await transaction.save();
    console.log(
      `[LEDGER SUCCESS] Transaction ${transaction._id} promoted to COMPLETED state.`,
    );
  }
};

export const processFailedPayment = async (paymentIntentId, errorMessage) => {
  const transaction = await Transaction.findOne({
    stripePaymentIntentId: paymentIntentId,
  }).select("+stripePaymentIntentId");
  if (!transaction) {
    return;
  }

  if (transaction.status === "PENDING") {
    transaction.status = "FAILED";
    transaction.errorDetails = errorMessage || "Stripe transaction failed.";
    await transaction.save();
    console.warn(
      `[LEDGER FAILURE] Transaction ${transaction._id} marked as FAILED via webhook callback.`,
    );
  }
};

export const verifyWebhookSignature = (rawBody, signature, secret) => {
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
};
