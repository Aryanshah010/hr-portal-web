import express from "express";
import { protect, restrictTo } from "../middleware/authGuard.js";
import { validateRequest, schemas } from "../middleware/validator.js";
import { attendanceMutationLimiter } from "../middleware/rateLimiter.js";
import {
  submitAttendance,
  getMyAttendance,
  getApprovalQueue,
  decideAttendance,
} from "../controllers/attendanceController.js";

const router = express.Router();
router.use(protect);

router.post(
  "/",
  attendanceMutationLimiter,
  restrictTo("Employee", "Manager", "Admin"),
  validateRequest(schemas.submitAttendance),
  submitAttendance,
);
router.get(
  "/mine",
  restrictTo("Employee", "Manager", "Admin"),
  validateRequest(schemas.attendanceListQuery, "query"),
  getMyAttendance,
);
router.get(
  "/approvals",
  restrictTo("Manager", "Admin"),
  validateRequest(schemas.attendanceListQuery, "query"),
  getApprovalQueue,
);
router.patch(
  "/:id/decision",
  attendanceMutationLimiter,
  restrictTo("Manager", "Admin"),
  validateRequest(schemas.decideAttendance),
  decideAttendance,
);

export default router;
