import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ThemeMode = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleDarkMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveTheme(theme: ThemeMode): "light" | "dark" {
  if (theme !== "system") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  const resolved = resolveTheme(theme);

  root.classList.toggle("dark", resolved === "dark");
  root.dataset.theme = theme;
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("system");

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setTheme(resolveTheme(theme) === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as ThemeMode | null) ?? "system";
    setThemeState(saved);
    applyTheme(saved);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      const stored = (localStorage.getItem("theme") as ThemeMode | null) ?? "system";
      if (stored === "system") applyTheme("system");
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key !== "theme") return;
      const stored = (localStorage.getItem("theme") as ThemeMode | null) ?? "system";
      setThemeState(stored);
      applyTheme(stored);
    };

    media.addEventListener("change", handleSystemChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      media.removeEventListener("change", handleSystemChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const resolvedTheme = useMemo(() => resolveTheme(theme), [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      isDark: resolvedTheme === "dark",
      setTheme,
      toggleDarkMode,
    }),
    [theme, resolvedTheme, setTheme, toggleDarkMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a <ThemeProvider />");
  return ctx;
}
