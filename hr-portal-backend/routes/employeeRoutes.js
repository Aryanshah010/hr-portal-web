import express from "express";
import { protect, restrictTo } from "../middleware/authGuard.js";
import { authLimiter, avatarLimiter } from "../middleware/rateLimiter.js";
import { csrfProtection } from "../middleware/csrf.js";
import { parseSecureUpload } from "../middleware/uploadValidator.js";
import { validateRequest, schemas } from "../middleware/validator.js";
import * as controller from "../controllers/employeeController.js";
const router = express.Router();

router.use(protect);

router.get("/me/profile", controller.myProfile);
router.get("/me/export", controller.exportMyData);

router.patch(
  "/me/profile",
  csrfProtection,
  validateRequest(schemas.profile),
  controller.updateMyProfile,
);

router.delete("/me", csrfProtection, controller.deactivateMe);

router.get("/me/avatar", controller.getMyAvatar);

router.post(
  "/me/avatar",
  avatarLimiter,
  csrfProtection,
  validateRequest(schemas.avatar),
  controller.setMyAvatar,
);

router.post(
  "/me/avatar/upload",
  avatarLimiter,
  csrfProtection,
  parseSecureUpload("avatar"),
  controller.uploadMyAvatar,
);

router.patch(
  "/me/password",
  authLimiter,
  csrfProtection,
  validateRequest(schemas.changePassword),
  controller.changeMyPassword,
);

router.get(
  "/employees",
  restrictTo("HR"),
  validateRequest(schemas.employeeList, "query"),
  controller.list,
);

router.get(
  "/employees/pending",
  restrictTo("HR"),
  validateRequest(schemas.employeeList, "query"),
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

router.post(
  "/employees/:id/reactivate",
  restrictTo("HR"),
  csrfProtection,
  controller.reactivate,
);

router.post(
  "/employees/:id/reset-password",
  restrictTo("HR"),
  csrfProtection,
  authLimiter,
  controller.resetPassword,
);

router.get(
  "/employees/:id/avatar",
  restrictTo("HR"),
  controller.getEmployeeAvatar,
);

router.get("/hr", restrictTo("HR"), controller.listHr);

router.delete(
  "/employees/:id",
  restrictTo("HR"),
  csrfProtection,
  controller.deleteEmployee,
);

export default router;
