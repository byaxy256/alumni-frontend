import { useState, useEffect } from "react"
import { Sun, Moon, Monitor, Check } from "lucide-react"
import { Button } from "./button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu"

type ThemeMode = "light" | "dark" | "system"

const STORAGE_KEY = "theme"

function resolveTheme(theme: ThemeMode): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  }
  return theme
}

function applyTheme(theme: ThemeMode) {
  const resolved = resolveTheme(theme)
  const root = document.documentElement
  root.classList.toggle("dark", resolved === "dark")
  root.dataset.theme = theme
  root.style.colorScheme = resolved
}

function getStoredTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    if (saved === "light" || saved === "dark" || saved === "system") return saved
  } catch {
    // ignore
  }
  return "system"
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme)

  useEffect(() => {
    setTheme(getStoredTheme())
  }, [])

  const handleSelect = (next: ThemeMode) => {
    setTheme(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
    applyTheme(next)
  }

  const resolved = resolveTheme(theme)
  const Icon = resolved === "dark" ? Moon : Sun

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="w-9 h-9 relative"
          aria-label="Toggle theme"
          title={`Theme: ${theme === "system" ? "System" : theme === "dark" ? "Dark" : "Light"}`}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleSelect("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Light
          {theme === "light" && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSelect("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
          {theme === "dark" && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSelect("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          System
          {theme === "system" && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
