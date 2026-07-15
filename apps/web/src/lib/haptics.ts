/**
 * Fire a short haptic tap on supported (mobile) devices; no-op elsewhere.
 * Immediate reward (principle 8) — subtle, not distracting.
 */
export function tapHaptic(pattern: number | number[] = 15): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(pattern)
  }
}
