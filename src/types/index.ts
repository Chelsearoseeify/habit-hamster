export type FrequencyType =
  | { type: 'daily'; timesPerDay: number }
  | { type: 'weekly'; timesPerWeek: number }
  | { type: 'weekdays'; days: number[] }
  | { type: 'interval'; days: number }

export interface Routine {
  id: string
  name: string
  category: string
  frequency: FrequencyType
  timeRange?: { start: string; end?: string }
  preferredDays?: number[]
  description?: string
  createdAt: string
  paused?: boolean
}

export interface Completion {
  routineId: string
  date: string
  count: number
}

export type ViewType = 'day' | 'week' | 'month' | 'year' | 'rewards' | 'routines'

export const CATEGORIES = ['Fitness', 'Nutrition', 'Skincare', 'Supplements'] as const
export type Category = (typeof CATEGORIES)[number]

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt?: string
}

export interface GamificationState {
  xp: number
  level: number
  achievements: Achievement[]
  streakFreezes: number
}
