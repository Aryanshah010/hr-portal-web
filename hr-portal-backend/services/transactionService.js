import crypto from "crypto";
import fs from "fs";
import https from "https";
import AppError from "../utils/appError.js";
import { env } from "../config/environment.js";
import * as employees from "../repositories/employeeRepository.js";
import * as transactions from "../repositories/transactionRepository.js";
import { reconcilePayrollTransaction } from "./payrollReconciliationService.js";

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
    // eSewa B2B Fund Transfer (Simulated for academic purposes)
    // In eSewa v2, signatures are generated using HMAC SHA256
    const message = `total_amount=${amount},transaction_uuid=${transaction.id},product_code=${env.esewaMerchantCode}`;
    const esewaSignature = crypto
      .createHmac("sha256", env.esewaSecretKey)
      .update(message)
      .digest("base64");

    // Since this is a payout (and we don't have a real B2B eSewa sandbox endpoint),
    // we immediately mark the transaction as completed to simulate a successful API call.
    await transactions.complete(transaction.id);
    const updated = await transactions.findById(transaction.id);
    if (updated) await reconcilePayrollTransaction(updated);

    return {
      transactionId: transaction.id,
      esewaSignature,
      status: "COMPLETED",
    };
  } catch (error) {
    await transactions.fail(transaction.id, "eSewa transaction failed.");
    throw new AppError("eSewa transaction could not be processed.", 502);
  }
};
