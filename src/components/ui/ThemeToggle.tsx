import { useEffect, useState, useMemo } from "react"
import { MoonStar, SunMedium, Monitor, Check } from "lucide-react"
import { Button } from "./button"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu"

type Theme = 'light' | 'dark' | 'system'

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')
  const [mounted, setMounted] = useState(false)

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement
    const resolved = newTheme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : newTheme

    root.classList.toggle('dark', resolved === 'dark')
    root.dataset.theme = newTheme
    root.style.colorScheme = resolved
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme) {
      setTheme(savedTheme)
      applyTheme(savedTheme)
    } else {
      // Default to system theme
      applyTheme('system')
    }
    setMounted(true)

    // Keep in sync with system preference when using system mode
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemChange = () => {
      const stored = (localStorage.getItem('theme') as Theme | null) || 'system'
      if (stored === 'system') applyTheme('system')
    }
    media.addEventListener('change', handleSystemChange)
    return () => media.removeEventListener('change', handleSystemChange)
  }, [])

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  const currentIcon = useMemo(() => {
    if (theme === 'dark') return <MoonStar className="h-4 w-4" />
    if (theme === 'light') return <SunMedium className="h-4 w-4" />
    return <Monitor className="h-4 w-4" />
  }, [theme])

  const currentLabel = theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="w-9 h-9 relative"
          aria-label={`Switch theme (current: ${currentLabel})`}
          title={`Theme: ${currentLabel}`}
        >
          {currentIcon}
          <span className="sr-only">Toggle theme</span>
          <span className="absolute bottom-1 right-1 inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleThemeChange('light')}>
          <SunMedium className="mr-2 h-4 w-4" />
          Light
          {mounted && theme === 'light' && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange('dark')}>
          <MoonStar className="mr-2 h-4 w-4" />
          Dark
          {mounted && theme === 'dark' && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          System
          {mounted && theme === 'system' && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
