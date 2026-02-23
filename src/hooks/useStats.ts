import { useMemo } from 'react'
import type { Routine, Completion } from '@/types'
import { isRoutineDueOnDate, getMaxCountForRoutine } from './useCompletions'
import { formatDate, getDaysInRange, getYearStart } from '@/lib/date-utils'

export function useStats(routines: Routine[], completions: Completion[]) {
  const heatmapData = useMemo(() => {
    const data: Record<string, number> = {}
    const today = new Date()
    const yearStart = getYearStart(today)
    const days = getDaysInRange(yearStart, today)

    for (const date of days) {
      const dueRoutines = routines.filter((r) => isRoutineDueOnDate(r, date, completions))
      if (dueRoutines.length === 0) {
        data[date] = 0
        continue
      }

      let totalExpected = 0
      let totalCompleted = 0

      for (const routine of dueRoutines) {
        const maxCount = getMaxCountForRoutine(routine)
        const completion = completions.find(
          (c) => c.routineId === routine.id && c.date === date
        )
        totalExpected += maxCount
        totalCompleted += Math.min(completion?.count ?? 0, maxCount)
      }

      data[date] = totalExpected > 0 ? (totalCompleted / totalExpected) * 100 : 0
    }

    return data
  }, [routines, completions])

  const todayStats = useMemo(() => {
    const today = formatDate(new Date())
    const dueRoutines = routines.filter((r) => isRoutineDueOnDate(r, today, completions))

    let totalExpected = 0
    let totalCompleted = 0

    for (const routine of dueRoutines) {
      const maxCount = getMaxCountForRoutine(routine)
      const completion = completions.find(
        (c) => c.routineId === routine.id && c.date === today
      )
      totalExpected += maxCount
      totalCompleted += Math.min(completion?.count ?? 0, maxCount)
    }

    return {
      total: dueRoutines.length,
      completed: dueRoutines.filter((r) => {
        const completion = completions.find(
          (c) => c.routineId === r.id && c.date === today
        )
        return (completion?.count ?? 0) >= getMaxCountForRoutine(r)
      }).length,
      percentage: totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0,
    }
  }, [routines, completions])

  const streak = useMemo(() => {
    if (routines.length === 0) return 0

    let currentStreak = 0
    const today = new Date()
    const checkDate = new Date(today)
    let daysChecked = 0
    const maxDays = 400

    while (daysChecked < maxDays) {
      daysChecked++
      const dateStr = formatDate(checkDate)
      const dueRoutines = routines.filter((r) => isRoutineDueOnDate(r, dateStr, completions))

      if (dueRoutines.length === 0) {
        checkDate.setDate(checkDate.getDate() - 1)
        continue
      }

      const allCompleted = dueRoutines.every((r) => {
        const completion = completions.find(
          (c) => c.routineId === r.id && c.date === dateStr
        )
        return (completion?.count ?? 0) >= getMaxCountForRoutine(r)
      })

      if (allCompleted) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        if (dateStr === formatDate(today)) {
          checkDate.setDate(checkDate.getDate() - 1)
          continue
        }
        break
      }
    }

    return currentStreak
  }, [routines, completions])

  return {
    heatmapData,
    todayStats,
    streak,
  }
}
