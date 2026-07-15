import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { useUserName, greetingFor } from '@/hooks/useUserName'

const EMOJI: Record<string, string> = {
  'Good morning': '☀️',
  'Good afternoon': '☀️',
  'Good evening': '🌙',
}

/**
 * The homepage opener: a time-of-day greeting, the user's name (click to edit),
 * and their identity "why" as a quiet subtitle. Identity is the reason, not the
 * scene — so it sits small under the greeting.
 */
export function GreetingHeader({ why }: { why: string }) {
  const { name, setName } = useUserName()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)
  const inputRef = useRef<HTMLInputElement>(null)

  const greeting = greetingFor(new Date())
  const emoji = EMOJI[greeting]

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

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
      <p className="mt-0.5 text-sm text-muted-foreground">{why}</p>
    </div>
  )
}
