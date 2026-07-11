import crypto from "crypto";
import { env } from "../config/environment.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const ENCODING = "hex";

const encryptWithKey = (text, key) => {
  if (!text) return text;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", ENCODING);
  encrypted += cipher.final(ENCODING);

  const authTag = cipher.getAuthTag().toString(ENCODING);

  return `${iv.toString(ENCODING)}:${authTag}:${encrypted}`;
};

const decryptWithKey = (ciphertext, key) => {
  if (!ciphertext) return ciphertext;

  try {
    const [ivHex, authTagHex, encryptedHex] = ciphertext.split(":");

    if (!ivHex || !authTagHex || !encryptedHex) {
      throw new Error("Malformed cipher payload layout mapping.");
    }

    const iv = Buffer.from(ivHex, ENCODING);
    const authTag = Buffer.from(authTagHex, ENCODING);
    const encryptedText = Buffer.from(encryptedHex, ENCODING);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, ENCODING, "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error(
      "Decryption failure: Data integrity verification failed or key is mismatched.",
    );
  }
};

export const encrypt = (text) => encryptWithKey(text, env.dbEncryptionKey);
export const decrypt = (ciphertext) =>
  decryptWithKey(ciphertext, env.dbEncryptionKey);
export const encryptPayroll = (text) =>
  encryptWithKey(text, env.payrollEncryptionKey);
export const decryptPayroll = (ciphertext) =>
  decryptWithKey(ciphertext, env.payrollEncryptionKey);
