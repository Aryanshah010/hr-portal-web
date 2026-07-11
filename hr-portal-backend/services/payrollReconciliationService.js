import Transaction from "../models/Transaction.js";
import PayrollRun from "../models/PayrollRun.js";
import * as payrollRepository from "../repositories/payrollRepository.js";

export const reconcilePayrollTransaction = async (transaction) => {
  if (!transaction.payrollRunId || !transaction.payslipId) return;
  const payoutStatus =
    transaction.status === "COMPLETED" ? "COMPLETED" : "FAILED";
  await payrollRepository.updatePayslipPayout(
    transaction.payslipId,
    payoutStatus,
  );
  const transactions = await Transaction.find({
    payrollRunId: transaction.payrollRunId,
  }).select("status");
  if (
    !transactions.length ||
    transactions.some(({ status }) => status === "PENDING")
  )
    return;
  const status = transactions.every(({ status }) => status === "COMPLETED")
    ? "COMPLETED"
    : "FAILED";
  await PayrollRun.findOneAndUpdate(
    { _id: transaction.payrollRunId, status: "PROCESSING" },
    {
      $set: {
        status,
        completedAt: new Date(),
        ...(status === "FAILED" && {
          failureReason: "One or more payroll payments failed.",
        }),
      },
    },
  );
};
