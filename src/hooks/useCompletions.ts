import { useState, useEffect, useCallback } from 'react'
import type { Completion, Routine, FrequencyType } from '@/types'
import { getCompletions, saveCompletions } from '@/lib/storage'
import { parseDate, getDayOfWeek } from '@/lib/date-utils'

export function useCompletions() {
  const [completions, setCompletions] = useState<Completion[]>([])

  useEffect(() => {
    setCompletions(getCompletions())
  }, [])

  const getCompletion = useCallback(
    (routineId: string, date: string): Completion | undefined => {
      return completions.find((c) => c.routineId === routineId && c.date === date)
    },
    [completions]
  )

  const toggleCompletion = useCallback((routineId: string, date: string, maxCount: number = 1) => {
    setCompletions((prev) => {
      const existing = prev.find((c) => c.routineId === routineId && c.date === date)

      let updated: Completion[]
      if (!existing) {
        updated = [...prev, { routineId, date, count: 1 }]
      } else if (existing.count < maxCount) {
        updated = prev.map((c) =>
          c.routineId === routineId && c.date === date ? { ...c, count: c.count + 1 } : c
        )
      } else {
        updated = prev.filter((c) => !(c.routineId === routineId && c.date === date))
      }

      saveCompletions(updated)
      return updated
    })
  }, [])

  const setCompletionCount = useCallback((routineId: string, date: string, count: number) => {
    setCompletions((prev) => {
      let updated: Completion[]
      if (count <= 0) {
        updated = prev.filter((c) => !(c.routineId === routineId && c.date === date))
      } else {
        const existing = prev.find((c) => c.routineId === routineId && c.date === date)
        if (existing) {
          updated = prev.map((c) =>
            c.routineId === routineId && c.date === date ? { ...c, count } : c
          )
        } else {
          updated = [...prev, { routineId, date, count }]
        }
      }
      saveCompletions(updated)
      return updated
    })
  }, [])

  const getCompletionsForDate = useCallback(
    (date: string): Completion[] => {
      return completions.filter((c) => c.date === date)
    },
    [completions]
  )

  return {
    completions,
    getCompletion,
    toggleCompletion,
    setCompletionCount,
    getCompletionsForDate,
  }
}

export function getExpectedCount(frequency: FrequencyType, date: string): number {
  const d = parseDate(date)
  const dayOfWeek = getDayOfWeek(d)

  switch (frequency.type) {
    case 'daily':
      return frequency.timesPerDay
    case 'weekly':
      return frequency.timesPerWeek / 7
    case 'weekdays':
      return frequency.days.includes(dayOfWeek) ? 1 : 0
    case 'interval':
      return 1 / frequency.days
    default:
      return 0
  }
}

export function isRoutineDueOnDate(frequency: FrequencyType, date: string): boolean {
  const d = parseDate(date)
  const dayOfWeek = getDayOfWeek(d)

  switch (frequency.type) {
    case 'daily':
      return true
    case 'weekly':
      return true
    case 'weekdays':
      return frequency.days.includes(dayOfWeek)
    case 'interval':
      return true
    default:
      return false
  }
}

export function getMaxCountForRoutine(routine: Routine): number {
  switch (routine.frequency.type) {
    case 'daily':
      return routine.frequency.timesPerDay
    case 'weekly':
      return 1
    case 'weekdays':
      return 1
    case 'interval':
      return 1
    default:
      return 1
  }
}
