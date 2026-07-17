import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { HealthMetric } from '@/types'
import type { TodayMetrics } from '@/hooks/useHealthData'
import type { SyncOutcome } from '@/lib/health-sync'
import { Footprints, Dumbbell, Moon, MapPin, RefreshCw, HeartPulse } from 'lucide-react'

interface HealthMetricsCardProps {
  todayMetrics: TodayMetrics
  available: boolean
  syncing: boolean
  lastResult: SyncOutcome | null
  onSync: () => void
}

const METRIC_META: Record<
  HealthMetric,
  { label: string; icon: typeof Footprints; format: (v: number) => string }
> = {
  steps: { label: 'Steps', icon: Footprints, format: (v) => v.toLocaleString() },
  distance_m: { label: 'Distance', icon: MapPin, format: (v) => `${(v / 1000).toFixed(1)} km` },
  exercise_min: { label: 'Exercise', icon: Dumbbell, format: (v) => `${Math.round(v)} min` },
  sleep_min: {
    label: 'Sleep',
    icon: Moon,
    format: (v) => `${Math.floor(v / 60)}h ${Math.round(v % 60)}m`,
  },
}

const ORDER: HealthMetric[] = ['steps', 'distance_m', 'exercise_min', 'sleep_min']

export function HealthMetricsCard({
  todayMetrics,
  available,
  syncing,
  lastResult,
  onSync,
}: HealthMetricsCardProps) {
  const hasData = ORDER.some((m) => todayMetrics[m] !== undefined)

  // Nothing to show and can't sync (plain web build) → render nothing.
  if (!available && !hasData) return null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <HeartPulse className="h-4 w-4" />
          Samsung Health · Today
        </CardTitle>
        {available && (
          <Button variant="ghost" size="sm" onClick={onSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 sm:mr-2 ${syncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{syncing ? 'Syncing…' : 'Sync'}</span>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ORDER.filter((m) => todayMetrics[m] !== undefined).map((m) => {
              const meta = METRIC_META[m]
              const Icon = meta.icon
              return (
                <div key={m} className="flex flex-col gap-1">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                    {meta.label}
                  </span>
                  <span className="text-xl font-bold">{meta.format(todayMetrics[m]!)}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No data yet — tap Sync to pull from Samsung Health.
          </p>
        )}
        {lastResult && lastResult.completed.length > 0 && (
          <p className="mt-3 text-xs text-primary">
            ✓ Auto-completed {lastResult.completed.length}{' '}
            {lastResult.completed.length === 1 ? 'habit' : 'habits'} from your activity.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
