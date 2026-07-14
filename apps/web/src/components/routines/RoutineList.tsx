import type { Routine, Completion } from '@/types'
import { getDayOfWeek, parseDate } from '@/lib/date-utils'
import { RoutineCard } from './RoutineCard'

interface RoutineListProps {
  routinesByCategory: Record<string, Routine[]>
  completions: Completion[]
  date: string
  onToggle: (routineId: string, maxCount: number) => void
  onDelete: (routineId: string) => void
}

function formatTimeLabel(start: string, end?: string): string {
  const fmt = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    const period = h < 12 ? 'AM' : 'PM'
    const hour = h % 12 === 0 ? 12 : h % 12
    return m === 0 ? `${hour} ${period}` : `${hour}:${m.toString().padStart(2, '0')} ${period}`
  }
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start)
}

export function RoutineList({
  routinesByCategory,
  completions,
  date,
  onToggle,
  onDelete,
}: RoutineListProps) {
  const dayOfWeek = getDayOfWeek(parseDate(date))

  const allRoutines = Object.values(routinesByCategory).flat()
    .filter((r) => !r.paused && (!r.preferredDays || r.preferredDays.includes(dayOfWeek)))
    .sort((a, b) => {
      const aTime = a.timeRange?.start ?? ''
      const bTime = b.timeRange?.start ?? ''
      if (!aTime && !bTime) return 0
      if (!aTime) return 1
      if (!bTime) return -1
      return aTime.localeCompare(bTime)
    })

  if (allRoutines.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No routines yet. Add one to get started!
      </div>
    )
  }

  const timedRoutines = allRoutines.filter((r) => r.timeRange)
  const ongoingRoutines = allRoutines.filter((r) => !r.timeRange)

  // Group timed routines by time slot
  const slots: { key: string; label: string; routines: Routine[] }[] = []
  const slotMap = new Map<string, Routine[]>()

  for (const routine of timedRoutines) {
    const key = `${routine.timeRange!.start}|${routine.timeRange!.end ?? ''}`
    if (!slotMap.has(key)) {
      slotMap.set(key, [])
      slots.push({ key, label: formatTimeLabel(routine.timeRange!.start, routine.timeRange!.end), routines: slotMap.get(key)! })
    }
    slotMap.get(key)!.push(routine)
  }

  const renderCard = (routine: Routine) => {
    const completion = completions.find((c) => c.routineId === routine.id && c.date === date)
    return (
      <RoutineCard
        key={routine.id}
        routine={routine}
        completion={completion}
        onToggle={onToggle}
        onDelete={onDelete}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:gap-4 sm:items-start">
      {/* Timed routines — scrollable left column */}
      {timedRoutines.length > 0 && (
        <div className="flex-1 space-y-6 min-w-0">
          {slots.map(({ key, label, routines }) => (
            <div key={key}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">{label}</h3>
              <div className="space-y-2">
                {routines.map(renderCard)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ongoing routines — sticky right column */}
      {ongoingRoutines.length > 0 && (
        <div className="w-full sm:w-56 sm:shrink-0 sm:sticky sm:top-4 space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">Ongoing</h3>
          {ongoingRoutines.map(renderCard)}
        </div>
      )}
    </div>
  )
}
