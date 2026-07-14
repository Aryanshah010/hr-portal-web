import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// Backend URL — fallback to localhost:5000 for local dev
const BACKEND_URL = process.env.VITE_API_BASE_URL
  ? new URL(process.env.VITE_API_BASE_URL).origin
  : "http://localhost:5000";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      // @/ maps to src/ — mirrors tsconfig.app.json paths
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  // ─── Dev server ───────────────────────────────────────────────────────────────
  // Proxy /api to the backend so the browser never makes cross-origin requests
  // in local dev. This sidesteps CORS entirely and ensures HttpOnly cookies
  // are sent on every request (withCredentials: true + same-origin).
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: BACKEND_URL,
        changeOrigin: true,
        // Rewrite Set-Cookie domain so HttpOnly cookies work on localhost
        cookieDomainRewrite: "localhost",
        // Forward secure cookies over HTTP in dev
        secure: false,
      },
    },
    // Dev-server Content-Security-Policy headers.
    // Production CSP should be set by nginx / CDN — this mirrors the intent.
    // Rules: no eval, no inline scripts. Vite HMR uses WebSocket (@connectSrc).
    headers: {
      "Content-Security-Policy": [
        "default-src 'self'",
        "script-src 'self'", // no unsafe-inline, no eval
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // inline styles needed for CSS-in-JS
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:", // data: for base64 avatars, https: for external images
        "connect-src 'self' ws://localhost:5173 wss://localhost:5173", // Vite HMR WebSocket
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
      ].join("; "),
    },
  },

  // ─── Build options ────────────────────────────────────────────────────────────
  build: {
    // Chunk size warning threshold (kB)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Fingerprint all assets for cache-busting
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
        // Split vendor chunks to improve caching
      },
    },
  },
});
