import AppError from "../utils/appError.js";
import { decrypt, encrypt } from "../utils/cryptoUtil.js";
import * as users from "../repositories/userRepository.js";
import * as employees from "../repositories/employeeRepository.js";
import * as auth from "../repositories/authRepository.js";
import * as salary from "../repositories/salaryRepository.js";
import * as audit from "../repositories/auditRepository.js";
import { ROLES, ACCOUNT_STATUS } from "../models/User.js";

const visibleProfile = (user, employee, includeSensitive = false) => ({
  id: employee.id,
  email: user.email,
  name: employee.name,
  department: employee.department,
  jobTitle: employee.jobTitle,
  employmentType: employee.employmentType,
  joinedAt: employee.joinedAt,
  isActive: employee.isActive,
  ...(includeSensitive && {
    nationalId: employee.nationalIdEncrypted
      ? decrypt(employee.nationalIdEncrypted)
      : null,
    bankAccount: employee.bankAccountEncrypted
      ? decrypt(employee.bankAccountEncrypted)
      : null,
  }),
});

export const myProfile = async (userId) => {
  const [user, employee] = await Promise.all([
    users.findById(userId),
    employees.findByUserId(
      userId,
      "+nationalIdEncrypted +bankAccountEncrypted",
    ),
  ]);
  if (!user || !employee)
    throw new AppError("Employee profile not found.", 404);
  return visibleProfile(user, employee, true);
};

export const updateMyProfile = async ({ userId, input, req }) => {
  const employee = await employees.updateByUserId(userId, {
    name: input.name,
    department: input.department,
    jobTitle: input.jobTitle,
    ...(input.nationalId && { nationalIdEncrypted: encrypt(input.nationalId) }),
    ...(input.bankAccount && {
      bankAccountEncrypted: encrypt(input.bankAccount),
    }),
  });
  if (!employee) throw new AppError("Employee profile not found.", 404);
  await users.updateById(userId, {
    name: input.name,
    department: input.department,
    jobTitle: input.jobTitle,
  });
  await audit.record({
    eventType: "EMPLOYEE_UPDATED",
    severity: "MEDIUM",
    req,
    actorId: userId,
    actorRole: ROLES.EMPLOYEE,
    metadata: { selfService: true },
  });
  return myProfile(userId);
};

export const listEmployees = async (query) => {
  const result = await employees.list(query);
  return {
    ...result,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / query.limit),
    },
  };
};

export const updateSalary = async ({ employeeId, baseSalary, hrId, req }) => {
  const employee = await employees.findById(employeeId, "+baseSalaryEncrypted");
  if (!employee) throw new AppError("Employee not found.", 404);
  const oldBaseSalary = employee.baseSalaryEncrypted || encrypt("0");
  const updated = await employees.updateById(employeeId, {
    baseSalaryEncrypted: encrypt(String(baseSalary)),
  });
  await salary.createHistory({
    employeeId,
    oldBaseSalary,
    newBaseSalary: updated.baseSalaryEncrypted,
    effectiveDate: new Date(),
    changedBy: hrId,
  });
  await audit.record({
    eventType: "SALARY_UPDATED",
    severity: "HIGH",
    req,
    actorId: hrId,
    actorRole: ROLES.HR,
    metadata: { employeeId },
  });
};

export const deactivateSelf = async ({ userId, req }) => {
  await Promise.all([
    employees.deactivateByUserId(userId),
    users.suspend(userId),
    auth.revokeUserSessions(userId),
  ]);
  await audit.record({
    eventType: "EMPLOYEE_DELETED",
    severity: "HIGH",
    req,
    actorId: userId,
    actorRole: ROLES.EMPLOYEE,
    metadata: { softDelete: true },
  });
};

export const pendingEmployees = async (query) => {
  const [records, total] = await Promise.all([
    users.listPending(query),
    users.countPending(),
  ]);
  return {
    records,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

export const changeRole = async ({ targetUserId, role, hrId, req }) => {
  const target = await users.findById(targetUserId);
  if (!target || target.accountStatus !== ACCOUNT_STATUS.ACTIVE)
    throw new AppError("Active employee not found.", 404);
  if (target.id === hrId && role !== ROLES.HR)
    throw new AppError("You cannot remove your own HR access.", 400);
  if (
    target.role === ROLES.HR &&
    role !== ROLES.HR &&
    (await users.countActiveHr()) <= 1
  )
    throw new AppError("The final active HR account cannot be demoted.", 409);
  await users.changeRole(targetUserId, role);
  await auth.revokeUserSessions(targetUserId);
  await audit.record({
    eventType: "EMPLOYEE_UPDATED",
    severity: "CRITICAL",
    req,
    actorId: hrId,
    actorRole: ROLES.HR,
    metadata: { targetUserId, role },
  });
};
export const listHr = () => users.listHr();
