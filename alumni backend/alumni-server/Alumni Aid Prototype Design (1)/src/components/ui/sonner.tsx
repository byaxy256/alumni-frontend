"use client";

import * as React from "react";
import { Toaster as Sonner, ToasterProps } from "sonner";

// Determine the preferred theme when no explicit theme is supplied.
function detectPreferredTheme(): ToasterProps["theme"] {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";
  try {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  } catch {
    return "light";
  }
}

type Props = ToasterProps & { forceTheme?: ToasterProps["theme"] };

const Toaster = ({ forceTheme, ...props }: Props) => {
  const [resolved, setResolved] = React.useState<ToasterProps["theme"] | null>(null);

  React.useEffect(() => {
    // If a forced theme is provided, use it. Otherwise detect system preference.
    if (forceTheme) {
      setResolved(forceTheme);
      return;
    }

    const initial = detectPreferredTheme();
    setResolved(initial);

    // Listen for changes to the system color-scheme and update the toaster theme.
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent | MediaQueryList) => {
        setResolved(e.matches ? "dark" : "light");
      };
      // Some browsers use addEventListener, others support addListener
      if (typeof mq.addEventListener === "function") mq.addEventListener("change", handler as any);
      else if (typeof (mq as any).addListener === "function") (mq as any).addListener(handler as any);

      return () => {
        if (typeof mq.removeEventListener === "function") mq.removeEventListener("change", handler as any);
        else if (typeof (mq as any).removeListener === "function") (mq as any).removeListener(handler as any);
      };
    }
  }, [forceTheme]);

  // While resolving, render nothing to avoid flashing inconsistent toasts.
  if (!resolved) return null;

  return (
    <Sonner
      theme={resolved}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
