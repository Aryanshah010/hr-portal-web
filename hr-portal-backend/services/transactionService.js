import crypto from "crypto";
import fs from "fs";
import https from "https";
import Stripe from "stripe";
import AppError from "../utils/appError.js";
import { env } from "../config/environment.js";
import * as employees from "../repositories/employeeRepository.js";
import * as transactions from "../repositories/transactionRepository.js";
import { reconcilePayrollTransaction } from "./payrollReconciliationService.js";

const stripe = new Stripe(env.stripeSecretKey, {
  maxNetworkRetries: 2,
  httpAgent: new https.Agent({
    minVersion: "TLSv1.3",
    maxVersion: "TLSv1.3",
    keepAlive: true,
  }),
});
const privateKey =
  env.rsaPrivateKeyPath && fs.existsSync(env.rsaPrivateKeyPath)
    ? fs.readFileSync(env.rsaPrivateKeyPath, "utf8")
    : crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
      }).privateKey;
export const buildCanonicalPayload = (
  employeeId,
  amount,
  idempotencyKey,
  hrId,
) =>
  `employee=${employeeId}&amountNPR=${amount}&currency=NPR&idempotency=${idempotencyKey}&authorizedBy=${hrId}`;
const sign = (payload) => {
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(payload);
  return signer.sign(privateKey, "hex");
};
export const initiateSalaryDisbursement = async ({
  employeeId,
  amount,
  hrId,
  idempotencyKey = crypto.randomUUID(),
  payrollRunId = null,
  payslipId = null,
}) => {
  const employee = await employees.findById(employeeId);
  if (!employee?.isActive)
    throw new AppError("Target employee is not active.", 404);
  const transaction = await transactions.create({
    employeeId,
    payrollRunId,
    payslipId,
    authorizedBy: hrId,
    type: "SALARY_DISBURSEMENT",
    status: "PENDING",
    amountNPR: amount,
    idempotencyKey,
    digitalSignature: sign(
      buildCanonicalPayload(employeeId, amount, idempotencyKey, hrId),
    ),
    signaturePublicKeyId: env.rsaPublicKeyId,
  });
  try {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: Math.round(amount * 100),
        currency: "npr",
        metadata: {
          transactionId: transaction.id,
          payrollRunId: payrollRunId?.toString() || "sandbox",
        },
      },
      { idempotencyKey },
    );
    await transactions.setStripeIntent(transaction.id, paymentIntent.id);
    return {
      transactionId: transaction.id,
      paymentIntentId: paymentIntent.id,
      sandbox: true,
    };
  } catch (error) {
    await transactions.fail(
      transaction.id,
      "Stripe sandbox payment intent failed.",
    );
    throw new AppError("Stripe sandbox payment could not be created.", 502);
  }
};
export const verifyWebhookSignature = (payload, signature) =>
  stripe.webhooks.constructEvent(payload, signature, env.stripeWebhookSecret);
export const processSuccessfulPayment = async (paymentIntentId) => {
  const transaction = await transactions.findByStripeIntent(paymentIntentId);
  if (!transaction) return;
  const updated = await transactions.complete(transaction.id);
  if (updated) await reconcilePayrollTransaction(updated);
};
export const processFailedPayment = async (paymentIntentId, error) => {
  const transaction = await transactions.findByStripeIntent(paymentIntentId);
  if (!transaction) return;
  const updated = await transactions.fail(transaction.id, error);
  if (updated) await reconcilePayrollTransaction(updated);
};
