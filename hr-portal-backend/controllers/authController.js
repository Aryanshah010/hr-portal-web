import { env } from "../config/environment.js";
import {
  authorizationUrl,
  createState,
  readGoogleIdentity,
  validState,
} from "../services/oauthService.js";
import * as authService from "../services/authService.js";
import { issueCsrfToken } from "../middleware/csrf.js";
import { signFlowToken, verifyFlowToken } from "../utils/generateToken.js";

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
    maxAge: 15 * 60 * 1000,
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
      REGISTRATION: "/register/complete",
      PENDING_APPROVAL: "/login?status=pending",
      SUSPENDED: "/login?status=suspended",
      MFA_ENROLMENT: "/mfa/setup",
      MFA_CHALLENGE: "/mfa/verify",
    }[step.state];
    redirect(res, target);
  } catch (error) {
    next(error);
  }
};
export const sendPhone = async (req, res, next) => {
  try {
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
    const token = req.cookies?.access_token;
    let sid = null;
    if (token) {
      try {
        sid = verifyFlowToken(token).sid;
      } catch {}
    }
    await authService.logout(req.user?.sessionId || sid);
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
