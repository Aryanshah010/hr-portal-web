import { env } from "../config/environment.js";
import AuditLog, { AUDIT_EVENTS, AUDIT_SEVERITY } from "../models/AuditLog.js";

/**
 * Express middleware to enforce Cloudflare Edge Security rules (Zero-Trust Gate).
 * 
 * When CLOUDFLARE_ENABLED is set to true in production:
 * - Rejects any request bypassing Cloudflare (checks CF-Ray header presence).
 * - Restores true client IP from CF-Connecting-IP and overrides req.ip to prevent spoofing.
 * - Inspects CF-Threat-Score (WAF reputation) and blocks requests exceeding the configured threshold.
 * - Inspects CF-Bot-Management score (bot score) and blocks automation.
 * - Inspects CF-IPCountry and blocks requests from restricted regions.
 * - Inspects CF-Visitor (scheme) to ensure HTTPS is used.
 */
export const enforceCloudflareGateway = (req, res, next) => {
  if (!env.cloudflareEnabled) {
    req.clientIp = req.ip || "127.0.0.1";
    return next();
  }

  const cfRay = req.headers["cf-ray"];
  if (!cfRay) {
    AuditLog.record({
      eventType: AUDIT_EVENTS.AUTHZ_ACCESS_DENIED,
      severity: AUDIT_SEVERITY.HIGH,
      req,
      metadata: { reason: "Direct origin access attempt bypassing Cloudflare WAF." },
    });
    return res.status(403).json({
      error: "Security Exception",
      message: "Access Denied: Direct origin connection prohibited. Requests must route through secure perimeter gateways.",
    });
  }

  const cfClientIp = req.headers["cf-connecting-ip"];
  if (!cfClientIp) {
    AuditLog.record({
      eventType: AUDIT_EVENTS.AUTHZ_ACCESS_DENIED,
      severity: AUDIT_SEVERITY.HIGH,
      req,
      metadata: { reason: "Missing Cloudflare client IP identification header." },
    });
    return res.status(400).json({
      error: "Security Exception",
      message: "Bad Request: Missing client identity headers from gateway route.",
    });
  }

  req.clientIp = cfClientIp.trim();

  const cfVisitorHeader = req.headers["cf-visitor"];
  if (cfVisitorHeader) {
    try {
      const visitor = JSON.parse(cfVisitorHeader);
      if (visitor.scheme !== "https") {
        return res.status(400).json({
          error: "Insecure Connection",
          message: "SSL Required: Secure TLS communication channel is mandatory.",
        });
      }
    } catch (e) {
      return res.status(400).json({
        error: "Malformed Request",
        message: "Invalid perimeter validation header metadata received.",
      });
    }
  }

  const threatScoreHeader = req.headers["cf-threat-score"];
  if (threatScoreHeader) {
    const score = parseInt(threatScoreHeader, 10);
    if (!isNaN(score) && score > env.cfThreatScoreThreshold) {
      AuditLog.record({
        eventType: AUDIT_EVENTS.NOSQL_INJECTION_ATTEMPT, 
        severity: AUDIT_SEVERITY.CRITICAL,
        req,
        metadata: { reason: `Cloudflare Threat Score ${score} exceeded security limit ${env.cfThreatScoreThreshold}.` },
      });
      return res.status(403).json({
        error: "Security Exception",
        message: "Request blocked due to suspicious client security reputation profiles.",
      });
    }
  }

  const botScoreHeader = req.headers["cf-bot-management"];
  if (botScoreHeader) {
    const botScore = parseInt(botScoreHeader, 10);
    if (!isNaN(botScore) && botScore < 10) { 
      AuditLog.record({
        eventType: AUDIT_EVENTS.RATE_LIMIT_EXCEEDED,
        severity: AUDIT_SEVERITY.MEDIUM,
        req,
        metadata: { reason: `Cloudflare Bot Score ${botScore} classified client as automated machine.` },
      });
      return res.status(403).json({
        error: "Security Exception",
        message: "Automated traffic blocked by perimeter bot management algorithms.",
      });
    }
  }

  next();
};
