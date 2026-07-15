import React, { useState, useEffect, useCallback } from "react";

interface CaptchaProps {
  onToken: (token: string) => void;
  onAnswer: (answer: string) => void;
  error?: string;
}

const Captcha: React.FC<CaptchaProps> = ({ onToken, onAnswer, error }) => {
  const [svg, setSvg] = useState<string>("");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchCaptcha = useCallback(async () => {
    setLoading(true);
    setValue("");
    try {
      const res = await fetch("/api/auth/captcha", {
        credentials: "include",
      });
      const text = await res.text();
      setSvg(text);
      onToken("__cookie__");
    } catch {
      setSvg("<svg></svg>");
    } finally {
      setLoading(false);
    }
  }, [onToken]);

  useEffect(() => {
    fetchCaptcha();
  }, [fetchCaptcha]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    onAnswer(e.target.value);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <label
        style={{
          fontSize: "0.8rem",
          color: "var(--color-text-muted)",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        Security Check
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div
          style={{
            background: "#fff",
            borderRadius: "0.5rem",
            padding: "4px",
            height: "48px",
            minWidth: "120px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          dangerouslySetInnerHTML={{ __html: loading ? "<svg/>" : svg }}
        />

        <button
          type="button"
          onClick={fetchCaptcha}
          title="Refresh CAPTCHA"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "0.4rem",
            color: "var(--color-text-muted)",
            padding: "0.35rem 0.6rem",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          ↻
        </button>
      </div>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Type the characters above"
        autoComplete="off"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${error ? "var(--color-danger)" : "rgba(255,255,255,0.12)"}`,
          borderRadius: "0.5rem",
          color: "var(--color-text)",
          fontSize: "0.95rem",
          padding: "0.6rem 0.85rem",
          outline: "none",
          letterSpacing: "0.15em",
        }}
      />
      {error && (
        <span style={{ color: "var(--color-danger)", fontSize: "0.8rem" }}>
          {error}
        </span>
      )}
    </div>
  );
};

export default Captcha;
