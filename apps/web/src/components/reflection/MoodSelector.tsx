import { useState } from 'react'
import type { Mood, Reflection } from '@/types'
import { Input } from '@/components/ui/input'

interface MoodSelectorProps {
  reflection?: Reflection
  onChange: (mood: Mood, note?: string) => void
  /** Hide the built-in "How did today feel?" line when the container supplies its own. */
  hidePrompt?: boolean
}

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 'good', emoji: '😀', label: 'Good' },
  { value: 'neutral', emoji: '😐', label: 'Okay' },
  { value: 'bad', emoji: '😞', label: 'Hard' },
]

/**
 * Gentle daily reflection: how did today feel? Optional note. No pressure —
 * tapping a mood is enough; the note reveals only once a mood is chosen.
 */
export function MoodSelector({ reflection, onChange, hidePrompt }: MoodSelectorProps) {
  const [note, setNote] = useState(reflection?.note ?? '')
  const selected = reflection?.mood

  return (
    <div className="space-y-3">
      {!hidePrompt && <p className="text-sm text-muted-foreground">How did today feel?</p>}
      <div className="flex gap-3">
        {MOODS.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => onChange(m.value, note || undefined)}
            aria-pressed={selected === m.value}
            aria-label={m.label}
            className={`flex-1 rounded-xl border py-3 text-2xl transition-colors ${
              selected === m.value
                ? 'border-primary bg-primary/10'
                : 'border-border hover:bg-muted/50'
            }`}
          >
            {m.emoji}
          </button>
        ))}
      </div>
      {selected && (
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => onChange(selected, note || undefined)}
          placeholder="Add a note (optional)"
        />
      )}
    </div>
  )
}
