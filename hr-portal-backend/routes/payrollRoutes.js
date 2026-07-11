import express from "express";
import { protect, restrictTo } from "../middleware/authGuard.js";
import { validateRequest, schemas } from "../middleware/validator.js";
import {
  payrollExecutionLimiter,
  payslipReadLimiter,
} from "../middleware/rateLimiter.js";
import {
  approveRun,
  createRun,
  executeRun,
  getPayslip,
  getRun,
  listRuns,
  submitRun,
  updateSalary,
} from "../controllers/payrollController.js";

const router = express.Router();
router.use(protect);
router.post(
  "/runs",
  restrictTo("Manager", "Admin"),
  validateRequest(schemas.payrollRunCreate),
  createRun,
);
router.get(
  "/runs",
  restrictTo("Manager", "Admin"),
  validateRequest(schemas.payrollListQuery, "query"),
  listRuns,
);
router.get("/runs/:id", restrictTo("Manager", "Admin"), getRun);
router.post(
  "/runs/:id/submit",
  restrictTo("Manager", "Admin"),
  validateRequest(schemas.emptyBody),
  submitRun,
);
router.post(
  "/runs/:id/approve",
  restrictTo("Admin"),
  validateRequest(schemas.emptyBody),
  approveRun,
);
router.post(
  "/runs/:id/execute",
  restrictTo("Admin"),
  payrollExecutionLimiter,
  validateRequest(schemas.emptyBody),
  executeRun,
);
router.get(
  "/runs/:runId/payslips/:employeeId",
  restrictTo("Employee", "Manager", "Admin"),
  payslipReadLimiter,
  getPayslip,
);
router.patch(
  "/employees/:employeeId/salary",
  restrictTo("Admin"),
  validateRequest(schemas.updateSalary),
  updateSalary,
);
export default router;
