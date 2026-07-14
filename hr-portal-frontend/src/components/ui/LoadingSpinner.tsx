import { Loader2 } from "lucide-react";

export function LoadingSpinner({
  size = 24,
  text,
}: {
  size?: number;
  text?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.5rem",
        color: "var(--color-text-muted, #94a3b8)",
      }}
    >
      <Loader2 size={size} style={{ animation: "spin 1s linear infinite" }} />
      {text && <span style={{ fontSize: "0.875rem" }}>{text}</span>}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
