import type { Completion } from '@/types'
import type { TimelineItem } from '@/components/views/TodayTimeline'
import { formatFrequency } from '@/lib/routine-utils'
import { tapHaptic } from '@/lib/haptics'
import { Clock, Check, ChevronRight } from 'lucide-react'

interface AnytimeCardProps {
  items: TimelineItem[]
  completions: Completion[]
  onToggle: (routineId: string, maxCount: number) => void
}

/** Stable soft colour per category for the leading icon chip. */
function chipHue(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360
  return h
}

/**
 * Ongoing (untimed) habits — "anytime today". No clock, no order, so they live
 * as a plain progress list beside the timeline: icon chip, name, count, a bar
 * that fills as you tap. Replaces the earlier honeycomb experiment.
 */
export function AnytimeCard({ items, onToggle }: AnytimeCardProps) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Clock className="h-4 w-4" />
        Anytime today
      </div>

      <ul className="space-y-2">
        {items.map((item) => {
          const { routine, done, count, maxCount } = item
          const pct = maxCount > 0 ? Math.min(100, Math.round((count / maxCount) * 100)) : 0
          const hue = chipHue(routine.category || routine.name)
          return (
            <li key={routine.id}>
              <button
                type="button"
                onClick={() => {
                  tapHaptic()
                  onToggle(routine.id, maxCount)
                }}
                className="flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors hover:bg-muted/40"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                  style={{
                    background: `hsl(${hue} 70% 90%)`,
                    color: `hsl(${hue} 45% 35%)`,
                  }}
                >
                  {done ? <Check className="h-5 w-5" strokeWidth={3} /> : routine.name.charAt(0).toUpperCase()}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span
                      className={`truncate text-sm font-medium ${
                        done ? 'text-muted-foreground line-through' : 'text-foreground'
                      }`}
                    >
                      {routine.name}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {count}/{maxCount}
                    </span>
                  </span>
                  <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-primary transition-[width] duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="mt-1 block truncate text-[11px] text-muted-foreground">
                    {formatFrequency(routine)}
                  </span>
                </span>

                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
