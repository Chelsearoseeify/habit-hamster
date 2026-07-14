import { useMemo } from 'react'
import type { Routine, Completion } from '@/types'
import { isRoutineDueOnDate, getMaxCountForRoutine } from './useCompletions'
import { getDaysInRange, getMonthStart, addDays } from '@/lib/date-utils'

/**
 * Consistency scoring — a calm "consistency over perfection" metric that lives
 * ALONGSIDE the existing streak (which is untouched in useStats).
 *
 * - Monthly consistency counts "active days" (any day with at least one
 *   completion), deliberately sidestepping the weekly/interval due-ness quirks
 *   in isRoutineDueOnDate.
 * - Per-routine reliability is a 30-day met/due ratio. `interval` routines are
 *   excluded (their due-ness is self-referential through completions) and
 *   `weekly` is approximate (reported due every day with max 1).
 */
export function useConsistency(routines: Routine[], completions: Completion[]) {
  return useMemo(() => {
    const today = new Date()

    // --- Monthly consistency (headline) ---
    const monthDays = getDaysInRange(getMonthStart(today), today)
    const daysElapsed = monthDays.length
    const daysWithCompletion = new Set(
      completions.filter((c) => c.count > 0).map((c) => c.date)
    )
    const activeDays = monthDays.filter((d) => daysWithCompletion.has(d)).length
    const monthlyConsistency =
      daysElapsed > 0 ? Math.round((activeDays / daysElapsed) * 100) : 0

    // --- Per-routine reliability (trailing 30 days) ---
    const window = getDaysInRange(addDays(today, -29), today)
    const reliability: Record<string, number | null> = {}

    for (const routine of routines) {
      if (routine.frequency.type === 'interval') {
        reliability[routine.id] = null
        continue
      }
      const maxCount = getMaxCountForRoutine(routine)
      let expected = 0
      let met = 0
      for (const date of window) {
        if (!isRoutineDueOnDate(routine, date, completions)) continue
        expected++
        const completion = completions.find(
          (c) => c.routineId === routine.id && c.date === date
        )
        if ((completion?.count ?? 0) >= maxCount) met++
      }
      reliability[routine.id] = expected > 0 ? Math.round((met / expected) * 100) : null
    }

    return {
      activeDays,
      daysElapsed,
      monthlyConsistency,
      reliability,
    }
  }, [routines, completions])
}
