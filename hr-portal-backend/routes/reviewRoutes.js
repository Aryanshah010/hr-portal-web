import express from "express";
import { protect, restrictTo } from "../middleware/authGuard.js";
import { csrfProtection } from "../middleware/csrf.js";
import { validateRequest, schemas } from "../middleware/validator.js";
import * as controller from "../controllers/reviewController.js";
const router = express.Router();
router.use(protect);
router.get("/mine", controller.mine);
router.post(
  "/",
  restrictTo("HR"),
  csrfProtection,
  validateRequest(schemas.review),
  controller.save,
);
export default router;
