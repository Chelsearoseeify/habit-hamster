import type { Routine, Completion } from '@/types'
import { getMaxCountForRoutine, isRoutineDueOnDate } from '@/hooks/useCompletions'
import { addDays, getDayOfWeek, getDaysInRange, getWeekStart, parseDate } from '@/lib/date-utils'

const WEEKDAY_FULL = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

type Bucket = { met: number; expected: number }

function rate(b: Bucket): number {
  return b.expected > 0 ? Math.round((b.met / b.expected) * 100) : 0
}

/**
 * Interpret the last 30 days of activity into a few calm, human sentences.
 * Statistics create noise; insights create awareness. Rules only fire when they
 * clear a minimum sample threshold, and the result is capped at 3 lines.
 */
export function generateInsights(routines: Routine[], completions: Completion[]): string[] {
  const insights: string[] = []
  const today = new Date()
  // Trailing 30-day window as local-time date strings.
  const days = getDaysInRange(addDays(today, -29), today)

  const completionFor = (routineId: string, date: string) =>
    completions.find((c) => c.routineId === routineId && c.date === date)

  // --- Time-of-day strength ---
  const timeBuckets: Record<'Morning' | 'Afternoon' | 'Evening', Bucket> = {
    Morning: { met: 0, expected: 0 },
    Afternoon: { met: 0, expected: 0 },
    Evening: { met: 0, expected: 0 },
  }
  for (const routine of routines) {
    if (!routine.timeRange?.start) continue
    const hour = Number(routine.timeRange.start.split(':')[0])
    const bucket = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening'
    const maxCount = getMaxCountForRoutine(routine)
    for (const date of days) {
      if (!isRoutineDueOnDate(routine, date, completions)) continue
      timeBuckets[bucket].expected++
      if ((completionFor(routine.id, date)?.count ?? 0) >= maxCount) timeBuckets[bucket].met++
    }
  }
  const bestTime = (Object.entries(timeBuckets) as [string, Bucket][])
    .filter(([, b]) => b.expected >= 10)
    .sort((a, b) => rate(b[1]) - rate(a[1]))[0]
  if (bestTime && rate(bestTime[1]) >= 50) {
    insights.push(`${bestTime[0]} routines are your strongest (${rate(bestTime[1])}%).`)
  }

  // --- Weekday reliability for a single routine ---
  let bestWeekday: { name: string; weekday: number; rate: number } | null = null
  for (const routine of routines) {
    const maxCount = getMaxCountForRoutine(routine)
    const byWeekday: Record<number, Bucket> = {}
    for (const date of days) {
      if (!isRoutineDueOnDate(routine, date, completions)) continue
      const wd = getDayOfWeek(parseDate(date))
      byWeekday[wd] ??= { met: 0, expected: 0 }
      byWeekday[wd].expected++
      if ((completionFor(routine.id, date)?.count ?? 0) >= maxCount) byWeekday[wd].met++
    }
    for (const [wd, b] of Object.entries(byWeekday)) {
      if (b.expected < 3) continue
      const r = rate(b)
      if (r >= 90 && (!bestWeekday || r > bestWeekday.rate)) {
        bestWeekday = { name: routine.name, weekday: Number(wd), rate: r }
      }
    }
  }
  if (bestWeekday) {
    insights.push(`You almost never miss ${bestWeekday.name} on ${WEEKDAY_FULL[bestWeekday.weekday]}s.`)
  }

  // --- Best category ---
  const byCategory: Record<string, Bucket> = {}
  for (const routine of routines) {
    const maxCount = getMaxCountForRoutine(routine)
    byCategory[routine.category] ??= { met: 0, expected: 0 }
    for (const date of days) {
      if (!isRoutineDueOnDate(routine, date, completions)) continue
      byCategory[routine.category].expected++
      if ((completionFor(routine.id, date)?.count ?? 0) >= maxCount) byCategory[routine.category].met++
    }
  }
  const bestCategory = Object.entries(byCategory)
    .filter(([, b]) => b.expected >= 15)
    .sort((a, b) => rate(b[1]) - rate(a[1]))[0]
  if (bestCategory && rate(bestCategory[1]) >= 60) {
    insights.push(`${bestCategory[0]} is your most consistent category.`)
  }

  // --- Momentum: active days this week vs last week ---
  const activeDates = new Set(completions.filter((c) => c.count > 0).map((c) => c.date))
  const weekStart = getWeekStart(today)
  const lastWeekStart = addDays(weekStart, -7)
  const countActive = (start: Date, end: Date) => {
    let n = 0
    for (let cur = new Date(start); cur < end; cur = addDays(cur, 1)) {
      const y = cur.getFullYear()
      const m = String(cur.getMonth() + 1).padStart(2, '0')
      const dd = String(cur.getDate()).padStart(2, '0')
      if (activeDates.has(`${y}-${m}-${dd}`)) n++
    }
    return n
  }
  const thisWeek = countActive(weekStart, addDays(today, 1))
  const lastWeek = countActive(lastWeekStart, weekStart)
  if (lastWeek > 0 && thisWeek > lastWeek) {
    insights.push(`You're showing up more than last week.`)
  }

  return insights.slice(0, 3)
}
