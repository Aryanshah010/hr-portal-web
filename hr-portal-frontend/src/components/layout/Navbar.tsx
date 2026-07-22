import { useAuth } from "@/context/AuthContext.js";
import { LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) return null;

  return (
    <header
      style={{
        height: "4rem",
        backgroundColor: "rgba(255,255,255,0.02)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 2rem",
      }}
    >
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--color-text-muted, #94a3b8)",
            fontSize: "0.9rem",
          }}
        >
          <User size={18} />
          <span>{user.name}</span>
          <span
            style={{
              fontSize: "0.7rem",
              padding: "0.1rem 0.4rem",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.1)",
              color: "white",
              marginLeft: "0.25rem",
            }}
          >
            {user.role}
          </span>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "transparent",
            border: "none",
            color: "var(--color-text-muted, #94a3b8)",
            cursor: isLoggingOut ? "not-allowed" : "pointer",
            fontSize: "0.9rem",
            padding: "0.5rem",
            borderRadius: "0.5rem",
            transition: "color 0.2s, background-color 0.2s",
            opacity: isLoggingOut ? 0.7 : 1,
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = "var(--color-danger, #ef4444)";
            e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = "var(--color-text-muted, #94a3b8)";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}
