import crypto from "crypto";
import Employee from "../models/Employee.js";
import AppError from "../utils/appError.js";
import { env } from "../config/environment.js";
import { encryptPayroll, decryptPayroll } from "../utils/cryptoUtil.js";
import {
  buildPayslipPayload,
  calculateSalary,
} from "../utils/payslipGenerator.js";
import * as payrollRepository from "../repositories/payrollRepository.js";
import { initiateSalaryDisbursement } from "./transactionService.js";
import AuditLog, { AUDIT_EVENTS, AUDIT_SEVERITY } from "../models/AuditLog.js";

const isValidId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
const checksum = (rows) =>
  crypto.createHash("sha256").update(JSON.stringify(rows)).digest("hex");
const totalsFor = (rows) =>
  rows.reduce(
    (total, row) => ({
      grossNPR: total.grossNPR + row.breakdown.grossNPR,
      taxNPR: total.taxNPR + row.breakdown.taxNPR,
      deductionsNPR: total.deductionsNPR + row.breakdown.deductionsNPR,
      netNPR: total.netNPR + row.breakdown.netNPR,
    }),
    { grossNPR: 0, taxNPR: 0, deductionsNPR: 0, netNPR: 0 },
  );
const publicRun = (run) => {
  const value = run.toObject ? run.toObject() : { ...run };
  delete value.encryptedChecksum;
  return value;
};

