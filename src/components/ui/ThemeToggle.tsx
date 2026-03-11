import { useEffect } from "react"
import { Monitor } from "lucide-react"
import { Button } from "./button"

export function ThemeToggle() {
  useEffect(() => {
    const root = document.documentElement
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const resolved = prefersDark ? "dark" : "light"

    root.classList.toggle("dark", resolved === "dark")
    root.dataset.theme = "system"
    root.style.colorScheme = resolved
  }, [])

  return (
    <Button
      variant="outline"
      size="icon"
      className="w-9 h-9 relative"
      aria-label="Theme is set to system"
      title="Theme: System (follows device)"
      disabled
    >
      <Monitor className="h-4 w-4" />
      <span className="sr-only">Theme is locked to system</span>
      <span
        className="absolute bottom-1 right-1 inline-block h-1.5 w-1.5 rounded-full bg-primary"
        aria-hidden
      />
    </Button>
  )
}
