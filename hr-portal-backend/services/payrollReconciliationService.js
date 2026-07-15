import * as transactions from "../repositories/transactionRepository.js";
import * as payroll from "../repositories/payrollRepository.js";
export const reconcilePayrollTransaction = async (transaction) => {
  if (!transaction?.payrollRunId || !transaction.payslipId) return;
  await payroll.updatePayslipPayout(
    transaction.payslipId,
    transaction.status === "COMPLETED" ? "COMPLETED" : "FAILED",
  );
  const rows = await transactions.forPayrollRun(transaction.payrollRunId);
  if (!rows.length || rows.some((row) => row.status === "PENDING")) return;
  await payroll.finishProcessingRun(
    transaction.payrollRunId,
    rows.every((row) => row.status === "COMPLETED") ? "COMPLETED" : "FAILED",
    rows.every((row) => row.status === "COMPLETED")
      ? null
      : "One or more eSewa payments failed.",
  );
};
