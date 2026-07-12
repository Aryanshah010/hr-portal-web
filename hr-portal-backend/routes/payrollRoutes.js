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
} from "../controllers/payrollController.js";
import { csrfProtection } from "../middleware/csrf.js";

const router = express.Router();
router.use(protect);
router.post(
  "/runs",
  restrictTo("HR"),
  csrfProtection,
  validateRequest(schemas.payrollRunCreate),
  createRun,
);
router.get(
  "/runs",
  restrictTo("HR"),
  validateRequest(schemas.payrollListQuery, "query"),
  listRuns,
);
router.get("/runs/:id", restrictTo("HR"), getRun);
router.post(
  "/runs/:id/submit",
  restrictTo("HR"),
  csrfProtection,
  validateRequest(schemas.emptyBody),
  submitRun,
);
router.post(
  "/runs/:id/approve",
  restrictTo("HR"),
  csrfProtection,
  validateRequest(schemas.emptyBody),
  approveRun,
);
router.post(
  "/runs/:id/execute",
  restrictTo("HR"),
  csrfProtection,
  payrollExecutionLimiter,
  validateRequest(schemas.emptyBody),
  executeRun,
);
router.get(
  "/runs/:runId/payslips/:employeeId",
  restrictTo("Employee", "HR"),
  payslipReadLimiter,
  getPayslip,
);
export default router;
