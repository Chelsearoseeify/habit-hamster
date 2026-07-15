import { useEffect, useRef, useState } from 'react'
import type { Routine } from '@/types'
import { formatFrequency } from '@/lib/routine-utils'
import { tapHaptic } from '@/lib/haptics'
import { Check } from 'lucide-react'

export interface WheelItem {
  routine: Routine
  maxCount: number
  count: number
  done: boolean
}

interface TaskWheelProps {
  items: WheelItem[]
  /** Index of the current next-action (the centered item). */
  activeIndex: number
  onToggle: (routineId: string, maxCount: number) => void
  reduced: boolean
}

// Drum geometry. Each item sits on a cylinder of radius R, tilted ANGLE° per step.
const ROW_H = 64
const ANGLE = 24
const RADIUS = 150
const MAX_OFFSET = 3

function estimatedMinutes(routine: Routine): number | null {
  const tr = routine.timeRange
  if (!tr?.start || !tr.end) return null
  const [sh, sm] = tr.start.split(':').map(Number)
  const [eh, em] = tr.end.split(':').map(Number)
  const mins = eh * 60 + em - (sh * 60 + sm)
  return mins > 0 ? mins : null
}

/**
 * The Today list as a wheel picker (principle 1, one obvious next thing). The
 * drum auto-centers the next uncompleted task; done tasks rotate up and away,
 * upcoming ones wait below. Tapping the centered task completes it and the wheel
 * advances to the next.
 */
export function TaskWheel({ items, activeIndex, onToggle, reduced }: TaskWheelProps) {
  const transition = reduced ? undefined : 'transform 450ms cubic-bezier(0.22,1,0.36,1), opacity 450ms'

  // Focus follows the auto-centered next action, but scrolling over the wheel
  // lets you browse — without scrolling the page.
  const [focusIndex, setFocusIndex] = useState(activeIndex)
  const containerRef = useRef<HTMLDivElement>(null)
  const accRef = useRef(0)

  useEffect(() => {
    setFocusIndex(activeIndex >= 0 ? activeIndex : 0)
  }, [activeIndex])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault() // keep the page still while the wheel spins
      accRef.current += e.deltaY
      const STEP = 40
      if (accRef.current >= STEP) {
        accRef.current = 0
        setFocusIndex((i) => Math.min(items.length - 1, i + 1))
      } else if (accRef.current <= -STEP) {
        accRef.current = 0
        setFocusIndex((i) => Math.max(0, i - 1))
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [items.length])

  const centerIndex = Math.min(Math.max(focusIndex, 0), items.length - 1)

  return (
    <div
      ref={containerRef}
      className="relative mx-auto w-full select-none overscroll-contain"
      style={{ height: ROW_H * (MAX_OFFSET + 1.2), perspective: 720 }}
      aria-label="Today's tasks"
    >
      {/* Center focus band */}
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-xl border border-primary/25 bg-primary/[0.03]"
        style={{ height: ROW_H }}
      />

      <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
        {items.map((item, idx) => {
          const offset = idx - centerIndex
          if (Math.abs(offset) > MAX_OFFSET) return null
          const isCenter = offset === 0
          const opacity = isCenter ? 1 : Math.max(0.12, 1 - 0.32 * Math.abs(offset))

          return (
            <div
              key={item.routine.id}
              className="absolute inset-x-0 flex items-center justify-center"
              style={{
                height: ROW_H,
                top: `calc(50% - ${ROW_H / 2}px)`,
                transformOrigin: 'center center',
                transform: `rotateX(${-offset * ANGLE}deg) translateZ(${RADIUS}px)`,
                opacity,
                transition,
                pointerEvents: isCenter ? 'auto' : 'none',
              }}
            >
              {isCenter ? (
                <CenterTask item={item} onToggle={onToggle} />
              ) : (
                <FadedTask item={item} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CenterTask({
  item,
  onToggle,
}: {
  item: WheelItem
  onToggle: (routineId: string, maxCount: number) => void
}) {
  const { routine, count, maxCount } = item
  const mins = estimatedMinutes(routine)
  const remaining = maxCount - count

  return (
    <button
      type="button"
      onClick={() => {
        tapHaptic()
        onToggle(routine.id, maxCount)
      }}
      className="flex h-full w-full items-center gap-4 rounded-xl border border-primary/40 bg-card px-5 text-left shadow-sm transition-transform duration-100 active:scale-[0.98]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-primary text-primary">
        <Check className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-lg font-semibold leading-tight">{routine.name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {routine.category ? `${routine.category} · ` : ''}
          {formatFrequency(routine)}
          {mins ? ` · ~${mins} min` : ''}
          {maxCount > 1 ? ` · ${remaining} left` : ''}
        </span>
      </span>
    </button>
  )
}

function FadedTask({ item }: { item: WheelItem }) {
  const { routine, done } = item
  return (
    <div className="flex h-full w-full items-center gap-3 px-5">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          done ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
        }`}
      >
        {done && <Check className="h-3 w-3" />}
      </span>
      <span className={`truncate text-sm ${done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
        {routine.name}
      </span>
    </div>
  )
}
