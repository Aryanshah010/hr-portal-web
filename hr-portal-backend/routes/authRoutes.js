import express from "express";
import { authLimiter } from "../middleware/rateLimiter.js";
import { csrfProtection } from "../middleware/csrf.js";
import { protect } from "../middleware/authGuard.js";
import { validateRequest, schemas } from "../middleware/validator.js";
import * as controller from "../controllers/authController.js";
import { getCaptcha } from "../controllers/captchaController.js";

const router = express.Router();
router.get("/csrf", controller.csrf);
router.get("/hr-contact", controller.hrContact);
router.get("/oauth/google", authLimiter, controller.googleStart);
router.get("/oauth/callback", authLimiter, controller.googleCallback);
router.use(csrfProtection);

router.get("/captcha", getCaptcha);

router.post(
  "/login",
  authLimiter,
  validateRequest(schemas.login),
  controller.login,
);
router.post(
  "/registration/phone/send",
  authLimiter,
  validateRequest(schemas.phone),
  controller.sendPhone,
);
router.post(
  "/registration/phone/verify",
  authLimiter,
  validateRequest(schemas.otp),
  controller.verifyPhone,
);
router.post(
  "/registration/complete",
  authLimiter,
  validateRequest(schemas.registration),
  controller.finishRegistration,
);
router.get("/mfa/setup", authLimiter, controller.setupMfa);
router.post(
  "/mfa/confirm",
  authLimiter,
  validateRequest(schemas.otp),
  controller.confirmMfa,
);
router.post(
  "/mfa/verify",
  authLimiter,
  validateRequest(schemas.otp),
  controller.verifyMfa,
);
router.post("/mfa/recovery/send", authLimiter, controller.sendRecovery);
router.post(
  "/mfa/recovery/verify",
  authLimiter,
  validateRequest(schemas.otp),
  controller.verifyRecovery,
);
router.post("/refresh", authLimiter, controller.refresh);
router.post("/logout", protect, controller.logout);
router.get("/me", protect, controller.me);
export default router;
