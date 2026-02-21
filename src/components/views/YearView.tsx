import type { Routine, Completion } from '@/types'
import { HabitHeatmap } from '@/components/heatmap/HabitHeatmap'

interface YearViewProps {
  routines: Routine[]
  completions: Completion[]
  onCellClick?: (routineId: string, date: string) => void
}

export function YearView({ routines, completions, onCellClick }: YearViewProps) {
  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Last 365 days</h2>
      <HabitHeatmap
        routines={routines}
        completions={completions}
        timeRange="year"
        onCellClick={onCellClick}
      />
    </div>
  )
}
