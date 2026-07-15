import type { Routine, Completion } from '@/types'
import { isRoutineDueOnDate, getMaxCountForRoutine } from '@/hooks/useCompletions'

/**
 * Chunking (principle 4). The day is split into time-of-day blocks derived from
 * each routine's start time — matching the Morning/Afternoon/Evening convention
 * already used by insights.ts. Routines with no time land in "Anytime", shown last.
 * Now reveals one block at a time: finish the current block before the next appears.
 */
export type BlockName = 'Morning' | 'Afternoon' | 'Evening' | 'Anytime'

export const BLOCK_ORDER: BlockName[] = ['Morning', 'Afternoon', 'Evening', 'Anytime']

export function blockForRoutine(r: Routine): BlockName {
  const start = r.timeRange?.start
  if (!start) return 'Anytime'
  const h = Number(start.split(':')[0])
  if (Number.isNaN(h)) return 'Anytime'
  return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening'
}

export interface DayBlock {
  name: BlockName
  /** Due today, not yet complete, sorted by start time. */
  remaining: Routine[]
  completed: number
  /** Total due today in this block. */
  total: number
}

function isComplete(r: Routine, completions: Completion[], today: string): boolean {
  const c = completions.find((x) => x.routineId === r.id && x.date === today)
  return (c?.count ?? 0) >= getMaxCountForRoutine(r)
}

/** Group today's due routines into ordered time-of-day blocks. */
export function buildDayBlocks(
  routines: Routine[],
  completions: Completion[],
  today: string
): DayBlock[] {
  const due = routines.filter((r) => isRoutineDueOnDate(r, today, completions))
  const byBlock = new Map<BlockName, Routine[]>()
  for (const r of due) {
    const b = blockForRoutine(r)
    const arr = byBlock.get(b) ?? []
    arr.push(r)
    byBlock.set(b, arr)
  }

  const blocks: DayBlock[] = []
  for (const name of BLOCK_ORDER) {
    const list = byBlock.get(name)
    if (!list || list.length === 0) continue
    const remaining = list
      .filter((r) => !isComplete(r, completions, today))
      .sort((a, b) =>
        (a.timeRange?.start ?? '99:99').localeCompare(b.timeRange?.start ?? '99:99')
      )
    blocks.push({
      name,
      remaining,
      completed: list.length - remaining.length,
      total: list.length,
    })
  }
  return blocks
}

/** The block the user is working through now: the first with remaining actions. */
export function currentBlock(blocks: DayBlock[]): DayBlock | null {
  return blocks.find((b) => b.remaining.length > 0) ?? null
}
