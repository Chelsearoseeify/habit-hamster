import { useCallback, useEffect, useState } from 'react'

const KEY = 'hh:user-name'

/**
 * The name used in the homepage greeting ("Good morning, Sele").
 * Stored locally — it's a personal touch, not shared data. Empty string means
 * "no name yet", and the greeting falls back to a nameless form.
 */
export function useUserName() {
  const [name, setName] = useState('')

  useEffect(() => {
    try {
      setName(localStorage.getItem(KEY) ?? '')
    } catch {
      // localStorage unavailable (private mode, etc.) — greeting stays nameless.
    }
  }, [])

  const updateName = useCallback((value: string) => {
    const trimmed = value.trim()
    setName(trimmed)
    try {
      if (trimmed) localStorage.setItem(KEY, trimmed)
      else localStorage.removeItem(KEY)
    } catch {
      // Ignore write failures; the in-memory value still drives this session.
    }
  }, [])

  return { name, setName: updateName }
}

/** Time-of-day greeting word based on the current local hour. */
export function greetingFor(date: Date): string {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
