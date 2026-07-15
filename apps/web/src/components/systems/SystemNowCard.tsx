import type { System, Routine, Completion } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { getMaxCountForRoutine } from '@/hooks/useCompletions'
import { systemStatus, ruleText } from '@/lib/systems'
import { Check, Circle } from 'lucide-react'

interface SystemNowCardProps {
  system: System
  members: Routine[]
  completions: Completion[]
  onToggle: (routineId: string, maxCount: number) => void
  enter: string
}

/**
 * A system as a rule in Now (principle 3, systems over goals; principle 1, one
 * clear thing). Complete any one member to satisfy it — the rest stay optional.
 * When satisfied, the alternatives fade but remain tappable for extra credit.
 */
export function SystemNowCard({ system, members, completions, onToggle, enter }: SystemNowCardProps) {
  const status = systemStatus(system, members, completions)
  const { satisfied, done, target, periodLabel, doneMemberIds } = status

  return (
    <Card className={`${satisfied ? '' : 'border-primary/30'} ${enter}`}>
      <CardContent className="py-6 space-y-4 text-center">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{system.name}</p>
          {satisfied ? (
            <p className="text-base font-medium text-primary">
              ✨ {system.name} complete {periodLabel}.
            </p>
          ) : (
            <h2 className="text-xl font-semibold">{ruleText(system)}</h2>
          )}
          <p className="text-sm text-muted-foreground tabular-nums">
            {done} of {target} · {periodLabel}
          </p>
        </div>

        <div className={`grid gap-2 ${satisfied ? 'opacity-50' : ''}`}>
          {members.map((m) => {
            const isDone = doneMemberIds.has(m.id)
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onToggle(m.id, getMaxCountForRoutine(m))}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                  isDone ? 'border-primary/40 bg-primary/5' : 'border-border'
                }`}
              >
                {isDone ? (
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">{m.name}</span>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
