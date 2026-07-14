import { useState } from 'react'
import type { Identity, Routine, Completion } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { votesForIdentity } from '@/lib/identity-utils'
import { Plus, Trash2 } from 'lucide-react'

interface IdentityManagerProps {
  identities: Identity[]
  routines: Routine[]
  completions: Completion[]
  onAdd: (identity: Omit<Identity, 'id' | 'createdAt'>) => Promise<Identity> | void
  onDelete: (id: string) => void
}

/**
 * Lightweight identity management for the More/Stats area: create the identities
 * you're voting for, then link routines to them via the routine form.
 */
export function IdentityManager({ identities, routines, completions, onAdd, onDelete }: IdentityManagerProps) {
  const [name, setName] = useState('')
  const [statement, setStatement] = useState('')

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd({ name: name.trim(), statement: statement.trim() || undefined })
    setName('')
    setStatement('')
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-1">Identities</h3>
        <p className="text-sm text-muted-foreground">
          The people you're becoming. Link routines to an identity — each completion is a vote.
        </p>
      </div>

      {identities.length > 0 && (
        <div className="divide-y divide-border rounded-xl border overflow-hidden">
          {identities.map((identity) => {
            const linked = routines.filter((r) => r.identityId === identity.id).length
            const votes = votesForIdentity(identity.id, routines, completions)
            return (
              <div key={identity.id} className="flex items-center gap-3 px-4 py-3 bg-card">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{identity.name}</p>
                  {identity.statement && (
                    <p className="text-xs text-muted-foreground truncate">{identity.statement}</p>
                  )}
                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                    {linked} routine{linked === 1 ? '' : 's'} · {votes} vote{votes === 1 ? '' : 's'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(identity.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          })}
        </div>
      )}

      <div className="space-y-2 rounded-xl border p-4">
        <div className="space-y-1">
          <Label htmlFor="identity-name">Name</Label>
          <Input
            id="identity-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., a healthy person"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="identity-statement">Statement (optional)</Label>
          <Input
            id="identity-statement"
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="e.g., I am someone who takes care of my body"
          />
        </div>
        <Button onClick={handleAdd} className="w-full" disabled={!name.trim()}>
          <Plus className="mr-2 h-4 w-4" />
          Add identity
        </Button>
      </div>
    </div>
  )
}
