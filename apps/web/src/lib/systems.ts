import type { System, Routine, Completion } from '@/types'
import { getToday, getWeekStart, getDaysInRange, parseDate } from '@/lib/date-utils'

/** Routines that are members of (equivalent ways to satisfy) a system. */
export function systemMembers(systemId: string, routines: Routine[]): Routine[] {
  return routines.filter((r) => r.systemId === systemId)
}

export interface SystemStatus {
  /** Member completions counted in the current period (sessions). */
  done: number
  /** ruleCount, clamped to >= 1. */
  target: number
  satisfied: boolean
  /** "today" | "this week" — for display. */
  periodLabel: string
  /** Member routine ids with at least one completion in the period. */
  doneMemberIds: Set<string>
}

/**
 * Is a system satisfied right now? A system is a rule: complete >= ruleCount of
 * its members within the period. Members are equivalent — any of them counts.
 */
export function systemStatus(
  system: System,
  members: Routine[],
  completions: Completion[]
): SystemStatus {
  const today = getToday()
  let window: Set<string>
  let periodLabel: string
  if (system.rulePeriod === 'week') {
    const days = getDaysInRange(getWeekStart(parseDate(today)), parseDate(today))
    window = new Set(days)
    periodLabel = 'this week'
  } else {
    window = new Set([today])
    periodLabel = 'today'
  }

  const memberIds = new Set(members.map((m) => m.id))
  const doneMemberIds = new Set<string>()
  let done = 0
  for (const c of completions) {
    if (c.count > 0 && memberIds.has(c.routineId) && window.has(c.date)) {
      done++
      doneMemberIds.add(c.routineId)
    }
  }

  const target = Math.max(1, system.ruleCount)
  return { done, target, satisfied: done >= target, periodLabel, doneMemberIds }
}

/** Plain-language rule, e.g. "Do any one today" / "Do 3 this week". */
export function ruleText(system: System): string {
  const target = Math.max(1, system.ruleCount)
  const period = system.rulePeriod === 'week' ? 'this week' : 'today'
  return target === 1 ? `Do any one ${period}` : `Do ${target} ${period}`
}
