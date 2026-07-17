import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { useUserName, greetingFor } from '@/hooks/useUserName'

const EMOJI: Record<string, string> = {
  'Good morning': '☀️',
  'Good afternoon': '☀️',
  'Good evening': '🌙',
}

/** Live "Thursday, July 16 · 6:24 PM" — the current day and hour. */
function formatNow(d: Date): string {
  const day = d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return `${day} · ${time}`
}

/**
 * The homepage opener: a time-of-day greeting, the user's name (click to edit),
 * and the current day and hour as a quiet subtitle.
 */
export function GreetingHeader() {
  const { name, setName } = useUserName()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)
  const [now, setNow] = useState(() => new Date())
  const inputRef = useRef<HTMLInputElement>(null)

  const greeting = greetingFor(now)
  const emoji = EMOJI[greeting]

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  // Tick the clock every 30s so the hour stays current.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  const startEdit = () => {
    setDraft(name)
    setEditing(true)
  }
  const commit = () => {
    setName(draft)
    setEditing(false)
  }

  return (
    <div>
      {editing ? (
        <Input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') setEditing(false)
          }}
          placeholder="Your name"
          className="max-w-[16rem] text-2xl font-bold h-auto py-1"
        />
      ) : (
        <h1 className="text-2xl font-bold">
          {greeting}
          {name ? (
            <>
              ,{' '}
              <button
                type="button"
                onClick={startEdit}
                className="underline decoration-dotted decoration-muted-foreground/40 underline-offset-4 hover:decoration-foreground"
              >
                {name}
              </button>
            </>
          ) : (
            <>
              {' '}
              <button
                type="button"
                onClick={startEdit}
                className="text-base font-normal text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-foreground"
              >
                add your name
              </button>
            </>
          )}{' '}
          {emoji}
        </h1>
      )}
      <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">{formatNow(now)}</p>
    </div>
  )
}
