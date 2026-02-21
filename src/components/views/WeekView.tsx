import type { Routine, Completion } from '@/types'
import { HabitHeatmap } from '@/components/heatmap/HabitHeatmap'

interface WeekViewProps {
  routines: Routine[]
  completions: Completion[]
  onCellClick?: (routineId: string, date: string) => void
}

export function WeekView({ routines, completions, onCellClick }: WeekViewProps) {
  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Last 7 days</h2>
      <HabitHeatmap
        routines={routines}
        completions={completions}
        timeRange="week"
        onCellClick={onCellClick}
      />
    </div>
  )
}
