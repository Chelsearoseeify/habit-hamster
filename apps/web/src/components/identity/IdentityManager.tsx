import { useState } from 'react'
import type { Identity, Routine, Completion } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { votesForIdentity } from '@/lib/identity-utils'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'

interface IdentityManagerProps {
  identities: Identity[]
  routines: Routine[]
  completions: Completion[]
  onAdd: (identity: Omit<Identity, 'id' | 'createdAt'>) => Promise<Identity> | void
  onEdit: (id: string, updates: Partial<Omit<Identity, 'id' | 'createdAt'>>) => void
  onDelete: (id: string) => void
  onAssignRoutine: (routineId: string, identityId: string | null) => void
}

/**
 * Lightweight identity management for the More/Stats area: create the identities
 * you're voting for, then link routines to them via the routine form.
 */
export function IdentityManager({ identities, routines, completions, onAdd, onEdit, onDelete, onAssignRoutine }: IdentityManagerProps) {
  const [name, setName] = useState('')
  const [statement, setStatement] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editStatement, setEditStatement] = useState('')

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd({ name: name.trim(), statement: statement.trim() || undefined })
    setName('')
    setStatement('')
  }

  const startEdit = (identity: Identity) => {
    setEditingId(identity.id)
    setEditName(identity.name)
    setEditStatement(identity.statement ?? '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditStatement('')
  }

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return
    onEdit(editingId, { name: editName.trim(), statement: editStatement.trim() || undefined })
    cancelEdit()
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

            if (editingId === identity.id) {
              return (
                <div key={identity.id} className="px-4 py-3 bg-card space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0 space-y-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Name"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit()
                          if (e.key === 'Escape') cancelEdit()
                        }}
                      />
                      <Input
                        value={editStatement}
                        onChange={(e) => setEditStatement(e.target.value)}
                        placeholder="Statement (optional)"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit()
                          if (e.key === 'Escape') cancelEdit()
                        }}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={saveEdit}
                      disabled={!editName.trim()}
                      aria-label="Save"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={cancelEdit}
                      aria-label="Cancel"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Routines voting for this identity</Label>
                    {routines.length === 0 ? (
                      <p className="text-xs text-muted-foreground/70">No routines yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {routines.map((r) => {
                          const linkedHere = r.identityId === identity.id
                          const linkedElsewhere = !!r.identityId && !linkedHere
                          return (
                            <label key={r.id} className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={linkedHere}
                                onCheckedChange={(v) =>
                                  onAssignRoutine(r.id, v === true ? identity.id : null)
                                }
                              />
                              <span className="text-sm truncate">{r.name}</span>
                              {linkedElsewhere && (
                                <span className="text-xs text-muted-foreground/60 shrink-0">
                                  (linked elsewhere)
                                </span>
                              )}
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            }

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
                  className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => startEdit(identity)}
                  aria-label="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(identity.id)}
                  aria-label="Delete"
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
