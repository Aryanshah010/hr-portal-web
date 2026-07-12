import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import AppError from "../utils/appError.js";
import {
  decrypt,
  decryptBuffer,
  encrypt,
  encryptBuffer,
} from "../utils/cryptoUtil.js";
import { env } from "../config/environment.js";
import * as employees from "../repositories/employeeRepository.js";
import * as documents from "../repositories/documentRepository.js";
import * as audit from "../repositories/auditRepository.js";

const storagePath = path.resolve(env.documentStoragePath);
const filePath = (name) => path.join(storagePath, name);
export const upload = async ({ userId, type, file, req }) => {
  const employee = await employees.findByUserId(userId);
  if (!employee) throw new AppError("Employee profile not found.", 404);
  const old = await documents.findByEmployeeAndType(employee.id, type);
  const storageName = `${crypto.randomUUID()}.enc`;
  await fs.mkdir(storagePath, { recursive: true, mode: 0o700 });
  await fs.writeFile(filePath(storageName), encryptBuffer(file.buffer), {
    mode: 0o600,
  });
  try {
    const document = await documents.upsert({
      employeeId: employee.id,
      type,
      originalNameEncrypted: encrypt(file.originalname),
      storageName,
      mimeType: file.detectedMimeType,
      sha256: crypto.createHash("sha256").update(file.buffer).digest("hex"),
      status: "PENDING",
      reviewedBy: null,
      reviewedAt: null,
    });
    if (old?.storageName)
      await fs.unlink(filePath(old.storageName)).catch(() => {});
    await audit.record({
      eventType: "EMPLOYEE_UPDATED",
      severity: "HIGH",
      req,
      actorId: userId,
      actorRole: req.user.role,
      metadata: { documentId: document.id, type, action: "UPLOADED" },
    });
    return document;
  } catch (error) {
    await fs.unlink(filePath(storageName)).catch(() => {});
    throw error;
  }
};
export const mine = async (userId) => {
  const employee = await employees.findByUserId(userId);
  if (!employee) throw new AppError("Employee profile not found.", 404);
  return documents.listForEmployee(employee.id);
};
export const pending = (query) => documents.listPending(query);
export const decide = async ({ id, status, hrId, req }) => {
  const document = await documents.review(id, status, hrId);
  if (!document) throw new AppError("Pending document not found.", 404);
  await audit.record({
    eventType: "EMPLOYEE_UPDATED",
    severity: "HIGH",
    req,
    actorId: hrId,
    actorRole: req.user.role,
    metadata: { documentId: id, status },
  });
  return document;
};
export const download = async ({ id, userId, isHr, req }) => {
  const document = await documents.findById(id, "+originalNameEncrypted");
  if (!document) throw new AppError("Document not found.", 404);
  if (!isHr) {
    const employee = await employees.findByUserId(userId);
    if (!employee || employee.id !== document.employeeId.toString())
      throw new AppError("You may only access your own document.", 403);
  }
  const encrypted = await fs
    .readFile(filePath(document.storageName))
    .catch(() => {
      throw new AppError("Document file is unavailable.", 404);
    });
  await audit.record({
    eventType: "PII_ACCESS",
    severity: "HIGH",
    req,
    actorId: userId,
    actorRole: req.user.role,
    metadata: { documentId: id },
  });
  return {
    buffer: decryptBuffer(encrypted.toString("utf8")),
    mimeType: document.mimeType,
    name: decrypt(document.originalNameEncrypted).replace(/[\r\n"]/g, "_"),
  };
};
