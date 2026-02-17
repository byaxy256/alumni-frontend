import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
// @ts-ignore: module declaration for CSS imports is missing in this project
import "./index.css";

const applyInitialTheme = () => {
  try {
    const stored = localStorage.getItem("theme");
    const theme = stored ?? "system";
    if (!stored) localStorage.setItem("theme", theme);

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = theme === "system" ? (prefersDark ? "dark" : "light") : theme;

    const root = document.documentElement;
    root.classList.toggle("dark", resolved === "dark");
    root.dataset.theme = theme;
    root.style.colorScheme = resolved;
  } catch (error) {
    console.error("Failed to apply initial theme", error);
  }
};

const mount = () => {
  const rootElement = document.getElementById("root");
  if (!rootElement) return false;

  applyInitialTheme();
  createRoot(rootElement).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  return true;
};

// Vercel reported a runtime "Cannot read properties of null (reading 'useRef')".
// This happens when React hooks run before the dispatcher is ready, often because
// createRoot was invoked with a null container. We now wait for the root to exist
// before mounting, and fall back to DOMContentLoaded if the element isn't present yet.
if (!mount()) {
  window.addEventListener("DOMContentLoaded", () => {
    if (!mount()) {
      console.error("Root element #root not found after DOMContentLoaded. App did not mount.");
    }
  });
}
