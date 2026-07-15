import { useState } from 'react'
import type { System, Identity, Routine } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'

const NO_IDENTITY = 'none'

interface SystemManagerProps {
  systems: System[]
  identities: Identity[]
  routines: Routine[]
  onAdd: (system: Omit<System, 'id' | 'createdAt'>) => Promise<System> | void
  onDelete: (id: string) => void
}

/**
 * Systems over goals (principle 3). A system is a repeatable set of routines that
 * serves an identity — the layer between Identity and Routine. Create systems here,
 * then link routines to them via the routine form.
 */
export function SystemManager({ systems, identities, routines, onAdd, onDelete }: SystemManagerProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [identityId, setIdentityId] = useState<string>(NO_IDENTITY)

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
                  className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(system.id)}
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
            placeholder="e.g., Morning system"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="system-description">Description (optional)</Label>
          <Input
            id="system-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., how I start every day"
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
