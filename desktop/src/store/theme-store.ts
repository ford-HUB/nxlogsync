import { create } from 'zustand'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'nxlogsync-theme'

function readTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // Storage unavailable; fall back to the OS preference.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initial = readTheme()
// Applied on import so the first paint already has the right palette.
applyTheme(initial)

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initial,
  setTheme: (theme) => {
    applyTheme(theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Not persisted; the choice still holds for this session.
    }
    set({ theme })
  },
}))
