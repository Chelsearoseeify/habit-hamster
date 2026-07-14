import { useState, useEffect, useCallback } from 'react'
import type { Routine } from '@/types'
import { getRoutines, createRoutine, updateRoutine as apiUpdateRoutine, deleteRoutine as apiDeleteRoutine } from '@/lib/api'

export function useRoutines() {
  const [routines, setRoutines] = useState<Routine[]>([])

  useEffect(() => {
    getRoutines().then(setRoutines)
  }, [])

  const addRoutine = useCallback(async (routine: Omit<Routine, 'id' | 'createdAt'>) => {
    const newRoutine = await createRoutine(routine)
    setRoutines((prev) => [...prev, newRoutine])
    return newRoutine
  }, [])

  const updateRoutine = useCallback((id: string, updates: Partial<Omit<Routine, 'id' | 'createdAt'>>) => {
    setRoutines((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)))
    apiUpdateRoutine(id, updates).catch(console.error)
  }, [])

  const deleteRoutine = useCallback((id: string) => {
    setRoutines((prev) => prev.filter((r) => r.id !== id))
    apiDeleteRoutine(id).catch(console.error)
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
