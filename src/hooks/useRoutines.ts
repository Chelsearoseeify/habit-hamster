import { useState, useEffect, useCallback } from 'react'
import type { Routine } from '@/types'
import { getRoutines, saveRoutines } from '@/lib/storage'

export function useRoutines() {
  const [routines, setRoutines] = useState<Routine[]>([])

  useEffect(() => {
    getRoutines().then(setRoutines)
  }, [])

  const addRoutine = useCallback((routine: Omit<Routine, 'id' | 'createdAt'>) => {
    const newRoutine: Routine = {
      ...routine,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    setRoutines((prev) => {
      const updated = [...prev, newRoutine]
      saveRoutines(updated)
      return updated
    })
    return newRoutine
  }, [])

  const updateRoutine = useCallback((id: string, updates: Partial<Omit<Routine, 'id' | 'createdAt'>>) => {
    setRoutines((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
      saveRoutines(updated)
      return updated
    })
  }, [])

  const deleteRoutine = useCallback((id: string) => {
    setRoutines((prev) => {
      const updated = prev.filter((r) => r.id !== id)
      saveRoutines(updated)
      return updated
    })
  }, [])

  const getRoutinesByCategory = useCallback(() => {
    const grouped: Record<string, Routine[]> = {}
    for (const routine of routines) {
      if (!grouped[routine.category]) {
        grouped[routine.category] = []
      }
      grouped[routine.category].push(routine)
    }
    for (const category in grouped) {
      grouped[category].sort((a, b) => {
        const aTime = a.timeRange?.start ?? ''
        const bTime = b.timeRange?.start ?? ''
        if (!aTime && !bTime) return 0
        if (!aTime) return 1
        if (!bTime) return -1
        return aTime.localeCompare(bTime)
      })
    }
    return grouped
  }, [routines])

  return {
    routines,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    getRoutinesByCategory,
  }
}
