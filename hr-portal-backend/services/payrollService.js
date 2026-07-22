import crypto from "crypto";
import AppError from "../utils/appError.js";
import {
  decrypt,
  encryptPayroll,
  decryptPayroll,
} from "../utils/cryptoUtil.js";
import { env } from "../config/environment.js";
import {
  calculateSalary,
  buildPayslipPayload,
} from "../utils/payslipGenerator.js";
import * as employees from "../repositories/employeeRepository.js";
import * as payroll from "../repositories/payrollRepository.js";
import * as audit from "../repositories/auditRepository.js";
import { initiateSalaryDisbursement } from "./transactionService.js";

const validId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

const checksum = (rows) =>
  crypto.createHash("sha256").update(JSON.stringify(rows)).digest("hex");

const totals = (rows) =>
  rows.reduce(
    (total, row) => ({
      grossNPR: total.grossNPR + row.breakdown.grossNPR,
      taxNPR: total.taxNPR + row.breakdown.taxNPR,
      deductionsNPR: total.deductionsNPR + row.breakdown.deductionsNPR,
      netNPR: total.netNPR + row.breakdown.netNPR,
    }),
    { grossNPR: 0, taxNPR: 0, deductionsNPR: 0, netNPR: 0 },
  );

const compute = async (period) => {
  const active = await employees.activeForPayroll();
  if (!active.length)
    throw new AppError("No active employees with a salary are available.", 409);
  return active.map((employee) => {
    const baseSalary = Number(decrypt(employee.baseSalaryEncrypted));
    if (!Number.isFinite(baseSalary))
      throw new AppError("Employee salary cannot be decrypted.", 500);
    const breakdown = calculateSalary({
      baseSalary,
      taxRate: env.payrollTaxRate,
      deductionRate: env.payrollDeductionRate,
    });
    return {
      employee,
      breakdown,
      payload: buildPayslipPayload({ period, employee, breakdown }),
    };
  });
};

export const createRun = async ({ period, createdBy, dryRun, req }) => {
  const rows = await compute(period);
  const summary = totals(rows);
  if (dryRun)
    return {
      dryRun: true,
      period,
      employeeCount: rows.length,
      totals: summary,
      payslips: rows.map(({ employee, breakdown }) => ({
        employeeId: employee.id,
        employeeName: employee.name,
        ...breakdown,
      })),
    };
  try {
    const run = await payroll.createRun({
      period,
      createdBy,
      employeeCount: rows.length,
      totals: summary,
      encryptedChecksum: encryptPayroll(
        checksum(
          rows.map(({ employee, breakdown }) => ({
            employeeId: employee.id,
            ...breakdown,
          })),
        ),
      ),
    });
    const payslips = await payroll.createPayslips(
      rows.map(({ employee, breakdown, payload }) => ({
        payrollRunId: run.id,
        employeeId: employee.id,
        generatedBy: createdBy,
        ...breakdown,
        encryptedPayload: encryptPayroll(JSON.stringify(payload)),
      })),
    );
    await audit.record({
      eventType: "PAYROLL_RUN_CREATED",
      severity: "HIGH",
      req,
      actorId: createdBy,
      actorRole: req.user.role,
      metadata: {
        payrollRunId: run.id,
        period,
        employeeCount: payslips.length,
      },
    });
    return {
      run: run.toObject(),
      payslips: payslips.map((p) => ({
        id: p.id,
        employeeId: p.employeeId,
        grossNPR: p.grossNPR,
        taxNPR: p.taxNPR,
        deductionsNPR: p.deductionsNPR,
        netNPR: p.netNPR,
        payoutStatus: p.payoutStatus,
      })),
    };
  } catch (error) {
    if (error.code === 11000)
      throw new AppError("A payroll run already exists for this period.", 409);
    throw error;
  }
};

export const submitRun = async (id) => {
  const run = await payroll.transitionRun(id, "DRAFT", {
    status: "PENDING_APPROVAL",
  });
  if (!run)
    throw new AppError(
      "Payroll run cannot be submitted from its current state.",
      409,
    );
  return run;
};

export const approveRun = async ({ id, approverId, req }) => {
  const existing = await payroll.getRun(id);
  if (!existing) throw new AppError("Payroll run not found.", 404);
  if (existing.createdBy.toString() === approverId)
    throw new AppError("A creator cannot approve their own payroll run.", 403);
  const run = await payroll.transitionRun(id, "PENDING_APPROVAL", {
    status: "APPROVED",
    approvedBy: approverId,
    approvedAt: new Date(),
  });
  if (!run)
    throw new AppError(
      "Payroll run cannot be approved from its current state.",
      409,
    );
  await audit.record({
    eventType: "PAYROLL_RUN_APPROVED",
    severity: "HIGH",
    req,
    actorId: approverId,
    actorRole: req.user.role,
    metadata: { payrollRunId: run.id },
  });
  return run;
};

export const executeRun = async ({ id, hrId, req }) => {
  const run = await payroll.transitionRun(id, "APPROVED", {
    status: "PROCESSING",
    executionStartedAt: new Date(),
    failureReason: null,
  });
  if (!run)
    throw new AppError(
      "Payroll run cannot be executed from its current state.",
      409,
    );
  const payslips = await payroll.findPayslipsForRun(run.id);
  try {
    for (const payslip of payslips) {
      const result = await initiateSalaryDisbursement({
        employeeId: payslip.employeeId,
        amount: payslip.netNPR,
        hrId,
        idempotencyKey: `payroll-${run.id}-${payslip.id}`,
        payrollRunId: run.id,
        payslipId: payslip.id,
      });
      await payroll.attachTransaction(payslip.id, result.transactionId);
    }
    return payroll.getRun(run.id);
  } catch (error) {
    await payroll.finishProcessingRun(
      run.id,
      "FAILED",
      "eSewa payment processing failed.",
    );
    throw error;
  }
};

export const listRuns = (query) => payroll.listRuns(query);

export const getRun = async (id) => {
  if (!validId(id)) throw new AppError("Invalid payroll run ID.", 400);
  const run = await payroll.getRun(id);
  if (!run) throw new AppError("Payroll run not found.", 404);
  return run;
};
export const readPayslip = async ({ runId, employeeId, userId, role, req }) => {
  if (!validId(runId) || !validId(employeeId))
    throw new AppError("Invalid payroll or employee ID.", 400);
  if (role === "Employee") {
    const employee = await employees.findByUserId(userId);
    if (!employee || employee.id !== employeeId)
      throw new AppError("You may only access your own payslip.", 403);
  }
  const payslip = await payroll.findPayslip(runId, employeeId);
  if (!payslip) throw new AppError("Payslip not found.", 404);
  await audit.record({
    eventType: "PII_ACCESS",
    severity: "HIGH",
    req,
    actorId: userId,
    actorRole: role,
    metadata: { payrollRunId: runId, payslipId: payslip.id },
  });
  return {
    id: payslip.id,
    payoutStatus: payslip.payoutStatus,
    transactionId: payslip.transactionId,
    ...JSON.parse(decryptPayroll(payslip.encryptedPayload)),
  };
};
