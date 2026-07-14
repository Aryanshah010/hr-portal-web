// ─────────────────────────────────────────────────────────────────────────────
// components/employee/AvatarUpload.tsx
//
// URL-based avatar component. User pastes an external image URL; we validate
// it client-side (HTTPS-only, no private/RFC-1918 hosts) and show a preview.
//
// Security note: There is no avatar API endpoint on this backend. If one
// existed, the backend's ssrfValidator middleware would re-validate the URL
// server-side before any fetch, blocking SSRF attempts at /169.254.x.x,
// /10.x, /192.168.x, /127.x etc.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { Image, AlertCircle, CheckCircle2, User } from "lucide-react";

// ─── Validation ───────────────────────────────────────────────────────────────

const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./, // link-local / AWS metadata
  /^0\./,
  /^::1$/,
  /^fd[0-9a-f]{2}:/i, // ULA IPv6
  /^\[::1\]$/,
];

function validateAvatarUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return "Enter a valid URL.";
  }

  if (url.protocol !== "https:") {
    return "URL must use HTTPS and point to an external image host.";
  }

  const host = url.hostname.toLowerCase();
  for (const pat of PRIVATE_IP_PATTERNS) {
    if (pat.test(host)) {
      return "URL must use HTTPS and point to an external image host.";
    }
  }

  // Very basic: allow any path — the <img> will simply fail to load if not an image
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AvatarUploadProps {
  /** Current avatar URL (controlled externally if needed) */
  value?: string;
  /** Called when a valid URL is set */
  onChange?: (url: string) => void;
}

export function AvatarUpload({ value, onChange }: AvatarUploadProps) {
  const [inputVal, setInputVal] = useState(value ?? "");
  const [previewUrl, setPreviewUrl] = useState(value ?? "");
  const [error, setError] = useState<string | null>(null);
  const [imgBroken, setImgBroken] = useState(false);

  const handleInput = (raw: string) => {
    setInputVal(raw);
    if (!raw.trim()) {
      setError(null);
      setPreviewUrl("");
      setImgBroken(false);
      return;
    }
    const err = validateAvatarUrl(raw);
    setError(err);
    if (!err) {
      setPreviewUrl(raw.trim());
      setImgBroken(false);
      onChange?.(raw.trim());
    } else {
      setPreviewUrl("");
    }
  };

  const hasValidPreview = previewUrl && !error && !imgBroken;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Preview circle */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
        <div
          style={{
            width: "5rem",
            height: "5rem",
            borderRadius: "50%",
            background: "rgba(99,102,241,0.15)",
            border: "2px solid rgba(99,102,241,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
            position: "relative",
          }}
        >
          {hasValidPreview ? (
            <img
              src={previewUrl}
              alt="Avatar preview"
              onError={() => setImgBroken(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <User size={32} color="rgba(99,102,241,0.6)" />
          )}
        </div>
        <div>
          <p
            style={{
              margin: "0 0 0.25rem 0",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--color-text, #f8fafc)",
            }}
          >
            Profile Photo
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "0.78rem",
              color: "var(--color-text-muted, #94a3b8)",
            }}
          >
            Paste a public HTTPS image URL below
          </p>
        </div>
      </div>

      {/* URL input */}
      <div>
        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              left: "0.875rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: error
                ? "var(--color-danger, #ef4444)"
                : hasValidPreview
                  ? "var(--color-success, #22c55e)"
                  : "var(--color-text-muted, #94a3b8)",
              pointerEvents: "none",
            }}
          >
            <Image size={16} />
          </div>
          <input
            type="url"
            value={inputVal}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="https://example.com/photo.jpg"
            aria-label="Avatar image URL"
            style={{
              width: "100%",
              padding: "0.75rem 2.5rem 0.75rem 2.5rem",
              backgroundColor: "rgba(0,0,0,0.2)",
              border: `1px solid ${error ? "var(--color-danger, #ef4444)" : hasValidPreview ? "var(--color-success, #22c55e)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: "0.6rem",
              color: "var(--color-text, #f8fafc)",
              fontSize: "0.875rem",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {hasValidPreview && (
            <div
              style={{
                position: "absolute",
                right: "0.875rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-success, #22c55e)",
              }}
            >
              <CheckCircle2 size={16} />
            </div>
          )}
        </div>

        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              marginTop: "0.4rem",
              color: "var(--color-danger, #ef4444)",
              fontSize: "0.78rem",
            }}
          >
            <AlertCircle size={13} />
            <span>{error}</span>
          </div>
        )}
        {imgBroken && !error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              marginTop: "0.4rem",
              color: "var(--color-warning, #f59e0b)",
              fontSize: "0.78rem",
            }}
          >
            <AlertCircle size={13} />
            <span>
              Image failed to load. Check the URL is publicly accessible.
            </span>
          </div>
        )}

        <p
          style={{
            margin: "0.5rem 0 0 0",
            fontSize: "0.73rem",
            color: "var(--color-text-muted, #94a3b8)",
            lineHeight: 1.5,
          }}
        >
          ⚠️ Local state only — no backend endpoint exists. If an avatar
          endpoint were added, the server&#39;s SSRF validator would re-validate
          this URL before any server-side fetch.
        </p>
      </div>
    </div>
  );
}

export default AvatarUpload;
