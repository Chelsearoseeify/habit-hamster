import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import type { Routine, FrequencyType } from '@/types'
import { CATEGORIES } from '@/types'
import { Plus } from 'lucide-react'

interface RoutineFormProps {
  onSubmit: (routine: Omit<Routine, 'id' | 'createdAt'>) => void
  initialData?: Routine
  trigger?: React.ReactNode
}

const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
]

export function RoutineForm({ onSubmit, initialData, trigger }: RoutineFormProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(initialData?.name ?? '')
  const [category, setCategory] = useState(initialData?.category ?? CATEGORIES[0])
  const [frequencyType, setFrequencyType] = useState<FrequencyType['type']>(
    initialData?.frequency.type ?? 'daily'
  )
  const [timesPerDay, setTimesPerDay] = useState(
    initialData?.frequency.type === 'daily' ? initialData.frequency.timesPerDay : 1
  )
  const [timesPerWeek, setTimesPerWeek] = useState(
    initialData?.frequency.type === 'weekly' ? initialData.frequency.timesPerWeek : 3
  )
  const [weekdays, setWeekdays] = useState<number[]>(
    initialData?.frequency.type === 'weekdays' ? initialData.frequency.days : [1, 3, 5]
  )
  const [intervalDays, setIntervalDays] = useState(
    initialData?.frequency.type === 'interval' ? initialData.frequency.days : 30
  )
  const [preferredDays, setPreferredDays] = useState<number[]>(initialData?.preferredDays ?? [])
  const [timeStart, setTimeStart] = useState(initialData?.timeRange?.start ?? '')
  const [timeEnd, setTimeEnd] = useState(initialData?.timeRange?.end ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    let frequency: FrequencyType
    switch (frequencyType) {
      case 'daily':
        frequency = { type: 'daily', timesPerDay }
        break
      case 'weekly':
        frequency = { type: 'weekly', timesPerWeek }
        break
      case 'weekdays':
        frequency = { type: 'weekdays', days: weekdays }
        break
      case 'interval':
        frequency = { type: 'interval', days: intervalDays }
        break
    }

    const timeRange = timeStart
      ? { start: timeStart, ...(timeEnd ? { end: timeEnd } : {}) }
      : undefined
    onSubmit({ name: name.trim(), category, frequency, timeRange, preferredDays: preferredDays.length > 0 ? preferredDays : undefined, description: description.trim() || undefined })
    setOpen(false)
    resetForm()
  }

  const resetForm = () => {
    if (!initialData) {
      setName('')
      setCategory(CATEGORIES[0])
      setFrequencyType('daily')
      setTimesPerDay(1)
      setTimesPerWeek(3)
      setWeekdays([1, 3, 5])
      setIntervalDays(30)
      setPreferredDays([])
      setTimeStart('')
      setTimeEnd('')
      setDescription('')
    }
  }

  const toggleWeekday = (day: number) => {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Routine
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Routine' : 'Add New Routine'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Morning run"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes, reminders, details..."
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Frequency</Label>
            <RadioGroup
              value={frequencyType}
              onValueChange={(v) => setFrequencyType(v as FrequencyType['type'])}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="daily" id="daily" />
                <Label htmlFor="daily" className="font-normal">
                  Daily
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly" className="font-normal">
                  Times per week
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekdays" id="weekdays" />
                <Label htmlFor="weekdays" className="font-normal">
                  Specific days
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="interval" id="interval" />
                <Label htmlFor="interval" className="font-normal">
                  Every X days
                </Label>
              </div>
            </RadioGroup>
          </div>

          {frequencyType === 'daily' && (
            <div className="space-y-2">
              <Label htmlFor="timesPerDay">Times per day</Label>
              <Input
                id="timesPerDay"
                type="number"
                min={1}
                max={10}
                value={timesPerDay}
                onChange={(e) => setTimesPerDay(Number(e.target.value))}
              />
            </div>
          )}

          {frequencyType === 'weekly' && (
            <div className="space-y-2">
              <Label htmlFor="timesPerWeek">Times per week</Label>
              <Input
                id="timesPerWeek"
                type="number"
                min={1}
                max={7}
                value={timesPerWeek}
                onChange={(e) => setTimesPerWeek(Number(e.target.value))}
              />
            </div>
          )}

          {frequencyType === 'weekdays' && (
            <div className="space-y-2">
              <Label>Select days</Label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => (
                  <label
                    key={day.value}
                    className="flex items-center space-x-1 cursor-pointer"
                  >
                    <Checkbox
                      checked={weekdays.includes(day.value)}
                      onCheckedChange={() => toggleWeekday(day.value)}
                    />
                    <span className="text-sm">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {frequencyType === 'interval' && (
            <div className="space-y-2">
              <Label htmlFor="intervalDays">Every X days</Label>
              <Input
                id="intervalDays"
                type="number"
                min={1}
                max={365}
                value={intervalDays}
                onChange={(e) => setIntervalDays(Number(e.target.value))}
              />
            </div>
          )}

          {frequencyType !== 'weekdays' && (
            <div className="space-y-2">
              <Label>Preferred days (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => (
                  <label key={day.value} className="flex items-center space-x-1 cursor-pointer">
                    <Checkbox
                      checked={preferredDays.includes(day.value)}
                      onCheckedChange={() =>
                        setPreferredDays((prev) =>
                          prev.includes(day.value)
                            ? prev.filter((d) => d !== day.value)
                            : [...prev, day.value].sort()
                        )
                      }
                    />
                    <span className="text-sm">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Time range (optional)</Label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                type="time"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                className="w-full"
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="time"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            {initialData ? 'Save Changes' : 'Add Routine'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
