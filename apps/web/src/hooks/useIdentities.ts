import { useState, useEffect, useCallback } from 'react'
import type { Identity } from '@/types'
import { getIdentities } from '@/lib/storage'
import {
  createIdentity,
  updateIdentity as apiUpdateIdentity,
  deleteIdentity as apiDeleteIdentity,
} from '@/lib/api'

export function useIdentities() {
  const [identities, setIdentities] = useState<Identity[]>([])

  useEffect(() => {
    getIdentities().then(setIdentities)
  }, [])

  const addIdentity = useCallback(async (identity: Omit<Identity, 'id' | 'createdAt'>) => {
    const newIdentity = await createIdentity(identity)
    setIdentities((prev) => [...prev, newIdentity])
    return newIdentity
  }, [])

  const updateIdentity = useCallback((id: string, updates: Partial<Omit<Identity, 'id' | 'createdAt'>>) => {
    setIdentities((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)))
    apiUpdateIdentity(id, updates).catch(console.error)
  }, [])

  const deleteIdentity = useCallback((id: string) => {
    setIdentities((prev) => prev.filter((i) => i.id !== id))
    apiDeleteIdentity(id).catch(console.error)
  }, [])

  return {
    identities,
    addIdentity,
    updateIdentity,
    deleteIdentity,
  }
}
