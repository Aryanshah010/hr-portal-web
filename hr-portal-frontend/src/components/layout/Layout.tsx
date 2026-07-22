import { Sidebar } from "./Sidebar.js";
import { Navbar } from "./Navbar.js";
import { Outlet } from "react-router-dom";

export function Layout() {
  return (
    <div
      style={{
        display: "flex",
        height: "100dvh",
        backgroundColor: "var(--color-bg, #0f1117)",
        color: "var(--color-text, #f8fafc)",
      }}
    >
      <Sidebar />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <Navbar />
        <main style={{ flex: 1, overflowY: "auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
