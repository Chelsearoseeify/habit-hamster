import type { Routine, Completion, Identity } from '@/types'
import {
  isRoutineDueOnDate,
  getMaxCountForRoutine,
} from '@/hooks/useCompletions'

/**
 * How much of an identity you've lived up to *today*: the share of its
 * due-today routines that are complete. This is the "becoming that person"
 * meter — not a running score, but "am I being this today?". Returns 0/0/0
 * when nothing is due, so callers can hide the meter on rest days.
 */
export function identityTodayProgress(
  identityId: string,
  routines: Routine[],
  completions: Completion[],
  today: string
): { completed: number; total: number; percentage: number } {
  const due = routines.filter(
    (r) => r.identityId === identityId && isRoutineDueOnDate(r, today, completions)
  )
  if (due.length === 0) return { completed: 0, total: 0, percentage: 0 }
  const completed = due.filter((r) => {
    const c = completions.find((x) => x.routineId === r.id && x.date === today)
    return (c?.count ?? 0) >= getMaxCountForRoutine(r)
  }).length
  return {
    completed,
    total: due.length,
    percentage: Math.round((completed / due.length) * 100),
  }
}

/**
 * Total "votes" cast for an identity: the sum of completion counts across all
 * routines linked to it. Each completion is evidence of becoming that person;
 * multi-count completions (e.g. 2/2 supplements) count as multiple votes.
 */
export function votesForIdentity(
  identityId: string,
  routines: Routine[],
  completions: Completion[]
): number {
  const routineIds = new Set(
    routines.filter((r) => r.identityId === identityId).map((r) => r.id)
  )
  if (routineIds.size === 0) return 0
  return completions.reduce(
    (sum, c) => (routineIds.has(c.routineId) ? sum + c.count : sum),
    0
  )
}

/** Votes per identity, keyed by identity id, for batch display. */
export function votesByIdentity(
  identities: Identity[],
  routines: Routine[],
  completions: Completion[]
): Record<string, number> {
  const result: Record<string, number> = {}
  for (const identity of identities) {
    result[identity.id] = votesForIdentity(identity.id, routines, completions)
  }
  return result
}
