import crypto from "crypto";
import { google } from "googleapis";
import AppError from "../utils/appError.js";
import { env } from "../config/environment.js";

const client = () =>
  new google.auth.OAuth2(
    env.googleClientId,
    env.googleClientSecret,
    env.googleCallbackUrl,
  );
const signature = (value) =>
  crypto.createHmac("sha256", env.oauthStateSecret).update(value).digest("hex");
export const createState = () => {
  const value = crypto.randomBytes(32).toString("hex");
  return { value, signed: `${value}.${signature(value)}` };
};
export const validState = (signed) => {
  const [value, provided] = String(signed || "").split(".");
  const expected = signature(value);
  const a = Buffer.from(provided || "");
  const b = Buffer.from(expected);
  return Boolean(value) && a.length === b.length && crypto.timingSafeEqual(a, b)
    ? value
    : null;
};
export const authorizationUrl = (state) =>
  client().generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    state,
    prompt: "select_account",
  });
export const readGoogleIdentity = async (code) => {
  let tokens;
  try {
    tokens = (await client().getToken(code)).tokens;
  } catch {
    throw new AppError("Google sign-in could not be completed.", 401);
  }
  if (!tokens.id_token)
    throw new AppError("Google sign-in returned no identity token.", 401);
  let payload;
  try {
    payload = (
      await client().verifyIdToken({
        idToken: tokens.id_token,
        audience: env.googleClientId,
      })
    ).getPayload();
  } catch {
    throw new AppError("Google identity token could not be verified.", 401);
  }
  if (!payload?.email_verified || !payload.email || !payload.sub)
    throw new AppError("A verified Google email address is required.", 401);
  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name || null,
  };
};
