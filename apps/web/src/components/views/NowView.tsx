import { useMemo, useState } from "react";
import { flushSync } from "react-dom";
import type {
  Routine,
  Completion,
  Identity,
  System,
  Reflection,
  Mood,
} from "@/types";
import { MoodSelector } from "@/components/reflection/MoodSelector";
import { TimelineCard } from "@/components/views/TimelineCard";
import { AnytimeCard } from "@/components/views/AnytimeCard";
import { partitionByTime } from "@/lib/honeycomb";
import {
  getMaxCountForRoutine,
  isRoutineDueOnDate,
} from "@/hooks/useCompletions";
import { blockForRoutine, BLOCK_ORDER } from "@/lib/blocks";
import { getToday } from "@/lib/date-utils";

interface NowViewProps {
  routines: Routine[];
  completions: Completion[];
  identities: Identity[];
  // Kept for prop compatibility with App; systems live in "More & stats" now.
  systems: System[];
  todayStats: { total: number; completed: number; percentage: number };
  consistency: {
    activeDays: number;
    daysElapsed: number;
    monthlyConsistency: number;
  };
  onToggle: (routineId: string, maxCount: number) => void;
  onViewFullDay: () => void;
  getReflectionForDate: (date: string) => Reflection | undefined;
  setReflection: (date: string, mood: Mood, note?: string) => void;
}

const BLOCK_WEIGHT: Record<string, number> = Object.fromEntries(
  BLOCK_ORDER.map((b, i) => [b, i]),
);

export function NowView({
  routines,
  completions,
  identities,
  onToggle,
  onViewFullDay,
  getReflectionForDate,
  setReflection,
}: NowViewProps) {
  const today = getToday();

  const dueToday = useMemo(
    () =>
      routines
        .filter((r) => isRoutineDueOnDate(r, today, completions))
        .sort((a, b) => {
          const wa = BLOCK_WEIGHT[blockForRoutine(a)];
          const wb = BLOCK_WEIGHT[blockForRoutine(b)];
          if (wa !== wb) return wa - wb;
          return (a.timeRange?.start ?? "99:99").localeCompare(
            b.timeRange?.start ?? "99:99",
          );
        }),
    [routines, completions, today],
  );

  const items = dueToday.map((r) => {
    const maxCount = getMaxCountForRoutine(r);
    const count =
      completions.find((c) => c.routineId === r.id && c.date === today)
        ?.count ?? 0;
    return { routine: r, maxCount, count, done: count >= maxCount };
  });

  const { timed, ongoing } = partitionByTime(items);
  const nextItem = timed.find((i) => !i.done) ?? null;

  // The user can promote any timeline row to the hero. Default: the next item.
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const focused = focusedId
    ? timed.find((i) => i.routine.id === focusedId)
    : undefined;
  const heroItem = focused ?? nextItem;
  const heroLabel =
    heroItem && heroItem.routine.id === nextItem?.routine.id ? "Next" : "Focus";

  // Animate layout changes: the clicked row FLIP-morphs into the big card (and
  // the old card shrinks back to a row). flushSync applies state inside the
  // transition; plain update where the API is unsupported.
  const withTransition = (update: () => void) => {
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => void;
    };
    if (doc.startViewTransition) doc.startViewTransition(() => flushSync(update));
    else update();
  };

  const focusItem = (id: string) => withTransition(() => setFocusedId(id));
  const completeHero = (id: string, maxCount: number) =>
    withTransition(() => {
      onToggle(id, maxCount);
      setFocusedId(null);
    });

  const reflection = getReflectionForDate(today);

  // Identity behind the currently-highlighted (hero) activity — the "why" for it.
  const heroRoutine = heroItem?.routine;
  const heroIdentity = heroRoutine?.identityId
    ? identities.find((i) => i.id === heroRoutine.identityId)
    : undefined;
  const heroWhy =
    heroIdentity?.statement?.trim() ||
    (heroIdentity ? `Becoming ${heroIdentity.name}` : null);

  const nothingDue = items.length === 0;

  return (
    <div className="space-y-6">
      {nothingDue ? (
        <div className="rounded-2xl border bg-card px-6 py-12 text-center">
          <p className="text-lg font-medium">Nothing due today.</p>
          <p className="text-sm text-muted-foreground">Rest easy.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* LEFT — the day's spine */}
          <div className="space-y-6 lg:col-span-2">
            {timed.length > 0 && (
              <TimelineCard
                items={timed}
                heroItem={heroItem}
                heroLabel={heroLabel}
                onFocus={focusItem}
                onToggle={onToggle}
                onHeroToggle={completeHero}
                onViewFullDay={onViewFullDay}
              />
            )}
          </div>

          {/* RIGHT — anytime, encouragement, reflection */}
          <div className="space-y-6">
            {ongoing.length > 0 && (
              <AnytimeCard
                items={ongoing}
                completions={completions}
                onToggle={onToggle}
              />
            )}

            {/* The "why" behind the highlighted activity — its identity. */}
            <div className="flex items-center gap-4 rounded-2xl border bg-gradient-to-br from-primary/10 to-transparent p-5">
              <span aria-hidden className="shrink-0 text-5xl">
                🐹
              </span>
              {heroWhy ? (
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Why {heroRoutine?.name}
                  </p>
                  <p className="mt-0.5 text-base font-semibold leading-snug">
                    {heroWhy}
                  </p>
                </div>
              ) : (
                <p className="text-lg font-semibold leading-snug">
                  Small steps,
                  <br />
                  big changes. <span className="text-primary">♥</span>
                </p>
              )}
            </div>

            {/* Reflection */}
            <div className="rounded-2xl border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                How did today feel?
              </p>
              <p className="mb-3 text-xs text-muted-foreground">
                Your reflection helps you grow.
              </p>
              <MoodSelector
                reflection={reflection}
                onChange={(mood, note) => setReflection(today, mood, note)}
                hidePrompt
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
