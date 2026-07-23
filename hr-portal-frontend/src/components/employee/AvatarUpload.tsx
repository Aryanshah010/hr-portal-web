import { useState } from "react";
import {
  Image,
  AlertCircle,
  CheckCircle2,
  User,
  Save,
  Loader2,
} from "lucide-react";
import { setMyAvatar, myAvatarUrl } from "@/services/employeeService.js";
import { useToast } from "@/context/ToastContext.js";
import type { ApiError } from "@/types/index.js";

const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fd[0-9a-f]{2}:/i,
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

  return null;
}

interface AvatarUploadProps {
  hasExisting?: boolean;
}

export function AvatarUpload({ hasExisting = false }: AvatarUploadProps) {
  const { error: toastError, success } = useToast();
  const [inputVal, setInputVal] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [imgBroken, setImgBroken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [storedVersion, setStoredVersion] = useState<number | null>(
    hasExisting ? Date.now() : null,
  );

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
    } else {
      setPreviewUrl("");
    }
  };

  const handleSave = async () => {
    const err = validateAvatarUrl(inputVal);
    if (err) {
      setError(err);
      return;
    }
    try {
      setSaving(true);
      await setMyAvatar(inputVal.trim());
      setStoredVersion(Date.now());
      setInputVal("");
      setPreviewUrl("");
      success("Profile photo updated.");
    } catch (e) {
      toastError((e as ApiError).message || "Could not save that image.");
    } finally {
      setSaving(false);
    }
  };

  const hasValidPreview = previewUrl && !error && !imgBroken;
  const displaySrc = hasValidPreview
    ? previewUrl
    : storedVersion
      ? myAvatarUrl(storedVersion)
      : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
          {displaySrc ? (
            <img
              src={displaySrc}
              alt="Profile photo"
              onError={() => hasValidPreview && setImgBroken(true)}
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

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !inputVal.trim() || Boolean(error)}
          style={{
            marginTop: "0.6rem",
            padding: "0.6rem 1rem",
            background:
              saving || !inputVal.trim() || error
                ? "rgba(99,102,241,0.3)"
                : "var(--color-primary, #6366f1)",
            color: "#fff",
            border: "none",
            borderRadius: "0.6rem",
            fontSize: "0.85rem",
            fontWeight: 500,
            cursor:
              saving || !inputVal.trim() || error ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
          }}
        >
          {saving ? (
            <>
              <Loader2
                size={14}
                style={{ animation: "spin 1s linear infinite" }}
              />{" "}
              Fetching…
            </>
          ) : (
            <>
              <Save size={14} /> Save Photo
            </>
          )}
        </button>

        <p
          style={{
            margin: "0.5rem 0 0 0",
            fontSize: "0.73rem",
            color: "var(--color-text-muted, #94a3b8)",
            lineHeight: 1.5,
          }}
        >
          The server re-validates this URL, refuses internal addresses and
          redirects, verifies the file really is a JPEG or PNG, then stores it
          encrypted. Blocked attempts are written to the audit log.
        </p>
      </div>
    </div>
  );
}

export default AvatarUpload;
