import express from "express";
import { protect, restrictTo } from "../middleware/authGuard.js";
import { schemas, validateRequest } from "../middleware/validator.js";
import { csrfProtection } from "../middleware/csrf.js";
import {
  createPaymentIntent,
  list,
  verifySignature,
} from "../controllers/transactionController.js";

const router = express.Router();

router.get(
  "/",
  protect,
  restrictTo("HR"),
  validateRequest(schemas.transactionListQuery, "query"),
  list,
);

router.get("/:id/verify", protect, restrictTo("HR"), verifySignature);

router.post(
  "/create-payment-intent",
  protect,
  restrictTo("HR"),
  csrfProtection,
  validateRequest(schemas.disburseSalary),
  createPaymentIntent,
);

export default router;
