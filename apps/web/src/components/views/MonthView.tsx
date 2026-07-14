import type { Routine, Completion } from '@/types'
import { HabitHeatmap } from '@/components/heatmap/HabitHeatmap'

interface MonthViewProps {
  routines: Routine[]
  completions: Completion[]
  onCellClick?: (routineId: string, date: string) => void
}

export function MonthView({ routines, completions, onCellClick }: MonthViewProps) {
  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Last 30 days</h2>
      <HabitHeatmap
        routines={routines}
        completions={completions}
        timeRange="month"
        onCellClick={onCellClick}
      />
    </div>
  )
}
