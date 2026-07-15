import { useEffect, useMemo, useRef, useState } from 'react'
import type { Routine, Completion, Identity, Reflection, Mood } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IdentityCard } from '@/components/identity/IdentityCard'
import { MoodSelector } from '@/components/reflection/MoodSelector'
import { getMaxCountForRoutine } from '@/hooks/useCompletions'
import { votesByIdentity } from '@/lib/identity-utils'
import { formatFrequency } from '@/lib/routine-utils'
import { buildDayBlocks, currentBlock, type BlockName } from '@/lib/blocks'
import { generateInsights } from '@/lib/insights'
import { getToday } from '@/lib/date-utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useCountUp } from '@/hooks/useCountUp'
import { tapHaptic } from '@/lib/haptics'
import { Check } from 'lucide-react'

interface NowViewProps {
  routines: Routine[]
  completions: Completion[]
  identities: Identity[]
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

export function NowView({
  routines,
  completions,
  identities,
  todayStats,
  consistency,
  onToggle,
  getReflectionForDate,
  setReflection,
}: NowViewProps) {
  const today = getToday()

  // Chunking: reveal one time-of-day block at a time (principle 4).
  const blocks = useMemo(
    () => buildDayBlocks(routines, completions, today),
    [routines, completions, today]
  )
  const block = currentBlock(blocks)
  const nextAction = block?.remaining[0] ?? null

  // Calm hand-off when the user clears a block and a later one takes over.
  const [handoff, setHandoff] = useState<{ done: BlockName; next: BlockName } | null>(null)
  const prevBlock = useRef<BlockName | null>(block?.name ?? null)
  useEffect(() => {
    const prev = prevBlock.current
    const now = block?.name ?? null
    if (prev && now && prev !== now) {
      setHandoff({ done: prev, next: now })
      prevBlock.current = now
      const t = setTimeout(() => setHandoff(null), 2600)
      return () => clearTimeout(t)
    }
    prevBlock.current = now
  }, [block?.name])

  const votes = useMemo(
    () => votesByIdentity(identities, routines, completions),
    [identities, routines, completions]
  )
  const insights = useMemo(
    () => generateInsights(routines, completions),
    [routines, completions]
  )

  const reflection = getReflectionForDate(today)

  const reduced = useReducedMotion()
  const enter = reduced ? '' : 'animate-now-enter'
  const completedCount = useCountUp(todayStats.completed)
  const activeDays = useCountUp(consistency.activeDays)
  const monthlyConsistency = useCountUp(consistency.monthlyConsistency)

  // Identities worth showing: those with at least one linked routine.
  const linkedIdentities = identities.filter((i) =>
    routines.some((r) => r.identityId === i.id)
  )

  return (
    <div className="space-y-6">
      {linkedIdentities.length > 0 && (
        <div className="space-y-3">
          {linkedIdentities.map((identity) => (
            <IdentityCard key={identity.id} identity={identity} votes={votes[identity.id] ?? 0} />
          ))}
        </div>
      )}

      {handoff && (
        <p className={`text-center text-sm font-medium text-primary ${enter}`}>
          {handoff.done} done — {handoff.next} is next.
        </p>
      )}

      {nextAction && block ? (
        <div className="space-y-3">
          <p className="text-center text-xs uppercase tracking-wide text-muted-foreground">
            {block.name} · <span className="tabular-nums">{block.completed} of {block.total} done</span>
          </p>
          <NextActionCard
            key={nextAction.id}
            routine={nextAction}
            completions={completions}
            onToggle={onToggle}
            enter={enter}
          />
        </div>
      ) : (
        <Card key="done" className={enter}>
          <CardContent className="py-8 text-center space-y-1">
            <p className="text-lg font-medium">You're done for now.</p>
            <p className="text-sm text-muted-foreground">Nothing else needs you right now. Rest easy.</p>
          </CardContent>
        </Card>
      )}

      {todayStats.total > 0 && (
        <p className="text-center text-sm text-muted-foreground tabular-nums">
          {completedCount} of {todayStats.total} done today
        </p>
      )}

      <Card>
        <CardContent className="py-5">
          <MoodSelector
            reflection={reflection}
            onChange={(mood, note) => setReflection(today, mood, note)}
          />
        </CardContent>
      </Card>

      {consistency.daysElapsed > 0 && (
        <p className="text-center text-sm text-muted-foreground tabular-nums">
          You've shown up {activeDays} of {consistency.daysElapsed} days this month
          {' — '}
          {monthlyConsistency}%
        </p>
      )}

      {insights.length > 0 && (
        <div className="space-y-1 text-center">
          {insights.slice(0, 2).map((line, i) => (
            <p key={i} className="text-sm text-muted-foreground">{line}</p>
          ))}
        </div>
      )}
    </div>
  )
}

function NextActionCard({
  routine,
  completions,
  onToggle,
  enter,
}: {
  routine: Routine
  completions: Completion[]
  onToggle: (routineId: string, maxCount: number) => void
  enter: string
}) {
  const today = getToday()
  const maxCount = getMaxCountForRoutine(routine)
  const current = completions.find((c) => c.routineId === routine.id && c.date === today)?.count ?? 0
  const remaining = maxCount - current
  const mins = estimatedMinutes(routine)

  const handleDone = () => {
    tapHaptic()
    onToggle(routine.id, maxCount)
  }

  return (
    <Card className={`border-primary/30 ${enter}`}>
      <CardContent className="py-8 space-y-5 text-center">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Next</p>
          <h2 className="text-2xl font-semibold">{routine.name}</h2>
          <p className="text-sm text-muted-foreground">
            {routine.category} · {formatFrequency(routine)}
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
          {maxCount > 1 ? `Log one (${current}/${maxCount})` : 'Done'}
        </Button>
      </CardContent>
    </Card>
  )
}
