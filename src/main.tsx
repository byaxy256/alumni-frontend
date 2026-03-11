import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
// @ts-ignore: module declaration for CSS imports is missing in this project
import "./index.css";

type ThemeMode = "light" | "dark" | "system";

const resolveTheme = (theme: ThemeMode): "light" | "dark" => {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
};

const applyTheme = (theme: ThemeMode) => {
  try {
    const resolved = resolveTheme(theme);

    const root = document.documentElement;
    root.classList.toggle("dark", resolved === "dark");
    root.dataset.theme = theme;
    root.style.colorScheme = resolved;
  } catch (error) {
    console.error("Failed to apply theme", error);
  }
};

const getInitialTheme = (): ThemeMode => {
  try {
    localStorage.setItem("theme", "system");
    localStorage.removeItem("themePreferenceSet");
  } catch (error) {
    console.error("Failed to persist theme preference", error);
  }
  return "system";
};

const mount = () => {
  const rootElement = document.getElementById("root");
  if (!rootElement) return false;

  applyTheme(getInitialTheme());
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
    applyTheme("system");
  };

  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", handleSystemChange);
  } else if (typeof media.addListener === "function") {
    media.addListener(handleSystemChange);
  }

  const handleVisibilityOrFocus = () => {
    applyTheme("system");
  };

  document.addEventListener("visibilitychange", handleVisibilityOrFocus);
  window.addEventListener("focus", handleVisibilityOrFocus);
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
