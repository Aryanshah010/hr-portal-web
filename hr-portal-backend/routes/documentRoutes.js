import express from "express";
import { protect, restrictTo } from "../middleware/authGuard.js";
import { csrfProtection } from "../middleware/csrf.js";
import { parseSecureUpload } from "../middleware/uploadValidator.js";
import { validateRequest, schemas } from "../middleware/validator.js";
import * as controller from "../controllers/documentController.js";
const router = express.Router();
router.use(protect);
router.get("/mine", controller.mine);
router.post(
  "/",
  csrfProtection,
  parseSecureUpload("document"),
  validateRequest(schemas.document),
  controller.upload,
);
router.get(
  "/pending",
  restrictTo("HR"),
  validateRequest(schemas.reviewPeriod, "query"),
  controller.pending,
);
router.patch(
  "/:id/decision",
  restrictTo("HR"),
  csrfProtection,
  validateRequest(schemas.documentDecision),
  controller.decide,
);
router.get("/:id/download", controller.download);
export default router;
