import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
// @ts-ignore: module declaration for CSS imports is missing in this project
import "./index.css";

type ThemeMode = "light" | "dark" | "system";

const applyThemeFromStorage = () => {
  try {
    const stored = localStorage.getItem("theme");
    const isValid = stored === "light" || stored === "dark" || stored === "system";
    const hasManualPreference = localStorage.getItem("themePreferenceSet") === "1";
    const theme: ThemeMode =
      isValid && hasManualPreference ? (stored as ThemeMode) : "system";

    if (stored !== theme) localStorage.setItem("theme", theme);

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

  applyThemeFromStorage();
  createRoot(rootElement).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  return true;
};

// Keep theme in sync with system changes when using "system"
try {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const handleSystemChange = () => {
    const stored = localStorage.getItem("theme");
    const hasManualPreference = localStorage.getItem("themePreferenceSet") === "1";
    const theme: ThemeMode =
      stored === "light" || stored === "dark" || stored === "system"
        ? hasManualPreference
          ? stored
          : "system"
        : "system";
    if (stored !== theme) localStorage.setItem("theme", theme);
    if (theme === "system") applyThemeFromStorage();
  };
  media.addEventListener("change", handleSystemChange);
} catch (error) {
  console.error("Failed to watch system theme changes", error);
}

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
