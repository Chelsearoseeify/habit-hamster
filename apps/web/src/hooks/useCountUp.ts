import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from './useReducedMotion'

/**
 * Animate a number from its previous value toward `target` with an ease-out ramp.
 * Immediate reward (principle 8): counters tick up so the brain registers progress.
 * Reduced motion → jump straight to the value.
 */
export function useCountUp(target: number, durationMs = 500): number {
  const reduced = useReducedMotion()
  const [value, setValue] = useState(target)
  const prevTarget = useRef(target)
  const raf = useRef<number | undefined>(undefined)

  useEffect(() => {
    const from = prevTarget.current
    prevTarget.current = target
    if (reduced || from === target) {
      setValue(target)
      return
    }
    let start: number | null = null
    const step = (ts: number) => {
      if (start === null) start = ts
      const t = Math.min(1, (ts - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(from + (target - from) * eased))
      if (t < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [target, durationMs, reduced])

  return value
}
