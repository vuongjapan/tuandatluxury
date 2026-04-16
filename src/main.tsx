import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ===== ANTI-CACHE VERSION RESET =====
const APP_VERSION = "3.0.0";
const storedVersion = localStorage.getItem("app_version");

if (storedVersion !== APP_VERSION) {
  console.log("🔄 Reset app – version mismatch");
  // Preserve auth token before clearing
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem("app_version", APP_VERSION);
  window.location.reload();
} else {
  // Clear old data caches that might be stale
  localStorage.removeItem("rooms");
  localStorage.removeItem("pricing");
  localStorage.removeItem("services");
  localStorage.removeItem("gallery");

  createRoot(document.getElementById("root")!).render(<App />);
}
