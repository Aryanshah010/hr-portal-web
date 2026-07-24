import AuditLog from "../models/AuditLog.js";
export const record = (entry) => AuditLog.record(entry);

export const list = async ({ page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    AuditLog.find().sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(),
  ]);
  return { items, total, page, pages: Math.ceil(total / limit) };
};
