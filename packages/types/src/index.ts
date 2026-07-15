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
  identityId?: string | null
  systemId?: string | null
}

export interface Completion {
  routineId: string
  date: string
  count: number
}

/** An identity the user is voting for through their routines (Atomic Habits). */
export interface Identity {
  id: string
  name: string
  statement?: string
  createdAt: string
}

export type SystemRulePeriod = 'day' | 'week'

/**
 * A repeatable system that serves an identity — the layer between Identity and
 * Routine (Identity → System → Routine → Completion). "Systems over goals."
 *
 * A system is a RULE, not a folder: it is satisfied when at least `ruleCount` of
 * its member routines are completed within `rulePeriod`. Members are equivalent
 * ways to satisfy it ("move once today" — Gym OR Run OR Yoga), so completing one
 * is enough and the rest become optional.
 */
export interface System {
  id: string
  name: string
  description?: string
  identityId?: string | null
  /** How many member completions satisfy the system in a period. Default 1. */
  ruleCount: number
  /** The window the rule is measured over. Default 'day'. */
  rulePeriod: SystemRulePeriod
  createdAt: string
}

export type Mood = 'good' | 'neutral' | 'bad'

/** One reflection per day: how the day felt, plus an optional note. */
export interface Reflection {
  date: string
  mood: Mood
  note?: string
}

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

export interface PushSubscriptionPayload {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}
