import express from "express";
import { env } from "../config/environment.js";
import {
  getAuthorizationUrl,
  generateOAuthState,
  handleGoogleCallback,
  verifyStateSignature,
} from "../services/oauthService.js";
import { generateToken } from "../utils/generateToken.js";

const router = express.Router();

router.get("/oauth/google", (req, res) => {
  const state = generateOAuthState();

  res.cookie("oauth_state", state, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    maxAge: 5 * 60 * 1000, // 5 minutes validity
  });

  const authUrl = getAuthorizationUrl(state);
  res.redirect(authUrl);
});

router.get("/oauth/callback", async (req, res) => {
  const { code, state: queryState, error } = req.query;
  const cookieState = req.cookies.oauth_state;

  res.clearCookie("oauth_state");

  if (error) {
    console.error(
      "[OAUTH ERROR] User denied access or Google OAuth error:",
      error,
    );
    return res.redirect(`${env.frontendUrl}/login?error=oauth_failed`);
  }

  if (!code || !queryState) {
    return res.redirect(`${env.frontendUrl}/login?error=invalid_request`);
  }

  const [stateValue, signature] = queryState.split(":");
  if (!stateValue || !signature) {
    return res.redirect(`${env.frontendUrl}/login?error=invalid_state`);
  }

  const isSignatureValid = verifyStateSignature(stateValue, signature);
  if (!isSignatureValid) {
    return res.redirect(`${env.frontendUrl}/login?error=state_mismatch`);
  }

  if (stateValue !== cookieState) {
    return res.redirect(`${env.frontendUrl}/login?error=session_mismatch`);
  }

  try {
    const user = await handleGoogleCallback(code);
    const token = generateToken(user);

    res.cookie("token", token, {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: env.nodeEnv === "production",
      sameSite: "strict",
    });

    res.redirect(`${env.frontendUrl}/dashboard`);
  } catch (err) {
    console.error("[OAUTH CALLBACK ERROR] OAuth handling failed:", err.message);
    const msg = encodeURIComponent(err.message);
    res.redirect(`${env.frontendUrl}/login?error=auth_failed&details=${msg}`);
  }
});

export default router;
