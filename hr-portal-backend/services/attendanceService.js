import * as attendanceRepository from "../repositories/attendanceRepository.js";
import * as employees from "../repositories/employeeRepository.js";
import * as audit from "../repositories/auditRepository.js";
import { encrypt } from "../utils/cryptoUtil.js";
import AppError from "../utils/appError.js";

const toUtcDate = (value) => new Date(`${value}T00:00:00.000Z`);
const pageResult = ({ records, total }, page, limit) => ({
  records,
  pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
});
export const submit = async ({ userId, payload, req }) => {
  const employee = await employees.findByUserId(userId);
  if (!employee?.isActive)
    throw new AppError("An active employee profile is required.", 403);
  try {
    const record = await attendanceRepository.create({
      employeeId: employee.id,
      requestedBy: userId,
      recordType: payload.recordType,
      attendanceDate: toUtcDate(payload.attendanceDate),
      checkInAt: payload.checkInAt ? new Date(payload.checkInAt) : null,
      checkOutAt: payload.checkOutAt ? new Date(payload.checkOutAt) : null,
      leaveType: payload.recordType === "LEAVE" ? payload.leaveType : null,
      encryptedReason: payload.reason ? encrypt(payload.reason) : null,
    });
    await audit.record({
      eventType: "ATTENDANCE_SUBMITTED",
      severity: "MEDIUM",
      req,
      actorId: userId,
      actorRole: req.user.role,
      metadata: { attendanceId: record.id, recordType: record.recordType },
    });
    return record;
  } catch (error) {
    if (error.code === 11000)
      throw new AppError(
        "An attendance request already exists for this date.",
        409,
      );
    throw error;
  }
};
export const listMine = async ({ userId, query }) => {
  const employee = await employees.findByUserId(userId);
  if (!employee) throw new AppError("Employee profile not found.", 404);
  return pageResult(
    await attendanceRepository.findForEmployee(employee.id, query),
    query.page,
    query.limit,
  );
};
export const listForApproval = async ({ query }) =>
  pageResult(
    await attendanceRepository.findPending(query),
    query.page,
    query.limit,
  );
export const decide = async ({ id, decision, approverId, comment, req }) => {
  const record = await attendanceRepository.findByIdForDecision(id);
  if (!record) throw new AppError("Attendance request not found.", 404);
  if (record.requestedBy.toString() === approverId)
    throw new AppError("You cannot approve your own request.", 403);
  const updated = await attendanceRepository.decidePending(id, {
    decision,
    approverId,
    encryptedDecisionComment: comment ? encrypt(comment) : null,
  });
  if (!updated)
    throw new AppError("Attendance request has already been decided.", 409);
  await audit.record({
    eventType:
      decision === "APPROVED" ? "ATTENDANCE_APPROVED" : "ATTENDANCE_REJECTED",
    severity: "HIGH",
    req,
    actorId: approverId,
    actorRole: req.user.role,
    metadata: { attendanceId: updated.id, recordType: updated.recordType },
  });
  return updated;
};
