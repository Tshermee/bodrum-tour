import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'bodrum-map-theme'
const EVENT = 'bodrum-map-theme-change'

// Resolve the active theme: an explicit saved choice wins; otherwise follow the
// device's system theme (so a dark-mode phone starts dark, light starts light).
function resolveTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'dark' || saved === 'light') return saved
  } catch (_) { /* ignore */ }
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches
  return prefersDark ? 'dark' : 'light'
}

/**
 * Shared map theme ('dark' | 'light'). Starts from the saved choice or the
 * system theme, and toggling persists the choice + broadcasts so every mounted
 * map (preview cards, hub, fullscreen) flips together.
 */
export function useMapTheme() {
  const [theme, setTheme] = useState(resolveTheme)

  useEffect(() => {
    const sync = () => setTheme(resolveTheme())
    window.addEventListener(EVENT, sync)
    // Also follow live system-theme changes when the user hasn't overridden.
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    mq?.addEventListener?.('change', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      mq?.removeEventListener?.('change', sync)
    }
  }, [])

  const toggle = useCallback(() => {
    const next = resolveTheme() === 'dark' ? 'light' : 'dark'
    try { localStorage.setItem(STORAGE_KEY, next) } catch (_) { /* ignore */ }
    window.dispatchEvent(new Event(EVENT))
  }, [])

  return { theme, toggle }
}
