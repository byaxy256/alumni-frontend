import { useCallback } from "react";
import { useTheme } from "./ThemeProvider";

export function useDarkMode() {
  const { isDark, toggleDarkMode, setTheme } = useTheme();

  const setDarkMode = useCallback(
    (value: boolean) => {
      setTheme(value ? "dark" : "light");
    },
    [setTheme],
  );

  return { isDark, toggleDarkMode, setDarkMode };
}
