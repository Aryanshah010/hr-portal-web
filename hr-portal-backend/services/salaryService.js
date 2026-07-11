import Employee from "../models/Employee.js";
import SalaryHistory from "../models/SalaryHistory.js";
import AppError from "../utils/appError.js";
import AuditLog, { AUDIT_EVENTS, AUDIT_SEVERITY } from "../models/AuditLog.js";

export const updateSalary = async ({
  employeeId,
  baseSalary,
  changedBy,
  req,
}) => {
  const employee = await Employee.findById(employeeId).select("+baseSalary");
  if (!employee) throw new AppError("Employee not found.", 404);
  const oldBaseSalary = employee.baseSalary;
  employee.baseSalaryPlain = baseSalary;
  const newBaseSalary = employee.baseSalary;
  await employee.save();
  await SalaryHistory.create({
    employeeId,
    oldBaseSalary,
    newBaseSalary,
    effectiveDate: new Date(),
    changedBy,
  });
  await AuditLog.record({
    eventType: AUDIT_EVENTS.SALARY_UPDATED,
    severity: AUDIT_SEVERITY.HIGH,
    req,
    actorId: changedBy,
    actorRole: req.user.role,
    metadata: { employeeId },
  });
  return { employeeId: employee.id, effectiveDate: new Date() };
};
