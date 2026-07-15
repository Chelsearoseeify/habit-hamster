import { useMemo, useState } from 'react'
import type { Routine, Completion, Reflection, Identity } from '@/types'
import { Button } from '@/components/ui/button'
import { generateReview, type ReviewPeriod } from '@/lib/insights'

interface ReviewViewProps {
  routines: Routine[]
  completions: Completion[]
  reflections: Reflection[]
  identities: Identity[]
}

/**
 * Reflection (principle 10): a calm weekly / monthly review. Interprets the
 * period into a few gentle lines — no charts, no guilt.
 */
export function ReviewView({ routines, completions, reflections, identities }: ReviewViewProps) {
  const [period, setPeriod] = useState<ReviewPeriod>('week')
  const review = useMemo(
    () => generateReview(period, routines, completions, reflections, identities),
    [period, routines, completions, reflections, identities]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-2">
        <Button
          variant={period === 'week' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setPeriod('week')}
        >
          Weekly
        </Button>
        <Button
          variant={period === 'month' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setPeriod('month')}
        >
          Monthly
        </Button>
      </div>

      <div className="text-center space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{review.label}</p>
        <p className="text-4xl font-semibold tabular-nums">{review.completionRate}%</p>
        <p className="text-sm text-muted-foreground">
          {review.activeDays} active {review.activeDays === 1 ? 'day' : 'days'} of {review.totalDays}
        </p>
      </div>

      <div className="space-y-2 text-center text-sm text-muted-foreground">
        {review.strongestBlock && (
          <p>
            <span className="text-foreground font-medium">{review.strongestBlock}</span> was your
            strongest block.
          </p>
        )}
        {review.topIdentity && (
          <p>
            {review.topIdentity.votes} vote{review.topIdentity.votes === 1 ? '' : 's'} for becoming{' '}
            <span className="text-foreground font-medium">{review.topIdentity.name}</span>.
          </p>
        )}
        {review.moodSummary && <p>{review.moodSummary}</p>}
      </div>

      <p className="text-center text-sm font-medium text-primary">{review.note}</p>
    </div>
  )
}
