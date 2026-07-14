import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, icon, style, ...props }, ref) => {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.4rem",
          width: "100%",
        }}
      >
        <label
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "var(--color-text, #f8fafc)",
          }}
        >
          {label}
        </label>
        <div style={{ position: "relative" }}>
          {icon && (
            <div
              style={{
                position: "absolute",
                left: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-muted, #94a3b8)",
                pointerEvents: "none",
              }}
            >
              {icon}
            </div>
          )}
          <input
            ref={ref}
            style={{
              width: "100%",
              padding: `0.875rem 1rem 0.875rem ${icon ? "2.75rem" : "1rem"}`,
              backgroundColor: "rgba(0,0,0,0.2)",
              border: `1px solid ${error ? "var(--color-danger, #ef4444)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: "0.75rem",
              color: "white",
              fontSize: "0.95rem",
              outline: "none",
              transition: "border-color 0.2s",
              boxSizing: "border-box",
              ...style,
            }}
            {...props}
          />
        </div>
        {error && (
          <span
            style={{
              color: "var(--color-danger, #ef4444)",
              fontSize: "0.8rem",
              marginTop: "0.1rem",
            }}
          >
            {error}
          </span>
        )}
      </div>
    );
  },
);
FormInput.displayName = "FormInput";
