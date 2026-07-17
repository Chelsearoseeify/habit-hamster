import type { Routine, Completion } from '@/types'
import { addDays, formatDate, parseDate } from '@/lib/date-utils'
import { getMaxCountForRoutine, isRoutineDueOnDate } from '@/hooks/useCompletions'
import type { TimelineItem } from '@/components/views/TodayTimeline'

/**
 * The Today page splits by shape (James Clear: habits aren't clock-bound, they
 * chain). Timed routines have a real position in the day → timeline. Ongoing
 * ones (no start time) have no order → a honeycomb pool that scatters around it.
 */
export function partitionByTime(items: TimelineItem[]): {
  timed: TimelineItem[]
  ongoing: TimelineItem[]
} {
  const timed: TimelineItem[] = []
  const ongoing: TimelineItem[] = []
  for (const item of items) {
    if (item.routine.timeRange?.start) timed.push(item)
    else ongoing.push(item)
  }
  return { timed, ongoing }
}

/**
 * Consecutive completed due-days ending today, for one routine. Today counts as
 * "not yet broken" if still incomplete — the streak simply hasn't grown yet.
 */
export function routineStreak(
  routine: Routine,
  completions: Completion[],
  today: string
): number {
  let streak = 0
  let cur = parseDate(today)
  for (let checked = 0; checked < 400; checked++) {
    const ds = formatDate(cur)
    if (!isRoutineDueOnDate(routine, ds, completions)) {
      cur = addDays(cur, -1)
      continue
    }
    const done =
      (completions.find((c) => c.routineId === routine.id && c.date === ds)?.count ?? 0) >=
      getMaxCountForRoutine(routine)
    if (done) {
      streak++
      cur = addDays(cur, -1)
    } else if (ds === today) {
      cur = addDays(cur, -1) // today undone doesn't break the streak yet
    } else {
      break
    }
  }
  return streak
}

/** Stable hue from a string — same category always gets the same colour. */
function hueFor(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360
  return h
}

/**
 * Deterministic hex gradient per category (no palette in the data model yet).
 * `done` desaturates to grey so completed hexes recede, like the timeline.
 */
export function hexGradient(category: string, done: boolean): string {
  if (done) return 'linear-gradient(150deg, hsl(0 0% 90%), hsl(0 0% 82%))'
  const h = hueFor(category || 'default')
  return `linear-gradient(150deg, hsl(${h} 85% 78%), hsl(${(h + 40) % 360} 80% 70%))`
}
