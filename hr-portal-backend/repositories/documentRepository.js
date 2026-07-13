import EmployeeDocument from "../models/EmployeeDocument.js";
export const upsert = ({ employeeId, type, ...data }) =>
  EmployeeDocument.findOneAndUpdate(
    { employeeId, type },
    { $set: data, $setOnInsert: { employeeId, type } },
    { upsert: true, new: true, runValidators: true },
  );
export const findById = (id, select = "") =>
  EmployeeDocument.findById(id).select(select);
export const findByEmployeeAndType = (employeeId, type) =>
  EmployeeDocument.findOne({ employeeId, type }).select("storageName");
export const listForEmployee = (employeeId) =>
  EmployeeDocument.find({ employeeId })
    .select(
      "type mimeType sha256 status reviewedBy reviewedAt createdAt updatedAt",
    )
    .sort({ createdAt: -1 })
    .lean();
export const listPending = ({ page, limit }) =>
  EmployeeDocument.find({ status: "PENDING" })
    .populate("employeeId", "name email department")
    .select("type mimeType status createdAt employeeId")
    .sort({ createdAt: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
export const review = (id, status, reviewedBy) =>
  EmployeeDocument.findOneAndUpdate(
    { _id: id, status: "PENDING" },
    { $set: { status, reviewedBy, reviewedAt: new Date() } },
    { new: true, runValidators: true },
  );
