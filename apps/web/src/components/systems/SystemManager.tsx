import { useState } from 'react'
import type { System, Identity, Routine } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'

const NO_IDENTITY = 'none'

interface SystemManagerProps {
  systems: System[]
  identities: Identity[]
  routines: Routine[]
  onAdd: (system: Omit<System, 'id' | 'createdAt'>) => Promise<System> | void
  onEdit: (id: string, updates: Partial<Omit<System, 'id' | 'createdAt'>>) => void
  onDelete: (id: string) => void
  onAssignRoutine: (routineId: string, systemId: string | null) => void
}

/**
 * Systems over goals (principle 3). A system is a repeatable set of routines that
 * serves an identity — the layer between Identity and Routine. Create systems here,
 * edit them, and link routines directly from the edit view.
 */
export function SystemManager({ systems, identities, routines, onAdd, onEdit, onDelete, onAssignRoutine }: SystemManagerProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [identityId, setIdentityId] = useState<string>(NO_IDENTITY)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editIdentityId, setEditIdentityId] = useState<string>(NO_IDENTITY)

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd({
      name: name.trim(),
      description: description.trim() || undefined,
      identityId: identityId === NO_IDENTITY ? null : identityId,
    })
    setName('')
    setDescription('')
    setIdentityId(NO_IDENTITY)
  }

  const startEdit = (system: System) => {
    setEditingId(system.id)
    setEditName(system.name)
    setEditDescription(system.description ?? '')
    setEditIdentityId(system.identityId ?? NO_IDENTITY)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditDescription('')
    setEditIdentityId(NO_IDENTITY)
  }

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return
    onEdit(editingId, {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      identityId: editIdentityId === NO_IDENTITY ? null : editIdentityId,
    })
    cancelEdit()
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-1">Systems</h3>
        <p className="text-sm text-muted-foreground">
          Repeatable systems you trust. Link routines to a system — systems outlast goals.
        </p>
      </div>

      {systems.length > 0 && (
        <div className="divide-y divide-border rounded-xl border overflow-hidden">
          {systems.map((system) => {
            const linked = routines.filter((r) => r.systemId === system.id).length
            const identity = identities.find((i) => i.id === system.identityId)

            if (editingId === system.id) {
              return (
                <div key={system.id} className="px-4 py-3 bg-card space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0 space-y-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Name"
                      />
                      <Input
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description (optional)"
                      />
                      {identities.length > 0 && (
                        <Select value={editIdentityId} onValueChange={setEditIdentityId}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NO_IDENTITY}>Serves no identity</SelectItem>
                            {identities.map((i) => (
                              <SelectItem key={i.id} value={i.id}>
                                Serves {i.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
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
                    <Label className="text-xs text-muted-foreground">Routines in this system</Label>
                    {routines.length === 0 ? (
                      <p className="text-xs text-muted-foreground/70">No routines yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {routines.map((r) => {
                          const linkedHere = r.systemId === system.id
                          const linkedElsewhere = !!r.systemId && !linkedHere
                          return (
                            <label key={r.id} className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={linkedHere}
                                onCheckedChange={(v) =>
                                  onAssignRoutine(r.id, v === true ? system.id : null)
                                }
                              />
                              <span className="text-sm truncate">{r.name}</span>
                              {linkedElsewhere && (
                                <span className="text-xs text-muted-foreground/60 shrink-0">
                                  (in another system)
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
              <div key={system.id} className="flex items-center gap-3 px-4 py-3 bg-card">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{system.name}</p>
                  {system.description && (
                    <p className="text-xs text-muted-foreground truncate">{system.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                    {linked} routine{linked === 1 ? '' : 's'}
                    {identity ? ` · serves ${identity.name}` : ''}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => startEdit(system)}
                  aria-label="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(system.id)}
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
          <Label htmlFor="system-name">Name</Label>
          <Input
            id="system-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Movement system"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="system-description">Description (optional)</Label>
          <Input
            id="system-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., how I keep moving every day"
          />
        </div>
        {identities.length > 0 && (
          <div className="space-y-1">
            <Label htmlFor="system-identity">Serves identity (optional)</Label>
            <Select value={identityId} onValueChange={setIdentityId}>
              <SelectTrigger id="system-identity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_IDENTITY}>None</SelectItem>
                {identities.map((identity) => (
                  <SelectItem key={identity.id} value={identity.id}>
                    {identity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Button onClick={handleAdd} className="w-full" disabled={!name.trim()}>
          <Plus className="mr-2 h-4 w-4" />
          Add system
        </Button>
      </div>
    </div>
  )
}
