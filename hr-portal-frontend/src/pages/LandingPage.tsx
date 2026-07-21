import { Link } from "react-router-dom";
import { startGoogleOAuth } from "@/services/authService.js";
import {
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Users,
  Activity,
  Layers,
  Fingerprint,
} from "lucide-react";

export function LandingPage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-bg, #0f1117)",
        color: "var(--color-text, #f8fafc)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflowX: "hidden",
      }}
    >
      {/* Background Gradients */}
      <div
        style={{
          position: "fixed",
          top: "-20%",
          left: "-10%",
          width: "50%",
          height: "50%",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(15,17,23,0) 70%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "-20%",
          right: "-10%",
          width: "50%",
          height: "50%",
          background:
            "radial-gradient(circle, rgba(168,85,247,0.1) 0%, rgba(15,17,23,0) 70%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Navbar */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(15, 17, 23, 0.7)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "2.5rem",
              height: "2.5rem",
              borderRadius: "0.75rem",
              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            <Layers size={20} />
          </div>
          <span
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              letterSpacing: "-0.025em",
            }}
          >
            NexusHR
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link
            to="/login"
            style={{
              color: "var(--color-text)",
              textDecoration: "none",
              fontSize: "0.95rem",
              fontWeight: 500,
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            Sign in
          </Link>
          <button
            onClick={() => startGoogleOAuth()}
            style={{
              background: "var(--color-primary, #6366f1)",
              color: "white",
              textDecoration: "none",
              fontSize: "0.95rem",
              fontWeight: 500,
              padding: "0.6rem 1.25rem",
              borderRadius: "0.75rem",
              transition: "opacity 0.2s, transform 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              border: "none",
              cursor: "pointer",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.opacity = "0.9";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Request Access
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1, zIndex: 1, position: "relative" }}>
        {/* Hero Section */}
        <section
          style={{
            padding: "8rem 2rem 6rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            maxWidth: "90rem",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              background: "rgba(99, 102, 241, 0.1)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              borderRadius: "2rem",
              color: "#818cf8",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: "2rem",
            }}
          >
            <ShieldCheck size={16} />
            Enterprise-Grade Security Architecture
          </div>

          <h1
            style={{
              fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
              margin: "0 0 1.5rem",
              background:
                "linear-gradient(to right, #ffffff 30%, #a8a8a8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Modern HR & Payroll <br /> Management.
          </h1>

          <p
            style={{
              fontSize: "1.2rem",
              color: "var(--color-text-muted, #94a3b8)",
              maxWidth: "90rem",
              margin: "0 auto 3rem",
              lineHeight: 1.6,
            }}
          >
            A fully local-first secure portal designed for scale. Featuring
            military-grade MFA, localized eSewa payouts, and real-time audit
            trails.
          </p>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <button
              onClick={() => startGoogleOAuth()}
              style={{
                background: "white",
                color: "black",
                textDecoration: "none",
                fontSize: "1.05rem",
                fontWeight: 600,
                padding: "0.875rem 2rem",
                borderRadius: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "transform 0.2s, boxShadow 0.2s",
                boxShadow: "0 0 0 0 rgba(255,255,255,0.3)",
                border: "none",
                cursor: "pointer",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 10px 25px -5px rgba(255,255,255,0.2)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 0 0 0 rgba(255,255,255,0.3)";
              }}
            >
              Get Started <ArrowRight size={18} />
            </button>
          </div>
        </section>

        {/* Features Grid */}
        <section
          style={{
            padding: "4rem 2rem 8rem",
            maxWidth: "90rem",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "2rem",
          }}
        >
          {[
            {
              icon: <Fingerprint size={24} />,
              title: "Zero-Trust Identity",
              desc: "Mandatory TOTP MFA, brute-force protection, offline CAPTCHA, and session-binding architecture.",
            },
            {
              icon: <CreditCard size={24} />,
              title: "Native eSewa Payouts",
              desc: "Automated salary disbursement using RSA-SHA256 data integrity and HMAC-SHA256 signatures.",
            },
            {
              icon: <Users size={24} />,
              title: "Employee Lifecycle",
              desc: "Manage profiles, track attendance, host encrypted documents, and perform continuous reviews.",
            },
          ].map((feat, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: "1.5rem",
                padding: "2rem",
                backdropFilter: "blur(12px)",
                transition: "background 0.3s, transform 0.3s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  width: "3rem",
                  height: "3rem",
                  borderRadius: "0.75rem",
                  background: "rgba(99, 102, 241, 0.1)",
                  color: "#818cf8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.5rem",
                }}
              >
                {feat.icon}
              </div>
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  margin: "0 0 0.75rem",
                }}
              >
                {feat.title}
              </h3>
              <p
                style={{
                  color: "var(--color-text-muted, #94a3b8)",
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {feat.desc}
              </p>
            </div>
          ))}
        </section>
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: "2rem",
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--color-text-muted)",
          }}
        >
          <Activity size={18} />
          <span style={{ fontSize: "0.9rem" }}>All systems operational</span>
        </div>
        <p
          style={{
            margin: 0,
            color: "var(--color-text-muted)",
            fontSize: "0.9rem",
          }}
        >
          &copy; {new Date().getFullYear()} NexusHR Platform. Local-First
          Security.
        </p>
      </footer>
    </div>
  );
}
