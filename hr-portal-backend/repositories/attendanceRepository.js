import Attendance from "../models/Attendance.js";

const approvalProjection =
  "employeeId requestedBy recordType attendanceDate checkInAt checkOutAt leaveType status decidedBy decidedAt createdAt updatedAt";

export const create = (data) => Attendance.create(data);

export const findByIdForDecision = (id) =>
  Attendance.findById(id).select("requestedBy status recordType").lean();
export const decidePending = (
  id,
  { decision, approverId, encryptedDecisionComment },
) =>
  Attendance.findOneAndUpdate(
    { _id: id, status: "PENDING" },
    {
      $set: {
        status: decision,
        decidedBy: approverId,
        decidedAt: new Date(),
        encryptedDecisionComment,
      },
    },
    { new: true, runValidators: true },
  );

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
  return { items: records, total, page, pages: Math.ceil(total / limit) };
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
  return { items: records, total, page, pages: Math.ceil(total / limit) };
};
