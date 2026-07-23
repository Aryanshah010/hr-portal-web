import * as transactions from "../repositories/transactionRepository.js";
import * as payroll from "../repositories/payrollRepository.js";

export const reconcilePayrollTransaction = async (transaction) => {
  if (!transaction?.payrollRunId || !transaction.payslipId) return;
  await payroll.updatePayslipPayout(
    transaction.payslipId,
    transaction.status === "COMPLETED" ? "COMPLETED" : "FAILED",
  );
  const run = await payroll.getRun(transaction.payrollRunId);
  if (!run) return;
  const rows = await transactions.forPayrollRun(transaction.payrollRunId);
  // Reconciliation fires once per disbursement, so the run is only settled after
  // every employee has a transaction. Without the employeeCount check the first
  // successful payout would close the run while the rest were still unpaid.
  if (rows.length < run.employeeCount) return;
  if (rows.some((row) => row.status === "PENDING")) return;
  await payroll.finishProcessingRun(
    transaction.payrollRunId,
    rows.every((row) => row.status === "COMPLETED") ? "COMPLETED" : "FAILED",
    rows.every((row) => row.status === "COMPLETED")
      ? null
      : "One or more eSewa payments failed.",
  );
};
