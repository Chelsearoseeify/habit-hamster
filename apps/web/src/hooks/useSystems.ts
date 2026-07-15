import { useState, useEffect, useCallback } from 'react'
import type { System } from '@/types'
import { getSystems } from '@/lib/storage'
import {
  createSystem,
  updateSystem as apiUpdateSystem,
  deleteSystem as apiDeleteSystem,
} from '@/lib/api'

export function useSystems() {
  const [systems, setSystems] = useState<System[]>([])

  useEffect(() => {
    getSystems().then(setSystems)
  }, [])

  const addSystem = useCallback(async (system: Omit<System, 'id' | 'createdAt'>) => {
    const newSystem = await createSystem(system)
    setSystems((prev) => [...prev, newSystem])
    return newSystem
  }, [])

  const updateSystem = useCallback((id: string, updates: Partial<Omit<System, 'id' | 'createdAt'>>) => {
    setSystems((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)))
    apiUpdateSystem(id, updates).catch(console.error)
  }, [])

  const deleteSystem = useCallback((id: string) => {
    setSystems((prev) => prev.filter((s) => s.id !== id))
    apiDeleteSystem(id).catch(console.error)
  }, [])

  return {
    systems,
    addSystem,
    updateSystem,
    deleteSystem,
  }
}
