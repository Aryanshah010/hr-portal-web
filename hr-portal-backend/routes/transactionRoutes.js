import express from "express";
import { protect, restrictTo } from "../middleware/authGuard.js";
import { schemas, validateRequest } from "../middleware/validator.js";
import { createPaymentIntent, handleWebhook } from "../controllers/transactionController.js";

const router = express.Router();


router.post(
  "/create-payment-intent",
  protect,
  restrictTo("Admin", "Manager"),
  validateRequest(schemas.disburseSalary),
  createPaymentIntent
);

router.post("/webhook", handleWebhook);

export default router;
