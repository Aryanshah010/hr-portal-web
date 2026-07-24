import { env } from "../config/environment.js";
import {
  authorizationUrl,
  createState,
  readGoogleIdentity,
  validState,
} from "../services/oauthService.js";
import * as authService from "../services/authService.js";
import { issueCsrfToken } from "../middleware/csrf.js";
import * as userRepo from "../repositories/userRepository.js";
import * as audit from "../repositories/auditRepository.js";

const secure = env.httpsEnabled;

const flowCookie = (res, name, value, maxAge = 10 * 60 * 1000) =>
  res.cookie(name, value, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/api/auth",
    maxAge,
  });

const clearFlow = (res, name) =>
  res.clearCookie(name, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/api/auth",
  });

const setSession = (res, session) => {
  res.cookie("access_token", session.accessToken, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/",
    maxAge: 30 * 86400000,
  });

  res.cookie("refresh_token", session.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/api/auth/refresh",
    maxAge: 7 * 86400000,
  });
};

const clearSession = (res) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/",
  });
  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/api/auth/refresh",
  });
};

const redirect = (res, path) => res.redirect(`${env.frontendUrl}${path}`);

const flowFromCookie = (req, name) => req.cookies?.[name];

export const csrf = (req, res) =>
  res.json({ status: "success", data: { token: issueCsrfToken(req, res) } });

export const hrContact = async (req, res, next) => {
  try {
    const hr = await userRepo.findFirstHr();
    res.json({
      status: "success",
      data: { email: hr?.email ?? null, name: hr?.name ?? null },
    });
  } catch (e) {
    next(e);
  }
};

export const googleStart = (req, res) => {
  const state = createState();
  flowCookie(res, "oauth_state", state.value, 5 * 60 * 1000);
  res.redirect(authorizationUrl(state.signed));
};

export const googleCallback = async (req, res, next) => {
  try {
    const state = validState(req.query.state);
    if (
      !state ||
      state !== flowFromCookie(req, "oauth_state") ||
      !req.query.code
    )
      return redirect(res, "/login?error=oauth_failed");
    clearFlow(res, "oauth_state");
    const user = await authService.registerGoogleIdentity(
      await readGoogleIdentity(req.query.code),
    );
    const step = authService.nextGoogleStep(user);
    if (step.flowToken) {
      const name =
        step.state === "REGISTRATION" ? "registration_flow" : "mfa_flow";
      flowCookie(res, name, step.flowToken);
    }
    const target = {
      REGISTRATION: "/register?oauth=true",
      PENDING_APPROVAL: "/login?status=pending",
      SUSPENDED: "/login?status=suspended",
      MFA_ENROLMENT: "/mfa/setup?oauth=true",
      MFA_CHALLENGE: "/mfa/verify?oauth=true",
    }[step.state];
    redirect(res, target);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { phone, password, captchaAnswer, captchaToken } = req.body;

    const step = await authService.startPasswordLogin({
      phone,
      password,
      captchaToken,
      captchaAnswer,
      req,
    });
    flowCookie(res, "mfa_flow", step.flowToken, 10 * 60 * 1000);
    res.json({ status: "success", data: { nextStep: step.state } });
  } catch (e) {
    next(e);
  }
};

export const sendPhone = async (req, res, next) => {
  try {
    console.log("[DEBUG] req.cookies in sendPhone:", req.cookies);
    await authService.sendPhoneVerification({
      registrationToken: flowFromCookie(req, "registration_flow"),
      phone: req.body.phone,
    });
    res
      .status(202)
      .json({ status: "success", message: "Verification code sent." });
  } catch (e) {
    next(e);
  }
};

export const verifyPhone = async (req, res, next) => {
  try {
    const user = await authService.verifyPhone({
      registrationToken: flowFromCookie(req, "registration_flow"),
      code: req.body.code,
    });
    res.json({ status: "success", data: { user } });
  } catch (e) {
    next(e);
  }
};

export const finishRegistration = async (req, res, next) => {
  try {
    const user = await authService.completeRegistration({
      registrationToken: flowFromCookie(req, "registration_flow"),
      profile: req.body,
      req,
    });
    clearFlow(res, "registration_flow");
    res.status(201).json({ status: "success", data: { user } });
  } catch (e) {
    next(e);
  }
};

export const setupMfa = async (req, res, next) => {
  try {
    res.json({
      status: "success",
      data: await authService.mfaSetup(flowFromCookie(req, "mfa_flow")),
    });
  } catch (e) {
    next(e);
  }
};

export const confirmMfa = async (req, res, next) => {
  try {
    const session = await authService.confirmMfa({
      token: flowFromCookie(req, "mfa_flow"),
      code: req.body.code,
      req,
    });
    clearFlow(res, "mfa_flow");
    setSession(res, session);
    res.json({ status: "success", data: { user: session.user } });
  } catch (e) {
    next(e);
  }
};

export const verifyMfa = async (req, res, next) => {
  try {
    const session = await authService.verifyTotp({
      token: flowFromCookie(req, "mfa_flow"),
      code: req.body.code,
      req,
    });
    clearFlow(res, "mfa_flow");
    setSession(res, session);
    res.json({ status: "success", data: { user: session.user } });
  } catch (e) {
    next(e);
  }
};

export const sendRecovery = async (req, res, next) => {
  try {
    await authService.sendRecoverySms({
      token: flowFromCookie(req, "mfa_flow"),
    });
    res.status(202).json({ status: "success", message: "Recovery code sent." });
  } catch (e) {
    next(e);
  }
};

export const verifyRecovery = async (req, res, next) => {
  try {
    const session = await authService.verifyRecoverySms({
      token: flowFromCookie(req, "mfa_flow"),
      code: req.body.code,
      req,
    });
    clearFlow(res, "mfa_flow");
    setSession(res, session);
    res.json({ status: "success", data: { user: session.user } });
  } catch (e) {
    next(e);
  }
};

export const requestPasswordReset = async (req, res, next) => {
  try {
    await authService.requestPasswordReset({ phone: req.body.phone, req });
    // Always the same response, whether or not the phone is registered.
    res.status(202).json({
      status: "success",
      message:
        "If an account with that phone number exists, a reset code has been sent by SMS.",
    });
  } catch (e) {
    next(e);
  }
};

export const confirmPasswordReset = async (req, res, next) => {
  try {
    await authService.confirmPasswordReset({
      phone: req.body.phone,
      code: req.body.code,
      newPassword: req.body.newPassword,
      req,
    });
    res.json({
      status: "success",
      message:
        "Your password has been reset. You can now sign in with your new password.",
    });
  } catch (e) {
    next(e);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const session = await authService.refresh({
      refreshToken: req.cookies?.refresh_token,
      req,
    });
    setSession(res, session);
    res.json({ status: "success", data: { user: session.user } });
  } catch (e) {
    clearSession(res);
    next(e);
  }
};

export const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.sessionId);
    await audit.record({
      eventType: "AUTH_LOGOUT",
      severity: "LOW",
      req,
      actorId: req.user.id,
      actorRole: req.user.role,
      metadata: { sessionId: req.user.sessionId },
    });
    clearSession(res);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};

export const me = async (req, res, next) => {
  try {
    res.json({
      status: "success",
      data: { user: await authService.currentUser(req.user.id) },
    });
  } catch (e) {
    next(e);
  }
};
