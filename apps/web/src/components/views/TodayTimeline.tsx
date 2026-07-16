import type { Routine } from '@/types'
import { formatFrequency, formatTime } from '@/lib/routine-utils'
import { blockForRoutine } from '@/lib/blocks'
import { tapHaptic } from '@/lib/haptics'
import { Check } from 'lucide-react'

export interface TimelineItem {
  routine: Routine
  maxCount: number
  count: number
  done: boolean
}

interface TodayTimelineProps {
  items: TimelineItem[]
  /** Id of the next uncompleted task — the highlighted focal point. */
  nextId: string | null
  onToggle: (routineId: string, maxCount: number) => void
  reduced: boolean
}

function estimatedMinutes(routine: Routine): number | null {
  const tr = routine.timeRange
  if (!tr?.start || !tr.end) return null
  const [sh, sm] = tr.start.split(':').map(Number)
  const [eh, em] = tr.end.split(':').map(Number)
  const mins = eh * 60 + em - (sh * 60 + sm)
  return mins > 0 ? mins : null
}

/** When each task happens — its start time, or its time-of-day block. */
function whenLabel(routine: Routine): string {
  return routine.timeRange?.start ? formatTime(routine.timeRange.start) : blockForRoutine(routine)
}

/**
 * Today as a vertical timeline (principle 1: what's the next obvious thing?).
 * Tasks run top-to-bottom in time order along a rail; the next uncompleted one is
 * the loud focal card, done tasks recede above, upcoming wait below. Tap any task
 * to toggle it.
 */
export function TodayTimeline({ items, nextId, onToggle, reduced }: TodayTimelineProps) {
  return (
    <ol className="relative space-y-2 pl-7">
      {/* rail */}
      <div className="absolute left-[9px] top-1 bottom-1 w-px bg-border" aria-hidden />

      {items.map((item) => {
        const isNext = item.routine.id === nextId
        const { routine, done, count, maxCount } = item
        const mins = estimatedMinutes(routine)
        const remaining = maxCount - count

        return (
          <li key={routine.id} className="relative">
            {/* node */}
            <span
              aria-hidden
              className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full ${
                done
                  ? '-left-[1.6rem] h-4 w-4 bg-primary text-primary-foreground'
                  : isNext
                    ? `-left-[1.72rem] h-[1.15rem] w-[1.15rem] border-2 border-primary bg-background ${reduced ? '' : 'animate-pulse'}`
                    : '-left-[1.4rem] h-2.5 w-2.5 border border-muted-foreground/40 bg-background'
              }`}
            >
              {done && <Check className="h-2.5 w-2.5" />}
            </span>

            {isNext ? (
              <button
                type="button"
                onClick={() => {
                  tapHaptic()
                  onToggle(routine.id, maxCount)
                }}
                className="block w-full rounded-xl border-2 border-primary bg-card px-4 py-3 text-left shadow-sm transition-transform duration-100 active:scale-[0.99]"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">Next</p>
                <p className="text-lg font-semibold leading-tight">{routine.name}</p>
                <p className="text-xs text-muted-foreground">
                  {whenLabel(routine)}
                  {routine.category ? ` · ${routine.category}` : ''}
                  {` · ${formatFrequency(routine)}`}
                  {mins ? ` · ~${mins} min` : ''}
                  {maxCount > 1 ? ` · ${remaining} left` : ''}
                </p>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  tapHaptic()
                  onToggle(routine.id, maxCount)
                }}
                className="flex w-full items-baseline gap-2 rounded-lg px-1 py-1.5 text-left transition-opacity hover:opacity-100 opacity-70"
              >
                <span className="w-14 shrink-0 text-xs tabular-nums text-muted-foreground">
                  {whenLabel(routine)}
                </span>
                <span
                  className={`truncate text-sm ${
                    done ? 'text-muted-foreground line-through' : 'text-foreground'
                  }`}
                >
                  {routine.name}
                </span>
              </button>
            )}
          </li>
        )
      })}
    </ol>
  )
}
