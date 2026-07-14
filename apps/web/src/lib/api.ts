import type { Routine, Completion, GamificationState, PushSubscriptionPayload, Identity, Reflection, Mood } from '@/types'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// --- Routines ---

export function getRoutines(): Promise<Routine[]> {
  return request<Routine[]>('/routines')
}

export function createRoutine(routine: Omit<Routine, 'id' | 'createdAt'>): Promise<Routine> {
  return request<Routine>('/routines', { method: 'POST', body: JSON.stringify(routine) })
}

export function updateRoutine(id: string, updates: Partial<Omit<Routine, 'id' | 'createdAt'>>): Promise<Routine> {
  return request<Routine>(`/routines/${id}`, { method: 'PATCH', body: JSON.stringify(updates) })
}

export function deleteRoutine(id: string): Promise<void> {
  return request<void>(`/routines/${id}`, { method: 'DELETE' })
}

// --- Completions ---

export function getCompletions(): Promise<Completion[]> {
  return request<Completion[]>('/completions')
}

export function upsertCompletion(routineId: string, date: string, count: number): Promise<void> {
  return request<void>(`/completions/${routineId}/${date}`, {
    method: 'PUT',
    body: JSON.stringify({ count }),
  })
}

export function removeCompletion(routineId: string, date: string): Promise<void> {
  return request<void>(`/completions/${routineId}/${date}`, { method: 'DELETE' })
}

// --- Gamification ---

export function getGamificationState(): Promise<GamificationState> {
  return request<GamificationState>('/gamification')
}

export function saveGamificationState(state: GamificationState): Promise<void> {
  return request<void>('/gamification', { method: 'PUT', body: JSON.stringify(state) })
}

export function getPerfectDayBonus(date: string): Promise<boolean> {
  return request<{ awarded: boolean }>(`/gamification/perfect-day/${date}`).then((r) => r.awarded)
}

export function setPerfectDayBonus(date: string): Promise<void> {
  return request<void>(`/gamification/perfect-day/${date}`, { method: 'POST' })
}

// --- Identities ---

export function getIdentities(): Promise<Identity[]> {
  return request<Identity[]>('/identities')
}

export function createIdentity(identity: Omit<Identity, 'id' | 'createdAt'>): Promise<Identity> {
  return request<Identity>('/identities', { method: 'POST', body: JSON.stringify(identity) })
}

export function updateIdentity(id: string, updates: Partial<Omit<Identity, 'id' | 'createdAt'>>): Promise<Identity> {
  return request<Identity>(`/identities/${id}`, { method: 'PATCH', body: JSON.stringify(updates) })
}

export function deleteIdentity(id: string): Promise<void> {
  return request<void>(`/identities/${id}`, { method: 'DELETE' })
}

// --- Reflections ---

export function getReflections(): Promise<Reflection[]> {
  return request<Reflection[]>('/reflections')
}

export function upsertReflection(date: string, mood: Mood, note?: string): Promise<void> {
  return request<void>(`/reflections/${date}`, {
    method: 'PUT',
    body: JSON.stringify({ mood, note }),
  })
}

export function removeReflection(date: string): Promise<void> {
  return request<void>(`/reflections/${date}`, { method: 'DELETE' })
}

// --- Push ---

export function subscribePush(payload: PushSubscriptionPayload): Promise<void> {
  return request<void>('/push/subscribe', { method: 'POST', body: JSON.stringify(payload) })
}
