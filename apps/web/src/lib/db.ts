import Dexie, { type Table } from 'dexie'
import type { Routine, Completion, GamificationState } from '@/types'

interface PerfectDayBonus {
  date: string
}

type StoredGamificationState = GamificationState & { id: 'current' }

class HabitHamsterDB extends Dexie {
  routines!: Table<Routine>
  completions!: Table<Completion>
  gamification!: Table<StoredGamificationState>
  perfectDayBonuses!: Table<PerfectDayBonus>

  constructor() {
    super('HabitHamsterDB')
    this.version(1).stores({
      routines: 'id',
      completions: '[routineId+date], date',
      gamification: 'id',
      perfectDayBonuses: 'date',
    })
  }
}

export const db = new HabitHamsterDB()

const DEFAULT_GAMIFICATION_STATE: GamificationState = {
  xp: 0,
  level: 1,
  achievements: [],
  streakFreezes: 0,
}

const DEFAULT_ROUTINES: Omit<Routine, 'id' | 'createdAt'>[] = [
  {
    name: 'Gym',
    category: 'Fitness',
    frequency: { type: 'weekly', timesPerWeek: 3 },
    timeRange: { start: '07:00', end: '08:30' },
    preferredDays: [1, 3, 5],
  },
  {
    name: 'Run',
    category: 'Fitness',
    frequency: { type: 'weekly', timesPerWeek: 2 },
    timeRange: { start: '18:00', end: '18:30' },
    preferredDays: [3, 7],
  },
  {
    name: '5000 steps',
    category: 'Fitness',
    frequency: { type: 'daily', timesPerDay: 1 },
  },
  {
    name: 'Clean eating',
    category: 'Nutrition',
    frequency: { type: 'daily', timesPerDay: 1 },
  },
  {
    name: 'Meal prep',
    category: 'Nutrition',
    frequency: { type: 'weekly', timesPerWeek: 1 },
    preferredDays: [7],
    timeRange: { start: '11:00', end: '13:00' },
  },
  {
    name: 'Water 1.5L',
    category: 'Nutrition',
    frequency: { type: 'daily', timesPerDay: 1 },
  },
  {
    name: 'Morning Skin care',
    category: 'Skincare',
    description: 'Vitamin C serum, moisturizer, sunscreen',
    frequency: { type: 'daily', timesPerDay: 1 },
    timeRange: { start: '08:30', end: '08:45' },
  },
  {
    name: 'Evening Skin care',
    category: 'Skincare',
    description: 'Cleanser, retinol, moisturizer',
    frequency: { type: 'daily', timesPerDay: 1 },
    timeRange: { start: '22:30', end: '22:45' },
  },
  {
    name: 'Micro current',
    category: 'Skincare',
    frequency: { type: 'daily', timesPerDay: 1 },
    timeRange: { start: '08:30', end: '08:45' },
  },
  {
    name: 'Luce pulsata',
    category: 'Skincare',
    frequency: { type: 'weekly', timesPerWeek: 1 },
    timeRange: { start: '11:00', end: '11:30' },
  },
  {
    name: 'Hair dye - root',
    category: 'Skincare',
    frequency: { type: 'interval', days: 45 },
    preferredDays: [6],
  },
  {
    name: 'Bromelina',
    category: 'Supplements',
    frequency: { type: 'daily', timesPerDay: 2 },
    timeRange: { start: '09:00' },
  },
  {
    name: 'Centella asiatica',
    category: 'Supplements',
    frequency: { type: 'daily', timesPerDay: 1 },
    timeRange: { start: '09:00' },
  },
  {
    name: 'Dbase',
    category: 'Supplements',
    frequency: { type: 'daily', timesPerDay: 1 },
    timeRange: { start: '09:00' },
  },
  {
    name: 'B12',
    category: 'Supplements',
    frequency: { type: 'daily', timesPerDay: 1 },
    timeRange: { start: '09:00' },
  },
]

// One-time migration from localStorage + first-run seeding
db.on('ready', async () => {
  const count = await db.routines.count()
  if (count > 0) return

  const rawRoutines = localStorage.getItem('habit-hamster-routines')
  if (rawRoutines) {
    // Migrate existing localStorage data into Dexie
    const routines: Routine[] = JSON.parse(rawRoutines)
    await db.routines.bulkPut(routines)

    const rawCompletions = localStorage.getItem('habit-hamster-completions')
    if (rawCompletions) {
      await db.completions.bulkPut(JSON.parse(rawCompletions))
    }

    const rawGamification = localStorage.getItem('habit-hamster-gamification')
    if (rawGamification) {
      const gState: GamificationState = JSON.parse(rawGamification)
      await db.gamification.put({ ...gState, id: 'current' })
    }

    // Migrate per-day perfect-bonus keys
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('habit-hamster-perfect-bonus-')) {
        const date = key.replace('habit-hamster-perfect-bonus-', '')
        await db.perfectDayBonuses.put({ date })
        localStorage.removeItem(key)
      }
    }

    // Clean up old localStorage keys
    localStorage.removeItem('habit-hamster-routines')
    localStorage.removeItem('habit-hamster-completions')
    localStorage.removeItem('habit-hamster-gamification')
  } else {
    // Fresh install — seed default routines
    const now = new Date().toISOString()
    await db.routines.bulkPut(
      DEFAULT_ROUTINES.map((r) => ({
        ...r,
        id: crypto.randomUUID(),
        createdAt: now,
      }))
    )
  }
})

// --- Routines ---

export async function getRoutines(): Promise<Routine[]> {
  return db.routines.toArray()
}

export async function saveRoutines(routines: Routine[]): Promise<void> {
  const existingIds = await db.routines.toCollection().primaryKeys() as string[]
  const newIds = new Set(routines.map((r) => r.id))
  const toDelete = existingIds.filter((id) => !newIds.has(id))
  await db.transaction('rw', db.routines, async () => {
    await db.routines.bulkPut(routines)
    if (toDelete.length > 0) await db.routines.bulkDelete(toDelete)
  })
}

// --- Completions ---

export async function getCompletions(): Promise<Completion[]> {
  return db.completions.toArray()
}

export async function saveCompletions(completions: Completion[]): Promise<void> {
  const existing = await db.completions.toArray()
  const newKeys = new Set(completions.map((c) => `${c.routineId}|${c.date}`))
  const toDelete = existing
    .filter((c) => !newKeys.has(`${c.routineId}|${c.date}`))
    .map((c) => [c.routineId, c.date] as [string, string])
  await db.transaction('rw', db.completions, async () => {
    await db.completions.bulkPut(completions)
    if (toDelete.length > 0) await db.completions.bulkDelete(toDelete)
  })
}

// --- Gamification ---

export async function getGamificationState(): Promise<GamificationState> {
  const stored = await db.gamification.get('current')
  return stored ?? { ...DEFAULT_GAMIFICATION_STATE }
}

export async function saveGamificationState(state: GamificationState): Promise<void> {
  await db.gamification.put({ ...state, id: 'current' })
}

// --- Perfect day bonus ---

export async function getPerfectDayBonus(date: string): Promise<boolean> {
  const record = await db.perfectDayBonuses.get(date)
  return record !== undefined
}

export async function setPerfectDayBonus(date: string): Promise<void> {
  await db.perfectDayBonuses.put({ date })
}
