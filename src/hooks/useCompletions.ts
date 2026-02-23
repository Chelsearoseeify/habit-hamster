import { useState, useEffect, useCallback } from 'react'
import type { Completion, Routine, FrequencyType } from '@/types'
import { getCompletions, saveCompletions } from '@/lib/storage'
import { parseDate, getDayOfWeek, addDays } from '@/lib/date-utils'

export function useCompletions() {
  const [completions, setCompletions] = useState<Completion[]>([])

  useEffect(() => {
    getCompletions().then(setCompletions)
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

/**
 * Returns true if the given routine should appear on the given date.
 *
 * For `interval` routines the logic is:
 * 1. Find the most recent completion for this routine.
 * 2. Add `frequency.days` to get the earliest date it can appear again.
 * 3. If `preferredDays` are set, only show it on those weekdays — but once
 *    the first eligible preferred day has passed without a completion, show
 *    it every day until it gets checked off.
 *
 * For all other frequency types `completions` is not used.
 */
export function isRoutineDueOnDate(
  routine: Pick<Routine, 'id' | 'frequency' | 'preferredDays' | 'paused'>,
  date: string,
  completions: Completion[] = []
): boolean {
  if (routine.paused) return false
  const { frequency } = routine
  const d = parseDate(date)
  const dayOfWeek = getDayOfWeek(d)

  switch (frequency.type) {
    case 'daily':
      return true
    case 'weekly':
      return true
    case 'weekdays':
      return frequency.days.includes(dayOfWeek)
    case 'interval': {
      // Find the most recent completion for this routine
      const routineCompletions = completions
        .filter((c) => c.routineId === routine.id && c.count > 0)
        .sort((a, b) => (a.date < b.date ? 1 : -1))

      let earliestDueDate: Date

      if (routineCompletions.length === 0) {
        // Never done — always show (app start state)
        return true
      } else {
        const lastDoneDate = parseDate(routineCompletions[0].date)
        earliestDueDate = addDays(lastDoneDate, frequency.days)
      }

      // Not yet due
      if (d < earliestDueDate) return false

      // Due — check preferred days
      const preferred = routine.preferredDays
      if (!preferred || preferred.length === 0) return true

      // Show immediately if today is a preferred day
      if (preferred.includes(dayOfWeek)) return true

      // Find the first preferred day on or after earliestDueDate
      let firstPreferredDate = new Date(earliestDueDate)
      for (let i = 0; i < 7; i++) {
        if (preferred.includes(getDayOfWeek(firstPreferredDate))) break
        firstPreferredDate = addDays(firstPreferredDate, 1)
      }

      // If we're past that first preferred day without a completion, show daily
      return d > firstPreferredDate
    }
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
