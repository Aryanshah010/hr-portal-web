import svgCaptcha from "svg-captcha";
import crypto from "crypto";
import { env } from "../config/environment.js";

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

  const token = encryptCaptcha(captcha.text);

  res.json({ status: "success", data: { token, svg: captcha.data } });
};
