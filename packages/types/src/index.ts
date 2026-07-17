export type FrequencyType =
  | { type: 'daily'; timesPerDay: number }
  | { type: 'weekly'; timesPerWeek: number }
  | { type: 'weekdays'; days: number[] }
  | { type: 'interval'; days: number }

/** Health Connect / Samsung Health metrics we sync and aggregate per day. */
export type HealthMetric = 'steps' | 'distance_m' | 'exercise_min' | 'sleep_min'

/**
 * Links a routine to a health metric so it auto-completes when the day's synced
 * value reaches the threshold. E.g. { metric: 'steps', threshold: 8000 } marks a
 * "Walk" routine done once Health Connect reports 8000 steps for that date.
 */
export interface HealthTrigger {
  metric: HealthMetric
  threshold: number
}

/** One aggregated metric value for one day, synced from Health Connect. */
export interface HealthDataPoint {
  date: string
  metric: HealthMetric
  value: number
}

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
  healthTrigger?: HealthTrigger | null
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

/** 'count' = complete at least ruleCount members; 'all' = complete every member. */
export type SystemRuleType = 'count' | 'all'

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
  /** 'count' = at least ruleCount members; 'all' = every member. Default 'count'. */
  ruleType: SystemRuleType
  /** How many member completions satisfy the system (when ruleType='count'). Default 1. */
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
