import express from "express";
import { protect, restrictTo } from "../middleware/authGuard.js";
import { schemas, validateRequest } from "../middleware/validator.js";
import { csrfProtection } from "../middleware/csrf.js";
import {
  createPaymentIntent,
  handleWebhook,
  list,
} from "../controllers/transactionController.js";

const router = express.Router();

router.get(
  "/",
  protect,
  restrictTo("HR"),
  validateRequest(schemas.transactionListQuery, "query"),
  list,
);

router.post(
  "/create-payment-intent",
  protect,
  restrictTo("HR"),
  csrfProtection,
  validateRequest(schemas.disburseSalary),
  createPaymentIntent,
);

router.post("/webhook", handleWebhook);

export default router;
