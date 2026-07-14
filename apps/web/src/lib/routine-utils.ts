import type { Routine, Completion } from '@/types'
import { addDays, formatDate, getDayOfWeek, parseDate } from '@/lib/date-utils'

export const WEEKDAY_NAMES = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const WEEKDAY_FULL = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function formatFrequency(routine: Routine): string {
  const { frequency } = routine
  switch (frequency.type) {
    case 'daily':
      return frequency.timesPerDay === 1 ? 'Every day' : `${frequency.timesPerDay}× per day`
    case 'weekly':
      return `${frequency.timesPerWeek}× per week`
    case 'weekdays':
      return frequency.days.map((d) => WEEKDAY_NAMES[d]).join(', ')
    case 'interval':
      return `Every ${frequency.days} days`
    default:
      return ''
  }
}

export function getNextDueLabel(routine: Routine, completions: Completion[]): { label: string; urgent: boolean } {
  const today = new Date()
  const todayStr = formatDate(today)
  const { frequency } = routine

  switch (frequency.type) {
    case 'daily':
      return { label: 'Today', urgent: true }

    case 'weekdays': {
      const todayDay = getDayOfWeek(today)
      if (frequency.days.includes(todayDay)) return { label: 'Today', urgent: true }
      // Find next matching day
      for (let i = 1; i <= 7; i++) {
        const next = addDays(today, i)
        if (frequency.days.includes(getDayOfWeek(next))) {
          if (i === 1) return { label: 'Tomorrow', urgent: false }
          return { label: WEEKDAY_FULL[getDayOfWeek(next)], urgent: false }
        }
      }
      return { label: '—', urgent: false }
    }

    case 'weekly':
      return { label: 'This week', urgent: false }

    case 'interval': {
      // Find last completion
      const last = completions
        .filter((c) => c.routineId === routine.id && c.count > 0)
        .sort((a, b) => (a.date < b.date ? 1 : -1))[0]

      if (!last) return { label: 'Today', urgent: true }

      const lastDate = parseDate(last.date)
      const earliestDue = addDays(lastDate, frequency.days)
      const earliestDueStr = formatDate(earliestDue)

      // Find the actual first visible date (accounting for preferredDays)
      let firstVisibleDate = new Date(earliestDue)
      const preferred = routine.preferredDays
      if (preferred && preferred.length > 0) {
        // Walk forward until we land on a preferred day
        for (let i = 0; i < 7; i++) {
          if (preferred.includes(getDayOfWeek(firstVisibleDate))) break
          firstVisibleDate = addDays(firstVisibleDate, 1)
        }
      }
      const firstVisibleStr = formatDate(firstVisibleDate)

      // If already past first visible → overdue / showing now
      if (todayStr >= firstVisibleStr) return { label: 'Due now', urgent: true }

      // How many days until first visible?
      const msPerDay = 1000 * 60 * 60 * 24
      const daysUntil = Math.round(
        (parseDate(firstVisibleStr).getTime() - today.getTime()) / msPerDay
      )

      if (daysUntil === 0) return { label: 'Today', urgent: true }
      if (daysUntil === 1) return { label: 'Tomorrow', urgent: false }
      if (daysUntil < 7) {
        const dayName = WEEKDAY_FULL[getDayOfWeek(firstVisibleDate)]
        return { label: dayName, urgent: false }
      }

      // Show the date
      const display = parseDate(firstVisibleStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })

      // Mark as approaching if within 3 days of earliestDue
      const daysUntilEarliest = Math.round(
        (parseDate(earliestDueStr).getTime() - today.getTime()) / msPerDay
      )
      return { label: display, urgent: daysUntilEarliest <= 3 }
    }

    default:
      return { label: '—', urgent: false }
  }
}

export function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const period = h < 12 ? 'AM' : 'PM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${hour} ${period}` : `${hour}:${m.toString().padStart(2, '0')} ${period}`
}
