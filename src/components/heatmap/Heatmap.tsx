import { useMemo } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatDate, formatMonthShort, getWeeksInYear } from '@/lib/date-utils'

interface HeatmapProps {
  data: Record<string, number>
  year?: number
  onDayClick?: (date: string) => void
}

function getColorClass(percentage: number): string {
  if (percentage === 0) return 'bg-muted'
  if (percentage <= 25) return 'bg-green-200 dark:bg-green-900'
  if (percentage <= 50) return 'bg-green-400 dark:bg-green-700'
  if (percentage <= 75) return 'bg-green-500 dark:bg-green-600'
  return 'bg-green-600 dark:bg-green-500'
}

export function Heatmap({ data, year, onDayClick }: HeatmapProps) {
  const currentYear = year ?? new Date().getFullYear()
  const weeks = useMemo(() => getWeeksInYear(currentYear), [currentYear])
  const today = formatDate(new Date())

  const monthLabels = useMemo(() => {
    const labels: { month: string; weekIndex: number }[] = []
    let lastMonth = -1

    weeks.forEach((week, weekIndex) => {
      const firstDayOfWeek = week[0]
      if (firstDayOfWeek.getFullYear() === currentYear) {
        const month = firstDayOfWeek.getMonth()
        if (month !== lastMonth) {
          labels.push({ month: formatMonthShort(month), weekIndex })
          lastMonth = month
        }
      }
    })

    return labels
  }, [weeks, currentYear])

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <div className="inline-block">
          <div className="flex text-xs text-muted-foreground mb-1 ml-8">
            {monthLabels.map(({ month, weekIndex }) => (
              <div
                key={`${month}-${weekIndex}`}
                className="absolute"
                style={{ marginLeft: `${weekIndex * 14 + 32}px` }}
              >
                {month}
              </div>
            ))}
          </div>
          <div className="flex gap-[2px] mt-6">
            <div className="flex flex-col gap-[2px] text-xs text-muted-foreground mr-2">
              <div className="h-[12px]"></div>
              <div className="h-[12px] leading-[12px]">Mon</div>
              <div className="h-[12px]"></div>
              <div className="h-[12px] leading-[12px]">Wed</div>
              <div className="h-[12px]"></div>
              <div className="h-[12px] leading-[12px]">Fri</div>
              <div className="h-[12px]"></div>
            </div>
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[2px]">
                {week.map((day, dayIndex) => {
                  const dateStr = formatDate(day)
                  const percentage = data[dateStr] ?? 0
                  const isCurrentYear = day.getFullYear() === currentYear
                  const isFuture = dateStr > today
                  const isToday = dateStr === today

                  if (!isCurrentYear || isFuture) {
                    return (
                      <div
                        key={dayIndex}
                        className="w-[12px] h-[12px] rounded-sm bg-transparent"
                      />
                    )
                  }

                  return (
                    <Tooltip key={dayIndex}>
                      <TooltipTrigger asChild>
                        <button
                          className={`w-[12px] h-[12px] rounded-sm ${getColorClass(percentage)} ${
                            isToday ? 'ring-1 ring-foreground' : ''
                          } hover:ring-1 hover:ring-foreground transition-all`}
                          onClick={() => onDayClick?.(dateStr)}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{dateStr}</p>
                        <p className="text-xs text-muted-foreground">
                          {percentage === 0
                            ? 'No completions'
                            : `${Math.round(percentage)}% completed`}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-1 mt-2 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="w-[12px] h-[12px] rounded-sm bg-muted" />
            <div className="w-[12px] h-[12px] rounded-sm bg-green-200 dark:bg-green-900" />
            <div className="w-[12px] h-[12px] rounded-sm bg-green-400 dark:bg-green-700" />
            <div className="w-[12px] h-[12px] rounded-sm bg-green-500 dark:bg-green-600" />
            <div className="w-[12px] h-[12px] rounded-sm bg-green-600 dark:bg-green-500" />
            <span>More</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
