import { useMemo } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Routine, Completion } from '@/types'
import { formatDate, addDays, formatMonthShort } from '@/lib/date-utils'
import { getMaxCountForRoutine } from '@/hooks/useCompletions'

export type TimeRange = 'week' | 'month' | 'year'

interface HabitHeatmapProps {
  routines: Routine[]
  completions: Completion[]
  timeRange: TimeRange
  onCellClick?: (routineId: string, date: string) => void
}

function getColorClass(completion: number, expected: number): string {
  if (expected === 0) return 'bg-muted/50'
  const ratio = completion / expected
  if (ratio === 0) return 'bg-muted'
  if (ratio < 0.5) return 'bg-green-200 dark:bg-green-900'
  if (ratio < 1) return 'bg-green-400 dark:bg-green-700'
  return 'bg-green-600 dark:bg-green-500'
}

function getDaysForRange(timeRange: TimeRange): string[] {
  const today = new Date()
  const days: string[] = []

  let numDays: number
  switch (timeRange) {
    case 'week':
      numDays = 7
      break
    case 'month':
      numDays = 30
      break
    case 'year':
      numDays = 365
      break
  }

  for (let i = numDays - 1; i >= 0; i--) {
    days.push(formatDate(addDays(today, -i)))
  }

  return days
}

function getCompletionForDay(
  routineId: string,
  date: string,
  completions: Completion[]
): number {
  const completion = completions.find(
    (c) => c.routineId === routineId && c.date === date
  )
  return completion?.count ?? 0
}

export function HabitHeatmap({
  routines,
  completions,
  timeRange,
  onCellClick,
}: HabitHeatmapProps) {
  const days = useMemo(() => getDaysForRange(timeRange), [timeRange])
  const today = formatDate(new Date())

  const dateLabels = useMemo(() => {
    if (timeRange === 'week') {
      return days.map((d) => {
        const date = new Date(d)
        return date.toLocaleDateString('en-US', { weekday: 'short' })
      })
    }
    if (timeRange === 'month') {
      return days.map((d, i) => {
        if (i % 5 === 0) {
          const date = new Date(d)
          return date.getDate().toString()
        }
        return ''
      })
    }
    // year - show months
    const labels: string[] = []
    let lastMonth = -1
    days.forEach((d) => {
      const date = new Date(d)
      const month = date.getMonth()
      if (month !== lastMonth) {
        labels.push(formatMonthShort(month))
        lastMonth = month
      } else {
        labels.push('')
      }
    })
    return labels
  }, [days, timeRange])

  const cellSize = timeRange === 'year' ? 'w-[3px] h-[12px]' : timeRange === 'month' ? 'w-[8px] h-[16px]' : 'w-[32px] h-[20px]'
  const gapSize = timeRange === 'year' ? 'gap-[1px]' : 'gap-[2px]'

  // Group routines by category
  const routinesByCategory = useMemo(() => {
    const grouped: Record<string, Routine[]> = {}
    for (const routine of routines) {
      if (!grouped[routine.category]) {
        grouped[routine.category] = []
      }
      grouped[routine.category].push(routine)
    }
    return grouped
  }, [routines])

  const categories = Object.keys(routinesByCategory).sort()

  if (routines.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No routines to display
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Date labels header */}
          <div className="flex mb-1">
            <div className="w-[90px] sm:w-[140px] shrink-0" />
            <div className={`flex ${gapSize}`}>
              {dateLabels.map((label, i) => (
                <div
                  key={i}
                  className={`${cellSize} text-[9px] text-muted-foreground flex items-end justify-center`}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Habits grid */}
          {categories.map((category) => (
            <div key={category} className="mb-3">
              <div className="text-xs font-semibold text-muted-foreground mb-1 pl-1">
                {category}
              </div>
              {routinesByCategory[category].map((routine) => {
                const maxCount = getMaxCountForRoutine(routine)
                return (
                  <div key={routine.id} className="flex items-center mb-[2px]">
                    <div className="w-[90px] sm:w-[140px] shrink-0 pr-2 truncate text-xs sm:text-sm">
                      {routine.name}
                    </div>
                    <div className={`flex ${gapSize}`}>
                      {days.map((date) => {
                        const completion = getCompletionForDay(
                          routine.id,
                          date,
                          completions
                        )
                        const isFuture = date > today
                        const isToday = date === today

                        if (isFuture) {
                          return (
                            <div
                              key={date}
                              className={`${cellSize} rounded-sm bg-transparent`}
                            />
                          )
                        }

                        return (
                          <Tooltip key={date}>
                            <TooltipTrigger asChild>
                              <button
                                className={`${cellSize} rounded-sm ${getColorClass(completion, maxCount)} ${
                                  isToday ? 'ring-1 ring-primary' : ''
                                } hover:ring-1 hover:ring-foreground transition-all`}
                                onClick={() => onCellClick?.(routine.id, date)}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-medium">{routine.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {date}
                              </p>
                              <p className="text-xs">
                                {completion}/{maxCount} completed
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center justify-end gap-1 mt-4 text-xs text-muted-foreground">
            <span>Not done</span>
            <div className="w-[12px] h-[12px] rounded-sm bg-muted" />
            <div className="w-[12px] h-[12px] rounded-sm bg-green-200 dark:bg-green-900" />
            <div className="w-[12px] h-[12px] rounded-sm bg-green-400 dark:bg-green-700" />
            <div className="w-[12px] h-[12px] rounded-sm bg-green-600 dark:bg-green-500" />
            <span>Done</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
