import type { TimelineItem } from '@/components/views/TodayTimeline'
import { formatFrequency, formatTime } from '@/lib/routine-utils'
import { tapHaptic } from '@/lib/haptics'
import { Check } from 'lucide-react'

interface NextHeroProps {
  /** The focused timed item (the next one by default), or null when the day's timed run is done. */
  item: TimelineItem | null
  /** Small label above the name — "Next" for the auto-next, "Focus" when manually selected. */
  label?: string
  onToggle: (routineId: string, maxCount: number) => void
}

/** "~N min" estimate from a routine's start/end, or null. */
function estimatedMinutes(item: TimelineItem): number | null {
  const tr = item.routine.timeRange
  if (!tr?.start || !tr.end) return null
  const [sh, sm] = tr.start.split(':').map(Number)
  const [eh, em] = tr.end.split(':').map(Number)
  const mins = eh * 60 + em - (sh * 60 + sm)
  return mins > 0 ? mins : null
}

/** Human "starts in" relative to now, or a status when it's already time. */
function startsInLabel(startHHMM: string, now: Date): string {
  const [h, m] = startHHMM.split(':').map(Number)
  const diff = h * 60 + m - (now.getHours() * 60 + now.getMinutes())
  if (diff <= 0) return 'Now'
  if (diff < 60) return `Starts in ${diff} min`
  const hrs = Math.floor(diff / 60)
  const rem = diff % 60
  return rem ? `Starts in ${hrs}h ${rem}m` : `Starts in ${hrs}h`
}

/**
 * The hero of the home page (principle 1: the next obvious action, loud). One
 * card, one thing to do next — with its time, estimate, and a single big button.
 */
export function NextHero({ item, label = 'Next', onToggle }: NextHeroProps) {
  if (!item) {
    return (
      <div className="rounded-2xl border bg-card px-6 py-8 text-center">
        <p className="text-lg font-semibold">Timed routines done. 🎉</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Every one was a vote for who you're becoming.
        </p>
      </div>
    )
  }

  const { routine, maxCount } = item
  const now = new Date()
  const mins = estimatedMinutes(item)
  const meta = [
    routine.timeRange?.start ? startsInLabel(routine.timeRange.start, now) : null,
    routine.timeRange?.start ? formatTime(routine.timeRange.start) : formatFrequency(routine),
    mins ? `~${mins} min` : null,
  ]
    .filter(Boolean)
    .join('  ·  ')

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border bg-gradient-to-br from-primary/5 to-transparent px-5 py-5 sm:px-6 sm:py-6">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <h2 className="mt-1 truncate text-2xl font-bold sm:text-3xl">{routine.name}</h2>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{meta}</p>
        <button
          type="button"
          onClick={() => {
            tapHaptic()
            onToggle(routine.id, maxCount)
          }}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
        >
          <Check className="h-4 w-4" />
          {item.done ? 'Completed' : 'Mark as done'}
        </button>
      </div>
      {/* Illustration placeholder — swap for real hamster art. */}
      <div
        aria-hidden
        className="hidden h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-6xl sm:flex"
      >
        🐹
      </div>
    </div>
  )
}
