import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import type { Routine, Completion } from '@/types'
import { getMaxCountForRoutine } from '@/hooks/useCompletions'
import { Trash2 } from 'lucide-react'

interface RoutineCardProps {
  routine: Routine
  completion?: Completion
  onToggle: (routineId: string, maxCount: number) => void
  onDelete: (routineId: string) => void
  onEdit?: (routine: Routine) => void
}

function formatFrequency(routine: Routine): string {
  const { frequency } = routine
  switch (frequency.type) {
    case 'daily':
      return frequency.timesPerDay === 1 ? 'Daily' : `${frequency.timesPerDay}x/day`
    case 'weekly':
      return `${frequency.timesPerWeek}x/week`
    case 'weekdays':
      const days = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      return frequency.days.map((d) => days[d]).join(', ')
    case 'interval':
      return `Every ${frequency.days} days`
    default:
      return ''
  }
}

export function RoutineCard({
  routine,
  completion,
  onToggle,
  onDelete,
}: RoutineCardProps) {
  const maxCount = getMaxCountForRoutine(routine)
  const currentCount = completion?.count ?? 0
  const isComplete = currentCount >= maxCount

  return (
    <Card className={isComplete ? 'opacity-60' : ''}>
      <CardContent className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={isComplete}
            onCheckedChange={() => onToggle(routine.id, maxCount)}
          />
          <div>
            <p className={`font-medium ${isComplete ? 'line-through' : ''}`}>
              {routine.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {routine.category} · {formatFrequency(routine)}
              {maxCount > 1 && ` • ${currentCount}/${maxCount}`}
            </p>
            {routine.description && (
              <p className="text-xs text-muted-foreground/70 mt-0.5">{routine.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(routine.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
