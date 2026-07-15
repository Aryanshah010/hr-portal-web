import AppError from "../utils/appError.js";
import { decrypt, encrypt } from "../utils/cryptoUtil.js";
import * as employees from "../repositories/employeeRepository.js";
import * as reviews from "../repositories/reviewRepository.js";
import * as audit from "../repositories/auditRepository.js";

export const save = async ({ input, hrId, req }) => {
  const employee = await employees.findById(input.employeeId);
  if (!employee) throw new AppError("Employee not found.", 404);
  const review = await reviews.upsert({
    employeeId: input.employeeId,
    period: input.period,
    rating: input.rating,
    encryptedComment: encrypt(input.comment),
    createdBy: hrId,
  });
  await audit.record({
    eventType: "EMPLOYEE_UPDATED",
    severity: "MEDIUM",
    req,
    actorId: hrId,
    actorRole: req.user.role,
    metadata: { reviewId: review.id, employeeId: input.employeeId },
  });
  return {
    id: review.id,
    employeeId: review.employeeId,
    period: review.period,
    rating: review.rating,
  };
};
export const mine = async (userId) => {
  const employee = await employees.findByUserId(userId);
  if (!employee) throw new AppError("Employee profile not found.", 404);
  const rows = await reviews.listForEmployee(employee.id);
  return rows.map((row) => ({
    id: row.id,
    period: row.period,
    rating: row.rating,
    comment: decrypt(row.encryptedComment),
    createdAt: row.createdAt,
  }));
};
