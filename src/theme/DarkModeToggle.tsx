import React from "react";
import { MoonStar, SunMedium } from "lucide-react";

import { Button } from "../components/ui/button";
import { cn } from "../components/ui/utils";
import { useTheme } from "./ThemeProvider";

type DarkModeToggleProps = {
  className?: string;
  showLabel?: boolean;
};

export function DarkModeToggle({ className, showLabel = false }: DarkModeToggleProps) {
  const { isDark, toggleDarkMode } = useTheme();

  return (
    <Button
      type="button"
      variant={showLabel ? "outline" : "ghost"}
      size={showLabel ? "default" : "icon"}
      onClick={toggleDarkMode}
      className={cn(showLabel ? "gap-2" : "text-foreground", className)}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
      {showLabel ? (isDark ? "Light" : "Dark") : null}
    </Button>
  );
}
