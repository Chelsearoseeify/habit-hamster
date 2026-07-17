import type { Routine, Completion, GamificationState, PushSubscriptionPayload, Identity, System, Reflection, Mood, HealthDataPoint } from '@/types'

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

// --- Bulk reset ---

/** Delete all history: completions, reflections, and gamification progress. */
export async function clearHistory(): Promise<void> {
  await Promise.all([
    request<void>('/completions', { method: 'DELETE' }),
    request<void>('/reflections', { method: 'DELETE' }),
    request<void>('/gamification', { method: 'DELETE' }),
  ])
}

/** Delete everything: history plus all routines. */
export async function clearAll(): Promise<void> {
  await clearHistory()
  await request<void>('/routines', { method: 'DELETE' })
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

// --- Systems ---

export function getSystems(): Promise<System[]> {
  return request<System[]>('/systems')
}

export function createSystem(system: Omit<System, 'id' | 'createdAt'>): Promise<System> {
  return request<System>('/systems', { method: 'POST', body: JSON.stringify(system) })
}

export function updateSystem(id: string, updates: Partial<Omit<System, 'id' | 'createdAt'>>): Promise<System> {
  return request<System>(`/systems/${id}`, { method: 'PATCH', body: JSON.stringify(updates) })
}

export function deleteSystem(id: string): Promise<void> {
  return request<void>(`/systems/${id}`, { method: 'DELETE' })
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

// --- Health data (Health Connect / Samsung Health) ---

export interface HealthSyncResult {
  synced: number
  completed: { routineId: string; date: string; count: number }[]
}

export function getHealthData(from?: string, to?: string): Promise<HealthDataPoint[]> {
  const qs = new URLSearchParams()
  if (from) qs.set('from', from)
  if (to) qs.set('to', to)
  const suffix = qs.toString() ? `?${qs}` : ''
  return request<HealthDataPoint[]>(`/health-data${suffix}`)
}

/** Push aggregated daily metrics; server upserts and auto-completes triggered routines. */
export function syncHealthData(points: HealthDataPoint[]): Promise<HealthSyncResult> {
  return request<HealthSyncResult>('/health-data', {
    method: 'POST',
    body: JSON.stringify(points),
  })
}

// --- Push ---

export function subscribePush(payload: PushSubscriptionPayload): Promise<void> {
  return request<void>('/push/subscribe', { method: 'POST', body: JSON.stringify(payload) })
}