const computeRows = async (period) => {
  const employees = await Employee.find({ isActive: true }).select(
    "+baseSalary name",
  );
  if (!employees.length)
    throw new AppError("No active employees are available for payroll.", 409);
  return employees.map((employee) => {
    const baseSalary = employee.baseSalaryPlain;
    if (!Number.isFinite(baseSalary))
      throw new AppError("An employee salary could not be decrypted.", 500);
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
  const rows = await computeRows(period);
  const totals = totalsFor(rows);
  if (dryRun)
    return {
      dryRun: true,
      period,
      employeeCount: rows.length,
      totals,
      payslips: rows.map(({ employee, breakdown }) => ({
        employeeId: employee.id,
        employeeName: employee.name,
        ...breakdown,
      })),
    };
  try {
    const run = await payrollRepository.createRun({
      period,
      createdBy,
      employeeCount: rows.length,
      totals,
      encryptedChecksum: encryptPayroll(
        checksum(
          rows.map(({ employee, breakdown }) => ({
            employeeId: employee.id,
            ...breakdown,
          })),
        ),
      ),
    });
    const payslips = await payrollRepository.createPayslips(
      rows.map(({ employee, breakdown, payload }) => ({
        payrollRunId: run._id,
        employeeId: employee._id,
        generatedBy: createdBy,
        ...breakdown,
        encryptedPayload: encryptPayroll(JSON.stringify(payload)),
      })),
    );
    await AuditLog.record({
      eventType: AUDIT_EVENTS.PAYROLL_RUN_CREATED,
      severity: AUDIT_SEVERITY.HIGH,
      req,
      actorId: createdBy,
      actorRole: req.user.role,
      metadata: {
        payrollRunId: run.id,
        period,
        employeeCount: payslips.length,
        netNPR: totals.netNPR,
      },
    });
    await Promise.all(
      payslips.map((payslip) =>
        AuditLog.record({
          eventType: AUDIT_EVENTS.PAYSLIP_GENERATED,
          severity: AUDIT_SEVERITY.MEDIUM,
          req,
          actorId: createdBy,
          actorRole: req.user.role,
          metadata: { payrollRunId: run.id, payslipId: payslip.id },
        }),
      ),
    );
    return {
      run: publicRun(run),
      payslips: payslips.map(
        ({
          _id,
          employeeId,
          grossNPR,
          taxNPR,
          deductionsNPR,
          netNPR,
          payoutStatus,
        }) => ({
          id: _id,
          employeeId,
          grossNPR,
          taxNPR,
          deductionsNPR,
          netNPR,
          payoutStatus,
        }),
      ),
    };
  } catch (error) {
    if (error.code === 11000)
      throw new AppError("A payroll run already exists for this period.", 409);
    throw error;
  }
};

export const submitRun = async (id) => {
  const run = await payrollRepository.transitionRun(id, "DRAFT", {
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
  const existing = await payrollRepository.getRun(id);
  if (!existing) throw new AppError("Payroll run not found.", 404);
  if (existing.createdBy.toString() === approverId)
    throw new AppError(
      "A payroll run creator cannot approve their own run.",
      403,
    );
  const run = await payrollRepository.transitionRun(id, "PENDING_APPROVAL", {
    status: "APPROVED",
    approvedBy: approverId,
    approvedAt: new Date(),
  });
  if (!run)
    throw new AppError(
      "Payroll run cannot be approved from its current state.",
      409,
    );
  await AuditLog.record({
    eventType: AUDIT_EVENTS.PAYROLL_RUN_APPROVED,
    severity: AUDIT_SEVERITY.HIGH,
    req,
    actorId: approverId,
    actorRole: req.user.role,
    metadata: { payrollRunId: run.id, netNPR: run.totals.netNPR },
  });
  return run;
};

export const executeRun = async ({ id, adminId, req }) => {
  const run = await payrollRepository.transitionRun(id, "APPROVED", {
    status: "PROCESSING",
    executionStartedAt: new Date(),
    failureReason: null,
  });
  if (!run)
    throw new AppError(
      "Payroll run cannot be executed from its current state.",
      409,
    );
  const payslips = await payrollRepository.findPayslipsForRun(run._id);
  try {
    for (
      let offset = 0;
      offset < payslips.length;
      offset += env.payrollBatchSize
    ) {
      for (const payslip of payslips.slice(
        offset,
        offset + env.payrollBatchSize,
      )) {
        const idempotencyKey = `payroll-${run._id}-${payslip._id}`;
        const result = await initiateSalaryDisbursement({
          employeeId: payslip.employeeId,
          amount: payslip.netNPR,
          adminId,
          idempotencyKey,
          payrollRunId: run._id,
          payslipId: payslip._id,
        });
        await payrollRepository.attachTransaction(
          payslip._id,
          result.transactionId,
        );
        await AuditLog.record({
          eventType: AUDIT_EVENTS.SALARY_DISBURSEMENT_INITIATED,
          severity: AUDIT_SEVERITY.HIGH,
          req,
          actorId: adminId,
          actorRole: req.user.role,
          metadata: {
            payrollRunId: run.id,
            payslipId: payslip.id,
            transactionId: result.transactionId,
            amountNPR: payslip.netNPR,
          },
        });
      }
    }
    return await payrollRepository.getRun(run._id);
  } catch (error) {
    await payrollRepository.transitionRun(run._id, "PROCESSING", {
      status: "FAILED",
      failureReason: "Payment intent creation failed.",
    });
    throw error;
  }
};

export const listRuns = (query) => payrollRepository.listRuns(query);
export const getRun = async (id) => {
  if (!isValidId(id)) throw new AppError("Invalid payroll run ID.", 400);
  const run = await payrollRepository.getRun(id);
  if (!run) throw new AppError("Payroll run not found.", 404);
  return run;
};

export const readPayslip = async ({ runId, employeeId, userId, role, req }) => {
  if (!isValidId(runId) || !isValidId(employeeId))
    throw new AppError("Invalid payroll or employee ID.", 400);
  if (role === "Employee") {
    const employee = await Employee.findOne({ _id: employeeId, userId }).select(
      "_id",
    );
    if (!employee)
      throw new AppError("You may only access your own payslip.", 403);
  }
  const payslip = await payrollRepository.findPayslip(runId, employeeId);
  if (!payslip) throw new AppError("Payslip not found.", 404);
  const payload = JSON.parse(decryptPayroll(payslip.encryptedPayload));
  await AuditLog.record({
    eventType: AUDIT_EVENTS.PII_ACCESS,
    severity: AUDIT_SEVERITY.HIGH,
    req,
    actorId: userId,
    actorRole: role,
    metadata: { payrollRunId: runId, payslipId: payslip.id, employeeId },
  });
  return {
    id: payslip.id,
    payoutStatus: payslip.payoutStatus,
    transactionId: payslip.transactionId,
    ...payload,
  };
};
