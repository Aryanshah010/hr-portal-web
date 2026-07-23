import { EventEmitter } from "events";
import { AUDIT_EVENTS, AUDIT_SEVERITY } from "../models/AuditLog.js";
import * as audit from "../repositories/auditRepository.js";

export const injectionThreatBus = new EventEmitter();

injectionThreatBus.on("error", (err) => {
  console.error("[NoSQL Sanitizer] Threat bus error:", err.message);
});

const SANITIZER_MODE =
  process.env.NOSQL_SANITIZER_MODE === "SANITIZE" ? "SANITIZE" : "STRICT";

const MAX_DEPTH = 8;

const OPAQUE_VALUE_KEYS = new Set([
  "password",
  "newPassword",
  "currentPassword",
  "confirmPassword",
  "captchaAnswer",
]);

const THREAT_PATTERNS = Object.freeze([
  {
    name: "MONGODB_OPERATOR_KEY_PREFIX",

    keyPattern: /^\$/,
    description: "MongoDB operator prefix detected in key.",
  },
  {
    name: "DOT_NOTATION_TRAVERSAL",
    keyPattern: /\./,
    description: "Dot-notation traversal detected in key.",
  },
  {
    name: "DOLLAR_IN_VALUE",
    valuePattern: /^\s*\$/,
    description: "MongoDB operator prefix detected in string value.",
  },
  {
    name: "JSON_INJECTION_STRING",
    valuePattern: /^\s*[\[{]/,
    description:
      "String value begins with JSON structural characters — potential re-parse injection.",
  },
  {
    name: "WHERE_CLAUSE_INJECTION",
    keyPattern: /^\$where$/i,
    description:
      "Explicit $where operator detected — JavaScript execution injection attempt.",
  },
  {
    name: "FUNCTION_IN_VALUE",
    valuePattern: /function\s*\(|=>/,
    description:
      "JavaScript function signature detected in string value — code injection attempt.",
  },
  {
    name: "NULL_BYTE_INJECTION",
    keyPattern: /\0/,
    valuePattern: /\0/,
    description: "Null byte detected — string truncation injection attempt.",
  },
  {
    name: "UNICODE_OPERATOR_ESCAPE",
    keyPattern: /\\u0024/i,
    valuePattern: /\\u0024/i,
    description:
      "Unicode-escaped dollar sign detected — operator bypass via Unicode escaping.",
  },
]);

function deepScan(target, depth = 0, path = "root") {
  if (depth > MAX_DEPTH) {
    return {
      patternName: "EXCESSIVE_NESTING",
      description: `Payload nesting exceeds maximum allowed depth of ${MAX_DEPTH}.`,
      location: path,
      offendingKey: null,
      offendingValue: null,
    };
  }

  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i++) {
      const threat = deepScan(target[i], depth + 1, `${path}[${i}]`);
      if (threat) return threat;
    }
    return null;
  }

  if (target !== null && typeof target === "object") {
    for (const key of Object.keys(target)) {
      for (const pattern of THREAT_PATTERNS) {
        if (pattern.keyPattern && pattern.keyPattern.test(key)) {
          return {
            patternName: pattern.name,
            description: pattern.description,
            location: `${path}.${key}`,
            offendingKey: key,
            offendingValue: target[key],
          };
        }
      }

      // Recurse so nested operator *keys* are still caught (an attacker sending
      // {"password":{"$gt":""}} is rejected), but skip value-pattern matching on
      // secrets, which are compared with bcrypt and never reach a query filter.
      if (OPAQUE_VALUE_KEYS.has(key) && typeof target[key] === "string")
        continue;

      const threat = deepScan(target[key], depth + 1, `${path}.${key}`);
      if (threat) return threat;
    }
    return null;
  }

  if (typeof target === "string") {
    for (const pattern of THREAT_PATTERNS) {
      if (pattern.valuePattern && pattern.valuePattern.test(target)) {
        return {
          patternName: pattern.name,
          description: pattern.description,
          location: path,
          offendingKey: null,
          offendingValue: target,
        };
      }
    }
  }

  return null;
}

function scanRequestSection(section, label) {
  if (!section || typeof section !== "object") return null;
  const threat = deepScan(section, 0, label);
  return threat ? { threat, section: label } : null;
}

function buildThreatMetadata(req, detectionResult) {
  const { threat, section } = detectionResult;
  return {
    detectedIn: section,
    patternName: threat.patternName,
    description: threat.description,
    location: threat.location,
    offendingKey: threat.offendingKey,

    offendingValue:
      threat.offendingValue !== null && threat.offendingValue !== undefined
        ? String(threat.offendingValue).substring(0, 200)
        : null,
    requestMethod: req.method,
    requestPath: req.originalUrl || req.path,
    timestamp: new Date().toISOString(),
  };
}

function reportThreat(req, metadata) {
  injectionThreatBus.emit("nosql:threat", { req, metadata });

  audit
    .record({
      eventType: AUDIT_EVENTS.NOSQL_INJECTION_ATTEMPT,
      severity: AUDIT_SEVERITY.CRITICAL,
      req,
      actorId: req.user?.id ?? null,
      actorRole: req.user?.role ?? "Unauthenticated",
      metadata,
    })
    .catch((err) => {
      console.error("[NoSQL Sanitizer] Audit write failed:", err.message);
    });

  console.warn(
    `[SECURITY ALERT] NoSQL injection attempt detected | ` +
      `Pattern: ${metadata.patternName} | ` +
      `Path: ${metadata.requestMethod} ${metadata.requestPath} | ` +
      `Location: ${metadata.location} | ` +
      `IP: ${(req.headers["x-forwarded-for"] || req.ip || "unknown").split(",")[0].trim()}`,
  );
}

export const cleanNoSqlInjection = (req, res, next) => {
  const sections = [
    { data: req.body, label: "body" },
    { data: req.query, label: "query" },
    { data: req.params, label: "params" },
  ];

  for (const { data, label } of sections) {
    const detectionResult = scanRequestSection(data, label);

    if (detectionResult) {
      const metadata = buildThreatMetadata(req, detectionResult);
      reportThreat(req, metadata);

      if (SANITIZER_MODE === "STRICT") {
        return res.status(400).json({
          status: "fail",
          message:
            "Request rejected: The payload contains forbidden operator patterns " +
            "that violate the NoSQL injection defense policy.",
          code: "NOSQL_INJECTION_BLOCKED",
        });
      }

      if (detectionResult.threat.offendingKey && req[label]) {
        delete req[label][detectionResult.threat.offendingKey];
      }
    }
  }

  next();
};

export function sanitizeValue(target) {
  if (!target || typeof target !== "object") return target;

  for (const key of Object.keys(target)) {
    let isOffending = false;

    for (const pattern of THREAT_PATTERNS) {
      if (pattern.keyPattern && pattern.keyPattern.test(key)) {
        isOffending = true;
        break;
      }
    }

    if (isOffending) {
      delete target[key];
    } else {
      sanitizeValue(target[key]);
    }
  }

  return target;
}
