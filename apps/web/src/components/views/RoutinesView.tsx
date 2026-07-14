import type { Routine, Completion, Identity } from '@/types'
import { RoutineForm } from '@/components/routines/RoutineForm'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Pause, Play } from 'lucide-react'
import { WEEKDAY_NAMES, formatFrequency, getNextDueLabel, formatTime } from '@/lib/routine-utils'

interface RoutinesViewProps {
  routines: Routine[]
  completions: Completion[]
  onDelete: (id: string) => void
  onEdit: (routine: Omit<Routine, 'id' | 'createdAt'>, id: string) => void
  onPause: (id: string, paused: boolean) => void
  identities?: Identity[]
}

const CATEGORY_COLORS: Record<string, string> = {
  Fitness: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Nutrition: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  Skincare: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  Supplements: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
}

export function RoutinesView({ routines, completions, onDelete, onEdit, onPause, identities = [] }: RoutinesViewProps) {
  if (routines.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No routines yet. Add one to get started!
      </div>
    )
  }

  // Group by category, preserving insertion order
  const grouped: Record<string, Routine[]> = {}
  for (const r of routines) {
    if (!grouped[r.category]) grouped[r.category] = []
    grouped[r.category].push(r)
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, categoryRoutines]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {category}
          </h3>
          <div className="divide-y divide-border rounded-xl border overflow-hidden">
            {categoryRoutines.map((routine) => {
              const { label: dueLabel, urgent } = getNextDueLabel(routine, completions)
              const colorClass = CATEGORY_COLORS[routine.category] ?? 'bg-muted text-muted-foreground'

              return (
                <div key={routine.id} className={`flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/40 transition-colors ${routine.paused ? 'opacity-60' : ''}`}>
                  {/* Category dot */}
                  <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
                    {routine.category}
                  </span>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{routine.name}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                      <span className="text-xs text-muted-foreground">{formatFrequency(routine)}</span>
                      {routine.timeRange && (
                        <span className="text-xs text-muted-foreground">
                          · {formatTime(routine.timeRange.start)}
                          {routine.timeRange.end && ` – ${formatTime(routine.timeRange.end)}`}
                        </span>
                      )}
                      {routine.preferredDays && routine.preferredDays.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          · pref. {routine.preferredDays.map((d) => WEEKDAY_NAMES[d]).join(', ')}
                        </span>
                      )}
                      {routine.description && (
                        <span className="text-xs text-muted-foreground/60 truncate max-w-[200px]">
                          · {routine.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Next due badge or paused badge */}
                  {routine.paused ? (
                    <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      Paused
                    </span>
                  ) : (
                    <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                      urgent
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {dueLabel}
                    </span>
                  )}

                  {/* Pause / Resume */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => onPause(routine.id, !routine.paused)}
                    title={routine.paused ? 'Resume routine' : 'Pause routine'}
                  >
                    {routine.paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                  </Button>

                  {/* Edit */}
                  <RoutineForm
                    initialData={routine}
                    onSubmit={(data) => onEdit(data, routine.id)}
                    identities={identities}
                    trigger={
                      <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    }
                  />

                  {/* Delete */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(routine.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
