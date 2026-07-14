import type { Routine, Completion, Identity } from '@/types'

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
