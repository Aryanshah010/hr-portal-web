import express from "express";
import { protect, restrictTo } from "../middleware/authGuard.js";
import { validateRequest, schemas } from "../middleware/validator.js";
import * as controller from "../controllers/auditController.js";

const router = express.Router();

router.use(protect);
router.get(
  "/",
  restrictTo("HR"),
  validateRequest(schemas.auditListQuery, "query"),
  controller.list,
);

export default router;
