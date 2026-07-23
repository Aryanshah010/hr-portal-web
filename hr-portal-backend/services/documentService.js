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
import { validateExternalUrl } from "../utils/ssrfValidator.js";
import { detectMimeType } from "../middleware/uploadValidator.js";

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

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_TIMEOUT_MS = 5000;
const AVATAR_MIMES = ["image/jpeg", "image/png"];

export const setAvatarFromUrl = async ({ userId, url, req }) => {
  const employee = await employees.findByUserId(userId);
  if (!employee) throw new AppError("Employee profile not found.", 404);

  let target;
  try {
    target = await validateExternalUrl(url);
  } catch (error) {
    await audit.record({
      eventType: "SSRF_ATTEMPT",
      severity: "CRITICAL",
      req,
      actorId: userId,
      actorRole: req.user.role,
      metadata: {
        submittedUrl: String(url).slice(0, 500),
        rejectedBecause: error.message,
      },
    });
    throw error;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AVATAR_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(target.url, {
      redirect: "manual",
      signal: controller.signal,
      headers: { Accept: AVATAR_MIMES.join(",") },
    });
  } catch {
    clearTimeout(timer);
    throw new AppError("The image could not be retrieved.", 400);
  }

  try {
    if (response.status >= 300 && response.status < 400) {
      await audit.record({
        eventType: "SSRF_ATTEMPT",
        severity: "CRITICAL",
        req,
        actorId: userId,
        actorRole: req.user.role,
        metadata: {
          submittedUrl: target.url,
          rejectedBecause: "REDIRECT_NOT_FOLLOWED",
          location: response.headers.get("location")?.slice(0, 500) ?? null,
        },
      });
      throw new AppError("Redirects are not permitted for image URLs.", 400);
    }
    if (!response.ok)
      throw new AppError("The image could not be retrieved.", 400);

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > AVATAR_MAX_BYTES)
      throw new AppError("Images must be between 1 byte and 2 MB.", 400);

    const mimeType = detectMimeType(buffer, AVATAR_MIMES);
    if (!mimeType)
      throw new AppError("Only JPEG and PNG images are accepted.", 400);

    const storageName = `${crypto.randomUUID()}.enc`;
    await fs.mkdir(storagePath, { recursive: true, mode: 0o700 });
    await fs.writeFile(filePath(storageName), encryptBuffer(buffer), {
      mode: 0o600,
    });

    const previous = employee.avatarStorageName;
    await employees.updateByUserId(userId, {
      avatarStorageName: storageName,
      avatarMimeType: mimeType,
      avatarSourceUrl: target.url,
    });
    if (previous) await fs.unlink(filePath(previous)).catch(() => {});

    await audit.record({
      eventType: "EMPLOYEE_UPDATED",
      severity: "MEDIUM",
      req,
      actorId: userId,
      actorRole: req.user.role,
      metadata: {
        action: "AVATAR_SET",
        host: target.hostname,
        bytes: buffer.byteLength,
        mimeType,
      },
    });
    return { mimeType, bytes: buffer.byteLength };
  } finally {
    clearTimeout(timer);
  }
};

export const readAvatar = async (userId) => {
  const employee = await employees.findByUserId(userId);
  if (!employee?.avatarStorageName)
    throw new AppError("No avatar has been set.", 404);
  const encrypted = await fs
    .readFile(filePath(employee.avatarStorageName))
    .catch(() => {
      throw new AppError("Avatar file is unavailable.", 404);
    });
  return {
    buffer: decryptBuffer(encrypted.toString("utf8")),
    mimeType: employee.avatarMimeType || "image/png",
  };
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
    if (!employee || employee.id !== document.employeeId.toString()) {
      // Fetching another employee's encrypted document by ID is an IDOR probe.
      await audit.record({
        eventType: "AUTHZ_IDOR_ATTEMPT",
        severity: "CRITICAL",
        req,
        actorId: userId,
        actorRole: req.user.role,
        metadata: {
          resource: "EMPLOYEE_DOCUMENT",
          documentId: id,
          ownerEmployeeId: document.employeeId.toString(),
          ownEmployeeId: employee?.id ?? null,
        },
      });
      throw new AppError("You may only access your own document.", 403);
    }
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
