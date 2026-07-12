import crypto from "crypto";
import { env } from "../config/environment.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const encode = (value) => Buffer.from(value).toString("hex");
const decode = (value) => Buffer.from(value, "hex");

const encryptValue = (value, key) => {
  if (value === null || value === undefined) return value;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(Buffer.isBuffer(value) ? value : Buffer.from(String(value))),
    cipher.final(),
  ]);
  return `${encode(iv)}:${encode(cipher.getAuthTag())}:${encode(encrypted)}`;
};
const decryptValue = (payload, key) => {
  if (payload === null || payload === undefined) return payload;
  const [iv, tag, encrypted] = String(payload).split(":");
  if (!iv || !tag || !encrypted) throw new Error("Malformed encrypted value.");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, decode(iv));
  decipher.setAuthTag(decode(tag));
  return Buffer.concat([decipher.update(decode(encrypted)), decipher.final()]);
};

export const encrypt = (text) => encryptValue(text, env.dbEncryptionKey);
export const decrypt = (payload) =>
  decryptValue(payload, env.dbEncryptionKey).toString("utf8");
export const encryptBuffer = (buffer) =>
  encryptValue(buffer, env.dbEncryptionKey);
export const decryptBuffer = (payload) =>
  decryptValue(payload, env.dbEncryptionKey);
export const encryptPayroll = (text) =>
  encryptValue(text, env.payrollEncryptionKey);
export const decryptPayroll = (payload) =>
  decryptValue(payload, env.payrollEncryptionKey).toString("utf8");
export const hashSecret = (value) =>
  crypto.createHash("sha256").update(String(value)).digest("hex");
