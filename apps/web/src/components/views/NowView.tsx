import { useMemo } from 'react'
import type { Routine, Completion, Identity, System, Reflection, Mood } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MoodSelector } from '@/components/reflection/MoodSelector'
import { getMaxCountForRoutine, isRoutineDueOnDate } from '@/hooks/useCompletions'
import { identityTodayProgress } from '@/lib/identity-utils'
import { formatFrequency } from '@/lib/routine-utils'
import { blockForRoutine, BLOCK_ORDER } from '@/lib/blocks'
import { getToday } from '@/lib/date-utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { tapHaptic } from '@/lib/haptics'
import { Check } from 'lucide-react'

interface NowViewProps {
  routines: Routine[]
  completions: Completion[]
  identities: Identity[]
  // Kept for prop compatibility with App; systems live in "More & stats" now.
  systems: System[]
  todayStats: { total: number; completed: number; percentage: number }
  consistency: { activeDays: number; daysElapsed: number; monthlyConsistency: number }
  onToggle: (routineId: string, maxCount: number) => void
  getReflectionForDate: (date: string) => Reflection | undefined
  setReflection: (date: string, mood: Mood, note?: string) => void
}

function estimatedMinutes(routine: Routine): number | null {
  const tr = routine.timeRange
  if (!tr?.start || !tr.end) return null
  const [sh, sm] = tr.start.split(':').map(Number)
  const [eh, em] = tr.end.split(':').map(Number)
  const mins = eh * 60 + em - (sh * 60 + sm)
  return mins > 0 ? mins : null
}

const BLOCK_WEIGHT: Record<string, number> = Object.fromEntries(
  BLOCK_ORDER.map((b, i) => [b, i])
)

export function NowView({
  routines,
  completions,
  identities,
  todayStats,
  onToggle,
  getReflectionForDate,
  setReflection,
}: NowViewProps) {
  const today = getToday()
  const reduced = useReducedMotion()
  const enter = reduced ? '' : 'animate-now-enter'

  // The day as one chronological list: time-of-day block, then start time.
  const dueToday = useMemo(
    () =>
      routines
        .filter((r) => isRoutineDueOnDate(r, today, completions))
        .sort((a, b) => {
          const wa = BLOCK_WEIGHT[blockForRoutine(a)]
          const wb = BLOCK_WEIGHT[blockForRoutine(b)]
          if (wa !== wb) return wa - wb
          return (a.timeRange?.start ?? '99:99').localeCompare(
            b.timeRange?.start ?? '99:99'
          )
        }),
    [routines, completions, today]
  )

  const items = dueToday.map((r) => {
    const maxCount = getMaxCountForRoutine(r)
    const count =
      completions.find((c) => c.routineId === r.id && c.date === today)?.count ?? 0
    return { routine: r, maxCount, count, done: count >= maxCount }
  })

  const nextId = items.find((i) => !i.done)?.routine.id ?? null

  // Identities you're living up to today — meaning first, no points.
  const identityProgress = useMemo(
    () =>
      identities
        .map((identity) => ({
          identity,
          progress: identityTodayProgress(identity.id, routines, completions, today),
        }))
        .filter((x) => x.progress.total > 0),
    [identities, routines, completions, today]
  )

  const reflection = getReflectionForDate(today)

  return (
    <div className="space-y-8">
      {/* 2. Today — focused list. Next action is loud; the rest recedes. */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-wide text-muted-foreground">
          Today
        </h2>

        {items.length === 0 ? (
          <Card className={enter}>
            <CardContent className="py-8 text-center space-y-1">
              <p className="text-lg font-medium">Nothing due today.</p>
              <p className="text-sm text-muted-foreground">Rest easy.</p>
            </CardContent>
          </Card>
        ) : nextId === null ? (
          <Card className={enter}>
            <CardContent className="py-8 text-center space-y-1">
              <p className="text-lg font-medium">You're done for today. 🎉</p>
              <p className="text-sm text-muted-foreground">
                Every one of them was a vote for who you're becoming.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {items.map((item) =>
              item.routine.id === nextId ? (
                <li key={item.routine.id}>
                  <NextActionCard
                    routine={item.routine}
                    count={item.count}
                    maxCount={item.maxCount}
                    onToggle={onToggle}
                    enter={enter}
                  />
                </li>
              ) : (
                <li key={item.routine.id}>
                  <FadedRow
                    routine={item.routine}
                    done={item.done}
                    maxCount={item.maxCount}
                    onToggle={onToggle}
                  />
                </li>
              )
            )}
          </ul>
        )}
      </section>

      {/* 3. Progress — a quiet bar, no big numbers. */}
      {todayStats.total > 0 && (
        <section className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="uppercase tracking-wide">Today</span>
            <span className="tabular-nums">{todayStats.percentage}%</span>
          </div>
          <ProgressBar value={todayStats.percentage} />
        </section>
      )}

      {/* 4. Identity progress — meaning, not points. */}
      {identityProgress.length > 0 && (
        <section className="space-y-4">
          {identityProgress.map(({ identity, progress }) => (
            <div key={identity.id} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium leading-snug">
                  <span className="mr-1.5">✨</span>
                  {identity.statement?.trim() || `Becoming ${identity.name}`}
                </p>
                <span className="text-xs tabular-nums text-muted-foreground shrink-0">
                  {progress.percentage}% today
                </span>
              </div>
              <ProgressBar value={progress.percentage} />
            </div>
          ))}
        </section>
      )}

      {/* 5. Reflection — one gentle line. */}
      <section>
        <MoodSelector
          reflection={reflection}
          onChange={(mood, note) => setReflection(today, mood, note)}
        />
      </section>
    </div>
  )
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

