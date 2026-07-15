import svgCaptcha from "svg-captcha";
import crypto from "crypto";
import { env } from "../config/environment.js";

// Helper to encrypt the captcha answer
const encryptCaptcha = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", env.dbEncryptionKey, iv);
  let encrypted = cipher.update(text.toLowerCase(), "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
};

export const getCaptcha = (req, res) => {
  const captcha = svgCaptcha.create({
    size: 6,
    ignoreChars: "0o1i",
    noise: 2,
    color: true,
  });

  const encryptedToken = encryptCaptcha(captcha.text);

  res.cookie("captcha_token", encryptedToken, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "strict",
    maxAge: 5 * 60 * 1000, // 5 minutes
  });

  res.type("svg").status(200).send(captcha.data);
};
