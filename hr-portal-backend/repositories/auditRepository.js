import AuditLog from "../models/AuditLog.js";
export const record = (entry) => AuditLog.record(entry);
