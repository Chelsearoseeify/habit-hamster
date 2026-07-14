import { Card, CardContent } from '@/components/ui/card'
import type { Identity } from '@/types'

interface IdentityCardProps {
  identity: Identity
  votes: number
}

/**
 * Reinforces identity-based habits: every completion is a vote for the person
 * you're becoming. Desired emotion: "I am becoming this person."
 */
export function IdentityCard({ identity, votes }: IdentityCardProps) {
  const headline = identity.statement?.trim() || `Becoming ${identity.name}`

  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-lg font-medium leading-snug">{headline}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {votes === 1
            ? '1 vote so far'
            : `${votes} votes for becoming ${identity.name.toLowerCase()}`}
        </p>
      </CardContent>
    </Card>
  )
}
