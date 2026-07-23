import crypto from "crypto";
import fs from "fs";
import AppError from "../utils/appError.js";
import { env } from "../config/environment.js";
import * as employees from "../repositories/employeeRepository.js";
import * as transactions from "../repositories/transactionRepository.js";
import * as audit from "../repositories/auditRepository.js";
import { reconcilePayrollTransaction } from "./payrollReconciliationService.js";

const loadKey = (path, label) => {
  if (!path || !fs.existsSync(path))
    throw new Error(
      `[Transaction Ledger] ${label} not found at "${path ?? "<unset>"}". ` +
        `Set RSA_PRIVATE_KEY_PATH / RSA_PUBLIC_KEY_PATH — refusing to start ` +
        `with an ephemeral key, which would make stored signatures unverifiable.`,
    );
  return fs.readFileSync(path, "utf8");
};

const privateKey = loadKey(env.rsaPrivateKeyPath, "RSA private key");
const publicKey = loadKey(env.rsaPublicKeyPath, "RSA public key");
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


export const verifyTransactionSignature = async (transactionId) => {
  const transaction = await transactions.findById(transactionId);
  if (!transaction) throw new AppError("Transaction not found.", 404);
  if (!transaction.digitalSignature)
    return { valid: false, reason: "NO_SIGNATURE_RECORDED" };

  const canonicalPayload = buildCanonicalPayload(
    transaction.employeeId,
    transaction.amountNPR,
    transaction.idempotencyKey,
    transaction.authorizedBy,
  );

  let valid = false;
  try {
    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(canonicalPayload);
    valid = verifier.verify(publicKey, transaction.digitalSignature, "hex");
  } catch {
    valid = false;
  }

  return {
    valid,
    reason: valid ? null : "SIGNATURE_MISMATCH",
    keyId: transaction.signaturePublicKeyId,
    canonicalPayload,
    amountNPR: transaction.amountNPR,
    verifiedAt: new Date().toISOString(),
  };
};

export const initiateSalaryDisbursement = async ({
  employeeId,
  amount,
  hrId,
  idempotencyKey = crypto.randomUUID(),
  payrollRunId = null,
  payslipId = null,
  req = null,
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
  await audit.record({
    eventType: "SALARY_DISBURSEMENT_INITIATED",
    severity: "CRITICAL",
    req,
    actorId: hrId,
    actorRole: "HR",
    metadata: {
      transactionId: transaction.id,
      employeeId: String(employeeId),
      amountNPR: amount,
      payrollRunId: payrollRunId ? String(payrollRunId) : null,
      idempotencyKey,
    },
  });
  
  const esewaMessage = `total_amount=${amount},transaction_uuid=${transaction.id},product_code=${env.esewaMerchantCode}`;
  const esewaSignature = crypto
    .createHmac("sha256", env.esewaSecretKey)
    .update(esewaMessage)
    .digest("base64");

  try {
    await transactions.complete(transaction.id);
    const updated = await transactions.findById(transaction.id);
    if (updated) await reconcilePayrollTransaction(updated);

    return {
      transactionId: transaction.id,
      esewaSignature,
      simulated: true,
      status: "COMPLETED",
    };
  } catch (error) {
    await transactions.fail(transaction.id, "Payout settlement failed.");
    throw new AppError("The payout could not be processed.", 502);
  }
};
