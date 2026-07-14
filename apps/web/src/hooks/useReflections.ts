import { useState, useEffect, useCallback } from 'react'
import type { Reflection, Mood } from '@/types'
import { getReflections } from '@/lib/storage'
import { upsertReflection, removeReflection as apiRemoveReflection } from '@/lib/api'

export function useReflections() {
  const [reflections, setReflections] = useState<Reflection[]>([])

  useEffect(() => {
    getReflections().then(setReflections)
  }, [])

  const getReflectionForDate = useCallback(
    (date: string): Reflection | undefined => reflections.find((r) => r.date === date),
    [reflections]
  )

  const setReflection = useCallback((date: string, mood: Mood, note?: string) => {
    setReflections((prev) => {
      const existing = prev.find((r) => r.date === date)
      if (existing) {
        return prev.map((r) => (r.date === date ? { ...r, mood, note } : r))
      }
      return [...prev, { date, mood, note }]
    })
    upsertReflection(date, mood, note).catch(console.error)
  }, [])

  const removeReflection = useCallback((date: string) => {
    setReflections((prev) => prev.filter((r) => r.date !== date))
    apiRemoveReflection(date).catch(console.error)
  }, [])

  return {
    reflections,
    getReflectionForDate,
    setReflection,
    removeReflection,
  }
}
