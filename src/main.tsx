import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { APP_VERSION, handleVersionReset } from "./lib/appState";

// ===== ANTI-CACHE VERSION RESET =====
if (!handleVersionReset(APP_VERSION)) {
  createRoot(document.getElementById("root")!).render(<App />);
}
