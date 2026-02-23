import type { Routine, Completion } from '@/types'
import { RoutineForm } from '@/components/routines/RoutineForm'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { addDays, formatDate, getDayOfWeek, parseDate } from '@/lib/date-utils'

const WEEKDAY_NAMES = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const WEEKDAY_FULL = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

interface RoutinesViewProps {
  routines: Routine[]
  completions: Completion[]
  onDelete: (id: string) => void
  onEdit: (routine: Omit<Routine, 'id' | 'createdAt'>, id: string) => void
}

function formatFrequency(routine: Routine): string {
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

function getNextDueLabel(routine: Routine, completions: Completion[]): { label: string; urgent: boolean } {
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

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const period = h < 12 ? 'AM' : 'PM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${hour} ${period}` : `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

const CATEGORY_COLORS: Record<string, string> = {
  Fitness: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Nutrition: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  Skincare: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  Supplements: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
}

export function RoutinesView({ routines, completions, onDelete, onEdit }: RoutinesViewProps) {
  if (routines.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No routines yet. Add one to get started!
      </div>
    )
  }

  // Group by category, preserving insertion order
  const grouped: Record<string, Routine[]> = {}
  for (const r of routines) {
    if (!grouped[r.category]) grouped[r.category] = []
    grouped[r.category].push(r)
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, categoryRoutines]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {category}
          </h3>
          <div className="divide-y divide-border rounded-xl border overflow-hidden">
            {categoryRoutines.map((routine) => {
              const { label: dueLabel, urgent } = getNextDueLabel(routine, completions)
              const colorClass = CATEGORY_COLORS[routine.category] ?? 'bg-muted text-muted-foreground'

              return (
                <div key={routine.id} className="flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/40 transition-colors">
                  {/* Category dot */}
                  <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
                    {routine.category}
                  </span>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{routine.name}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                      <span className="text-xs text-muted-foreground">{formatFrequency(routine)}</span>
                      {routine.timeRange && (
                        <span className="text-xs text-muted-foreground">
                          · {formatTime(routine.timeRange.start)}
                          {routine.timeRange.end && ` – ${formatTime(routine.timeRange.end)}`}
                        </span>
                      )}
                      {routine.preferredDays && routine.preferredDays.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          · pref. {routine.preferredDays.map((d) => WEEKDAY_NAMES[d]).join(', ')}
                        </span>
                      )}
                      {routine.description && (
                        <span className="text-xs text-muted-foreground/60 truncate max-w-[200px]">
                          · {routine.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Next due badge */}
                  <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                    urgent
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {dueLabel}
                  </span>

                  {/* Edit */}
                  <RoutineForm
                    initialData={routine}
                    onSubmit={(data) => onEdit(data, routine.id)}
                    trigger={
                      <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    }
                  />

                  {/* Delete */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(routine.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
