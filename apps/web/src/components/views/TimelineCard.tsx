import type { TimelineItem } from '@/components/views/TodayTimeline'
import { NextHero } from '@/components/views/NextHero'
import { formatFrequency, formatTime } from '@/lib/routine-utils'
import { tapHaptic } from '@/lib/haptics'
import { Check, CalendarCheck, ChevronDown } from 'lucide-react'

interface TimelineCardProps {
  items: TimelineItem[]
  /** The item shown as the loud hero block at the top (focused, or the next by default). */
  heroItem: TimelineItem | null
  /** Label for the hero — "Next" vs "Focus". */
  heroLabel: string
  /** Promote a rail item to the hero (select it). */
  onFocus: (routineId: string) => void
  /** Mark a rail item done/undone (node dot). */
  onToggle: (routineId: string, maxCount: number) => void
  /** Mark the hero item done and advance focus. */
  onHeroToggle: (routineId: string, maxCount: number) => void
  onViewFullDay: () => void
}

function whenLabel(item: TimelineItem): string {
  return item.routine.timeRange?.start ? formatTime(item.routine.timeRange.start) : 'Anytime'
}

/**
 * Today's timed routines. The focused item is the big hero block at the top;
 * every other item is a compact rail row. Tapping a row *promotes* it to the
 * hero (get bigger); the small node dot is how you check it off — so selecting
 * and completing are two distinct gestures.
 */
export function TimelineCard({
  items,
  heroItem,
  heroLabel,
  onFocus,
  onToggle,
  onHeroToggle,
  onViewFullDay,
}: TimelineCardProps) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <CalendarCheck className="h-4 w-4" />
        Today's timeline
      </div>

      <ol className="relative space-y-1 pl-6">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" aria-hidden />
        {items.map((item) => {
          const { routine, done, count, maxCount } = item
          const isHero = routine.id === heroItem?.routine.id

          // The focused item expands into the big card in place — no rail node,
          // it carries its own "Mark as done" button. Others stay compact rows.
          if (isHero) {
            return (
              <li
                key={routine.id}
                className="relative -ml-6"
                style={{ viewTransitionName: `tl-${routine.id}` }}
              >
                <NextHero item={item} label={heroLabel} onToggle={onHeroToggle} />
              </li>
            )
          }

          return (
            <li
              key={routine.id}
              className="relative"
              style={{ viewTransitionName: `tl-${routine.id}` }}
            >
              {/* Node dot — the check affordance. Sits in the rail gutter. */}
              <button
                type="button"
                aria-label={done ? `Mark ${routine.name} not done` : `Mark ${routine.name} done`}
                onClick={() => {
                  tapHaptic()
                  onToggle(routine.id, maxCount)
                }}
                className={`absolute top-1/2 z-10 -translate-y-1/2 flex items-center justify-center rounded-full transition-colors ${
                  done
                    ? '-left-[1.45rem] h-4 w-4 bg-primary text-primary-foreground'
                    : '-left-[1.4rem] h-3.5 w-3.5 border border-muted-foreground/40 bg-background hover:border-primary hover:bg-primary/10'
                }`}
              >
                {done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
              </button>

              {/* Row body — tapping selects (promotes to hero). */}
              <button
                type="button"
                onClick={() => onFocus(routine.id)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/40"
              >
                <span className="w-14 shrink-0 text-xs tabular-nums text-muted-foreground sm:w-16">
                  {whenLabel(item)}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block truncate text-sm font-medium ${
                      done ? 'text-muted-foreground line-through' : 'text-foreground'
                    }`}
                  >
                    {routine.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {routine.category ? `${routine.category} · ` : ''}
                    {formatFrequency(routine)}
                    {maxCount > 1 ? ` · ${count}/${maxCount}` : ''}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      <button
        type="button"
        onClick={onViewFullDay}
        className="mt-3 flex w-full items-center justify-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        View full day
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  )
}
