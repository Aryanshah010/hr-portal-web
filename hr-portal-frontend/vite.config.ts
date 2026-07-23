import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import fs from "fs";

let BACKEND_URL = "https://localhost:5001";
if (process.env.VITE_API_BASE_URL) {
  try {
    BACKEND_URL = new URL(process.env.VITE_API_BASE_URL).origin;
  } catch (e) {
    console.log("backend uri error");
  }
}

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  server: {
    port: 5173,
    https: {
      key: fs.readFileSync("../hr-portal-backend/localhost-key.pem"),
      cert: fs.readFileSync("../hr-portal-backend/localhost-cert.pem"),
    },
    proxy: {
      "/api": {
        target: BACKEND_URL,
        changeOrigin: true,
        cookieDomainRewrite: "localhost",
        cookiePathRewrite: { "*": "/" },
        secure: false,
        xfwd: true,
      },
    },

    headers: {
      "Content-Security-Policy": [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        `connect-src 'self' ws://localhost:5173 wss://localhost:5173 ${BACKEND_URL}`,
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
      ].join("; "),
    },
  },

  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
