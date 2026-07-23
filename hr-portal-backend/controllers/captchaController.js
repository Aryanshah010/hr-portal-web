import svgCaptcha from "svg-captcha";
import crypto from "crypto";
import { hashSecret } from "../utils/cryptoUtil.js";
import * as auth from "../repositories/authRepository.js";

const CAPTCHA_TTL_MS = 5 * 60 * 1000;

export const getCaptcha = async (req, res, next) => {
  try {
    const captcha = svgCaptcha.create({
      size: 6,
      ignoreChars: "0o1i",
      noise: 2,
      color: true,
    });

    const token = crypto.randomBytes(32).toString("base64url");
    await auth.createCaptcha({
      tokenHash: hashSecret(token),
      answerHash: hashSecret(captcha.text.toLowerCase()),
      expiresAt: new Date(Date.now() + CAPTCHA_TTL_MS),
    });

    res.json({ status: "success", data: { token, svg: captcha.data } });
  } catch (e) {
    next(e);
  }
};
