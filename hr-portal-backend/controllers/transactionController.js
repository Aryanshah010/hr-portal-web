import {
  initiateSalaryDisbursement,
  verifyWebhookSignature,
  processSuccessfulPayment,
  processFailedPayment,
} from "../services/transactionService.js";
import { env } from "../config/environment.js";
import AppError from "../utils/appError.js";

export const createPaymentIntent = async (req, res, next) => {
  try {
    const { employeeId, baseSalary, idempotencyKey } = req.body;
    const hrId = req.user.id;

    const result = await initiateSalaryDisbursement({
      employeeId,
      amount: baseSalary,
      hrId,
      idempotencyKey,
    });

    res.status(200).json({
      status: "success",
      message: "Secure payment intent successfully registered in ledger.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const handleWebhook = async (req, res, next) => {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    return next(new AppError("Missing signature verification headers.", 400));
  }

  let event;
  try {
    event = verifyWebhookSignature(req.body, sig, env.stripeWebhookSecret);
  } catch (err) {
    console.error(
      `[WEBHOOK SIGNATURE ERROR] Webhook signature verification failed:`,
      err.message,
    );
    return res
      .status(400)
      .send(`Webhook Signature Verification Error: ${err.message}`);
  }

  const paymentIntent = event.data.object;

  switch (event.type) {
    case "payment_intent.succeeded":
      await processSuccessfulPayment(paymentIntent.id);
      break;
    case "payment_intent.payment_failed":
      const errorMsg =
        paymentIntent.last_payment_error?.message ||
        "Stripe transaction failed.";
      await processFailedPayment(paymentIntent.id, errorMsg);
      break;
    default:
      console.log(
        `[WEBHOOK INFO] Unhandled Stripe webhook event type: ${event.type}`,
      );
  }

  res.status(200).json({ received: true });
};
