import Attendance from "../models/Attendance.js";

const approvalProjection =
  "employeeId requestedBy recordType attendanceDate checkInAt checkOutAt leaveType status decidedBy decidedAt createdAt updatedAt";

export const create = (data) => Attendance.create(data);

export const findByIdForDecision = (id) =>
  Attendance.findById(id).select("+encryptedReason +encryptedDecisionComment");

export const findForEmployee = async (
  employeeId,
  { page, limit, status, recordType },
) => {
  const filter = {
    employeeId,
    ...(status && { status }),
    ...(recordType && { recordType }),
  };
  const [records, total] = await Promise.all([
    Attendance.find(filter)
      .select(approvalProjection)
      .sort({ attendanceDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Attendance.countDocuments(filter),
  ]);
  return { records, total };
};

export const findPending = async ({ page, limit, status, recordType }) => {
  const filter = {
    status: status || "PENDING",
    ...(recordType && { recordType }),
  };
  const [records, total] = await Promise.all([
    Attendance.find(filter)
      .select(approvalProjection)
      .populate("employeeId", "name email department")
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Attendance.countDocuments(filter),
  ]);
  return { records, total };
};
