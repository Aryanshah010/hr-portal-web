import PayrollRun from "../models/PayrollRun.js";
import Payslip from "../models/Payslip.js";

export const createRun = (data) => PayrollRun.create(data);
export const getRun = (id) => PayrollRun.findById(id);
export const getRunWithChecksum = (id) =>
  PayrollRun.findById(id).select("+encryptedChecksum");
export const transitionRun = (id, from, update) =>
  PayrollRun.findOneAndUpdate(
    { _id: id, status: from },
    { $set: { ...update, status: update.status } },
    { new: true, runValidators: true },
  );

export const listRuns = async ({ page, limit, status }) => {
  const filter = status ? { status } : {};
  const [runs, total] = await Promise.all([
    PayrollRun.find(filter)
      .select("-encryptedChecksum")
      .sort({ period: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    PayrollRun.countDocuments(filter),
  ]);
  return {
    runs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const createPayslips = (docs) =>
  Payslip.insertMany(docs, { ordered: true });
export const findPayslip = (runId, employeeId) =>
  Payslip.findOne({ payrollRunId: runId, employeeId }).select(
    "+encryptedPayload",
  );
export const findPayslipsForRun = (runId) =>
  Payslip.find({ payrollRunId: runId }).select("+encryptedPayload");
export const attachTransaction = (payslipId, transactionId) =>
  Payslip.findByIdAndUpdate(
    payslipId,
    { $set: { transactionId } },
    { new: true },
  );
export const updatePayslipPayout = (payslipId, payoutStatus) =>
  Payslip.findByIdAndUpdate(
    payslipId,
    { $set: { payoutStatus } },
    { new: true },
  );
export const finishProcessingRun = (id, status, failureReason = null) =>
  PayrollRun.findOneAndUpdate(
    { _id: id, status: "PROCESSING" },
    { $set: { status, completedAt: new Date(), failureReason } },
    { new: true },
  );
