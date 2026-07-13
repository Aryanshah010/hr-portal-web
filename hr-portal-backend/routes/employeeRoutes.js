import express from "express";
import { protect, restrictTo } from "../middleware/authGuard.js";
import { csrfProtection } from "../middleware/csrf.js";
import { validateRequest, schemas } from "../middleware/validator.js";
import * as controller from "../controllers/employeeController.js";
const router = express.Router();
router.use(protect);
router.get("/me/profile", controller.myProfile);
router.patch(
  "/me/profile",
  csrfProtection,
  validateRequest(schemas.profile),
  controller.updateMyProfile,
);
router.delete("/me", csrfProtection, controller.deactivateMe);
router.get(
  "/employees",
  restrictTo("HR"),
  validateRequest(schemas.employeeList, "query"),
  controller.list,
);
router.get(
  "/employees/pending",
  restrictTo("HR"),
  validateRequest(schemas.reviewPeriod, "query"),
  controller.pending,
);
router.post(
  "/employees/:id/approve",
  restrictTo("HR"),
  csrfProtection,
  controller.approve,
);
router.patch(
  "/employees/:id/salary",
  restrictTo("HR"),
  csrfProtection,
  validateRequest(schemas.salary),
  controller.salary,
);
router.patch(
  "/employees/:id/role",
  restrictTo("HR"),
  csrfProtection,
  validateRequest(schemas.role),
  controller.changeRole,
);
router.get("/hr", restrictTo("HR"), controller.listHr);
export default router;