/** A completed or upcoming item — present, but out of the way. */
function FadedRow({
  routine,
  done,
  maxCount,
  onToggle,
}: {
  routine: Routine
  done: boolean
  maxCount: number
  onToggle: (routineId: string, maxCount: number) => void
}) {
  return (
    <button
      type="button"
      onClick={() => {
        tapHaptic()
        onToggle(routine.id, maxCount)
      }}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left opacity-55 transition-opacity hover:opacity-90"
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          done ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
        }`}
      >
        {done && <Check className="h-3 w-3" />}
      </span>
      <span
        className={`text-sm ${done ? 'text-muted-foreground line-through' : 'text-foreground'}`}
      >
        {routine.name}
      </span>
    </button>
  )
}

/** The one thing to do next — big, bold, the focus of the screen. */
function NextActionCard({
  routine,
  count,
  maxCount,
  onToggle,
  enter,
}: {
  routine: Routine
  count: number
  maxCount: number
  onToggle: (routineId: string, maxCount: number) => void
  enter: string
}) {
  const remaining = maxCount - count
  const mins = estimatedMinutes(routine)

  const handleDone = () => {
    tapHaptic()
    onToggle(routine.id, maxCount)
  }

  return (
    <Card className={`border-primary/30 ${enter}`}>
      <CardContent className="py-7 space-y-5 text-center">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Next</p>
          <h2 className="text-2xl font-semibold">{routine.name}</h2>
          <p className="text-sm text-muted-foreground">
            {routine.category ? `${routine.category} · ` : ''}
            {formatFrequency(routine)}
            {mins ? ` · ~${mins} min` : ''}
          </p>
          {routine.description && (
            <p className="text-sm text-muted-foreground/70">{routine.description}</p>
          )}
          {maxCount > 1 && (
            <p className="pt-1 text-sm font-medium text-primary">
              {remaining === 1 ? 'Only 1 left' : `Only ${remaining} left`}
            </p>
          )}
        </div>

        <Button
          size="lg"
          className="h-14 w-full max-w-xs mx-auto text-base transition-transform duration-100 active:scale-95"
          onClick={handleDone}
        >
          <Check className={`mr-2 h-5 w-5 ${enter ? 'animate-check-pop' : ''}`} />
          {maxCount > 1 ? `Log one (${count}/${maxCount})` : 'Done'}
        </Button>
      </CardContent>
    </Card>
  )
}
