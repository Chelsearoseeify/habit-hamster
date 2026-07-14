import { useMemo } from 'react'
import type { Routine, Completion, Identity, Reflection, Mood } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IdentityCard } from '@/components/identity/IdentityCard'
import { MoodSelector } from '@/components/reflection/MoodSelector'
import { isRoutineDueOnDate, getMaxCountForRoutine } from '@/hooks/useCompletions'
import { votesByIdentity } from '@/lib/identity-utils'
import { getNextDueLabel, formatFrequency } from '@/lib/routine-utils'
import { generateInsights } from '@/lib/insights'
import { getToday } from '@/lib/date-utils'
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

  const nextAction = useMemo(() => {
    const due = routines.filter((r) => isRoutineDueOnDate(r, today, completions))
    const uncompleted = due.filter((r) => {
      const c = completions.find((x) => x.routineId === r.id && x.date === today)
      return (c?.count ?? 0) < getMaxCountForRoutine(r)
    })
    const ranked = [...uncompleted].sort((a, b) => {
      const ua = getNextDueLabel(a, completions).urgent ? 0 : 1
      const ub = getNextDueLabel(b, completions).urgent ? 0 : 1
      if (ua !== ub) return ua - ub
      const ta = a.timeRange?.start ?? '99:99'
      const tb = b.timeRange?.start ?? '99:99'
      if (ta !== tb) return ta.localeCompare(tb)
      return 0 // insertion order (routines arrive createdAt asc)
    })
    return ranked[0] ?? null
  }, [routines, completions, today])

  const votes = useMemo(
    () => votesByIdentity(identities, routines, completions),
    [identities, routines, completions]
  )
  const insights = useMemo(
    () => generateInsights(routines, completions),
    [routines, completions]
  )

  const reflection = getReflectionForDate(today)

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

      {nextAction ? (
        <NextActionCard routine={nextAction} completions={completions} onToggle={onToggle} />
      ) : (
        <Card>
          <CardContent className="py-8 text-center space-y-1">
            <p className="text-lg font-medium">You're done for now.</p>
            <p className="text-sm text-muted-foreground">Nothing else needs you right now. Rest easy.</p>
          </CardContent>
        </Card>
      )}

      {todayStats.total > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          {todayStats.completed} of {todayStats.total} done today
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
        <p className="text-center text-sm text-muted-foreground">
          You've shown up {consistency.activeDays} of {consistency.daysElapsed} days this month
          {' — '}
          {consistency.monthlyConsistency}%
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
}: {
  routine: Routine
  completions: Completion[]
  onToggle: (routineId: string, maxCount: number) => void
}) {
  const today = getToday()
  const maxCount = getMaxCountForRoutine(routine)
  const current = completions.find((c) => c.routineId === routine.id && c.date === today)?.count ?? 0
  const remaining = maxCount - current
  const mins = estimatedMinutes(routine)

  return (
    <Card className="border-primary/30">
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
          className="h-14 w-full max-w-xs mx-auto text-base"
          onClick={() => onToggle(routine.id, maxCount)}
        >
          <Check className="mr-2 h-5 w-5" />
          {maxCount > 1 ? `Log one (${current}/${maxCount})` : 'Done'}
        </Button>
      </CardContent>
    </Card>
  )
}
