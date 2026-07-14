import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDate, addDays, parseDate } from '@/lib/date-utils'
import type { Routine, Completion } from '@/types'
import { RoutineList } from '@/components/routines/RoutineList'

interface DayViewProps {
  date: string
  onDateChange: (date: string) => void
  routinesByCategory: Record<string, Routine[]>
  completions: Completion[]
  onToggle: (routineId: string, maxCount: number) => void
  onDelete: (routineId: string) => void
}

export function DayView({
  date,
  onDateChange,
  routinesByCategory,
  completions,
  onToggle,
  onDelete,
}: DayViewProps) {
  const today = formatDate(new Date())
  const isToday = date === today

  const goToPrevious = () => {
    onDateChange(formatDate(addDays(parseDate(date), -1)))
  }

  const goToNext = () => {
    onDateChange(formatDate(addDays(parseDate(date), 1)))
  }

  const goToToday = () => {
    onDateChange(today)
  }

  const formatDisplayDate = (dateStr: string) => {
    const d = parseDate(dateStr)
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={goToPrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <h2 className="font-semibold text-sm sm:text-base">{formatDisplayDate(date)}</h2>
          {!isToday && (
            <Button variant="link" size="sm" onClick={goToToday}>
              Go to today
            </Button>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={goToNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <RoutineList
        routinesByCategory={routinesByCategory}
        completions={completions}
        date={date}
        onToggle={onToggle}
        onDelete={onDelete}
      />
    </div>
  )
}
