import * as attendanceRepository from "../repositories/attendanceRepository.js";
import Employee from "../models/Employee.js";
import AuditLog, { AUDIT_EVENTS, AUDIT_SEVERITY } from "../models/AuditLog.js";
import { encrypt, decrypt } from "../utils/cryptoUtil.js";
import AppError from "../utils/appError.js";

const toUtcDate = (value) => new Date(`${value}T00:00:00.000Z`);
const pageResult = ({ records, total }, page, limit) => ({
  records,
  pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
});

export const submit = async ({ userId, payload, req }) => {
  const employee = await Employee.findOne({ userId, isActive: true }).select(
    "_id",
  );
  if (!employee)
    throw new AppError(
      "An active employee profile is required to submit attendance.",
      403,
    );

  try {
    const record = await attendanceRepository.create({
      employeeId: employee._id,
      requestedBy: userId,
      recordType: payload.recordType,
      attendanceDate: toUtcDate(payload.attendanceDate),
      checkInAt: payload.checkInAt ? new Date(payload.checkInAt) : null,
      checkOutAt: payload.checkOutAt ? new Date(payload.checkOutAt) : null,
      leaveType: payload.recordType === "LEAVE" ? payload.leaveType : null,
      encryptedReason: payload.reason ? encrypt(payload.reason) : null,
    });
    await AuditLog.record({
      eventType: AUDIT_EVENTS.ATTENDANCE_SUBMITTED,
      severity: AUDIT_SEVERITY.MEDIUM,
      req,
      actorId: userId,
      actorRole: req.user.role,
      metadata: { attendanceId: record.id, recordType: record.recordType },
    });
    return record;
  } catch (error) {
    if (error.code === 11000)
      throw new AppError(
        "An attendance or leave request already exists for this date.",
        409,
      );
    throw error;
  }
};

export const listMine = async ({ userId, query }) => {
  const employee = await Employee.findOne({ userId }).select("_id");
  if (!employee) throw new AppError("Employee profile not found.", 404);
  return pageResult(
    await attendanceRepository.findForEmployee(employee._id, query),
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
  if (record.status !== "PENDING")
    throw new AppError("Attendance request has already been decided.", 409);
  if (record.requestedBy.toString() === approverId)
    throw new AppError("You cannot approve your own attendance request.", 403);

  record.status = decision;
  record.decidedBy = approverId;
  record.decidedAt = new Date();
  record.encryptedDecisionComment = comment ? encrypt(comment) : null;
  await record.save();

  await AuditLog.record({
    eventType:
      decision === "APPROVED"
        ? AUDIT_EVENTS.ATTENDANCE_APPROVED
        : AUDIT_EVENTS.ATTENDANCE_REJECTED,
    severity: AUDIT_SEVERITY.HIGH,
    req,
    actorId: approverId,
    actorRole: req.user.role,
    metadata: { attendanceId: record.id, recordType: record.recordType },
  });
  return record;
};

export const readConfidentialDetails = (record) => ({
  reason: record.encryptedReason ? decrypt(record.encryptedReason) : null,
  decisionComment: record.encryptedDecisionComment
    ? decrypt(record.encryptedDecisionComment)
    : null,
});
