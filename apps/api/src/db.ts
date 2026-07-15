import { createClient } from '@libsql/client'
import type { Routine, Completion, GamificationState, Identity, System, SystemRulePeriod, SystemRuleType, Reflection, Mood } from '@habit-hamster/types'

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

export function rowToRoutine(row: Record<string, unknown>): Routine {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as string,
    frequency: JSON.parse(row.frequency as string),
    timeRange: row.time_range ? JSON.parse(row.time_range as string) : undefined,
    preferredDays: row.preferred_days ? JSON.parse(row.preferred_days as string) : undefined,
    description: (row.description as string) ?? undefined,
    createdAt: row.created_at as string,
    paused: (row.paused as number) === 1,
    identityId: (row.identity_id as string) ?? undefined,
    systemId: (row.system_id as string) ?? undefined,
  }
}

export function rowToIdentity(row: Record<string, unknown>): Identity {
  return {
    id: row.id as string,
    name: row.name as string,
    statement: (row.statement as string) ?? undefined,
    createdAt: row.created_at as string,
  }
}

export function rowToSystem(row: Record<string, unknown>): System {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? undefined,
    identityId: (row.identity_id as string) ?? undefined,
    ruleType: ((row.rule_type as string) ?? 'count') as SystemRuleType,
    ruleCount: (row.rule_count as number) ?? 1,
    rulePeriod: ((row.rule_period as string) ?? 'day') as SystemRulePeriod,
    createdAt: row.created_at as string,
  }
}

export function rowToReflection(row: Record<string, unknown>): Reflection {
  return {
    date: row.date as string,
    mood: row.mood as Mood,
    note: (row.note as string) ?? undefined,
  }
}

export function rowToCompletion(row: Record<string, unknown>): Completion {
  return {
    routineId: row.routine_id as string,
    date: row.date as string,
    count: row.count as number,
  }
}

export function rowToGamification(row: Record<string, unknown>): GamificationState {
  return {
    xp: row.xp as number,
    level: row.level as number,
    achievements: JSON.parse(row.achievements as string),
    streakFreezes: row.streak_freezes as number,
  }
}
