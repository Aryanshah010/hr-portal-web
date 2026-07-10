import { google } from "googleapis";
import crypto from "crypto";
import { env } from "../config/environment.js";
import User from "../models/User.js";
import AppError from "../utils/appError.js";

const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    env.googleClientId,
    env.googleClientSecret,
    env.googleCallbackUrl
  );
};

export const generateOAuthState = () => {
  return crypto.randomBytes(32).toString("hex");
};

export const signState = (state) => {
  return crypto
    .createHmac("sha256", env.oauthStateSecret)
    .update(state)
    .digest("hex");
};

export const verifyStateSignature = (state, signature) => {
  const expectedSignature = signState(state);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch (e) {
    return false;
  }
};

export const getAuthorizationUrl = (state) => {
  const oauth2Client = getOAuth2Client();
  const stateSignature = signState(state);

  const combinedState = `${state}:${stateSignature}`;

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "openid",
    ],
    state: combinedState,
    prompt: "select_account",
  });
};

export const handleGoogleCallback = async (code) => {
  const oauth2Client = getOAuth2Client();

  let tokens;
  try {
    const response = await oauth2Client.getToken({
      code,
      options: {
        minVersion: "TLSv1.3",
      }
    });
    tokens = response.tokens;
  } catch (error) {
    throw new AppError("Failed to retrieve access tokens from OAuth provider.", 400);
  }

  const idToken = tokens.id_token;
  if (!idToken) {
    throw new AppError("Missing ID Token from authentication callback response.", 400);
  }

  let ticket;
  try {
    ticket = await oauth2Client.verifyIdToken({
      idToken,
      audience: env.googleClientId,
    });
  } catch (error) {
    throw new AppError("ID Token cryptographic signature verification failed.", 401);
  }

  const payload = ticket.getPayload();
  if (!payload || !payload.email_verified) {
    throw new AppError("Identity verification failed. Verified email is required.", 401);
  }

  const { sub: googleId, email, name } = payload;

  let user = await User.findOne({ email }).select("+oauthId");

  if (!user) {
    user = await User.create({
      email,
      oauthProvider: "google",
      oauthId: googleId,
      role: "Employee", 
      isActive: true,
      totpVerified: false,
    });
  } else {
    if (user.oauthProvider === "local") {
      user.oauthProvider = "google";
      user.oauthId = googleId;
      await user.save();
    } else if (user.oauthId !== googleId) {
      throw new AppError("OAuth account identity mismatch. Access Denied.", 403);
    }
  }

  if (!user.isActive) {
    throw new AppError("This user account is currently deactivated.", 403);
  }

  return user;
};
