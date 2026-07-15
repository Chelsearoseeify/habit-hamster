# Behaviour Design System

A behaviour-first component reference for Habit Hamster. Not a visual style guide —
every entry documents *why the component exists* and *how it shapes behaviour*, per
the manifesto in [`../../VISION.md`](../../VISION.md).

Each component is documented on five axes:

- **Purpose** — why it exists
- **Principle** — which of the 12 behavioural principles it serves
- **Emotion** — how the user should feel
- **Interaction** — how it behaves
- **Animation** — how feedback reinforces the behaviour

> Rule: no UI element exists only because other habit apps have it. If a component
> can't answer *"does this reduce mental effort while reinforcing identity?"* with
> yes, it doesn't belong here.

---

## Reward primitives (shared)

Cross-cutting building blocks used by the components below.

| Primitive | File | Role |
|-----------|------|------|
| `useReducedMotion` | `src/hooks/useReducedMotion.ts` | Gate; every animation no-ops under `prefers-reduced-motion`. |
| `useCountUp` | `src/hooks/useCountUp.ts` | rAF ease-out counter ramp for "N of M done", active days, %. |
| `tapHaptic` | `src/lib/haptics.ts` | Subtle `navigator.vibrate` on completion (mobile). |
| `now-enter` keyframe | `tailwind.config.js` | Fade + slide-up as a new card takes over. |
| `check-pop` keyframe | `tailwind.config.js` | Tick scales in when a fresh action arrives. |

**Animation law:** satisfying, not distracting. No fireworks. Everything degrades
to an instant state change under reduced motion.

---

## NextActionCard (inside `NowView`)

`src/components/views/NowView.tsx`

- **Purpose** — present the single obvious next thing to do, nothing else.
- **Principle** — #1 reduce decision fatigue; #6 goal gradient ("Only N left");
  #7 reduce friction (one big tap); #8 immediate reward.
- **Emotion** — "I don't have to decide. I just do this one."
- **Interaction** — one large `Done` button (`h-14`, full-width). Multi-count
  routines show `Log one (2/3)` and `Only 1 left`. Completing recomputes the next
  action from the current block.
- **Animation** — `active:scale-95` press; `tapHaptic()` on tap; new card mounts
  with `now-enter` (keyed on `routine.id`); tick plays `check-pop`.

## Block header + hand-off (inside `NowView`)

`src/components/views/NowView.tsx` · `src/lib/blocks.ts`

- **Purpose** — reveal one time-of-day block at a time so the day never feels like
  a 20-item list.
- **Principle** — #4 chunking; #6 goal gradient (per-block "2 of 4 done").
- **Emotion** — "Just get through this block. The rest can wait."
- **Interaction** — Now only ever draws its next action from the current block
  (first block with remaining actions). Later blocks stay hidden.
- **Animation** — a calm "Morning done — Afternoon is next." line (`now-enter`)
  shows for ~2.6s when a block clears.

## IdentityCard

`src/components/identity/IdentityCard.tsx`

- **Purpose** — reframe completions as evidence of who you're becoming.
- **Principle** — #2 identity before habits.
- **Emotion** — "I am becoming this person."
- **Interaction** — shows the identity statement + "N votes for becoming …".
  Read-only; updates as linked routines are completed.
- **Animation** — none yet (candidate: count-up on the vote total).

## MoodSelector

`src/components/reflection/MoodSelector.tsx`

- **Purpose** — a frictionless daily check-in.
- **Principle** — #10 reflection; #7 reduce friction; #12 calm.
- **Emotion** — "A quick honest beat, no pressure."
- **Interaction** — three emoji buttons (😀 😐 😞); tapping one is enough. The
  optional note field reveals only after a mood is chosen; saves on blur.
- **Animation** — `transition-colors` on selection; selected state via
  `aria-pressed` + primary tint.

## Consistency & insight lines (inside `NowView`)

`src/components/views/NowView.tsx` · `src/hooks/useConsistency.ts` · `src/lib/insights.ts`

- **Purpose** — reassure with reliability, not streak pressure; interpret data.
- **Principle** — #9 consistency over perfection; #11 insights over statistics.
- **Emotion** — "I show up. That's what matters."
- **Interaction** — "You've shown up 26 of 30 days" + up to 2 interpreted insight
  lines ("Morning routines are your strongest").
- **Animation** — `useCountUp` on active days and monthly %.

## ReviewView

`src/components/views/ReviewView.tsx` · `src/lib/insights.ts` (`generateReview`)

- **Purpose** — a calm weekly/monthly look back that interprets the window.
- **Principle** — #10 reflection; #11 insights; #5 progressive disclosure (lives
  behind "More & stats"); #12 calm.
- **Emotion** — "I understand my rhythm — and I'm okay."
- **Interaction** — Weekly/Monthly toggle; headline completion %, active days,
  strongest block, top identity, mood summary, one gentle closing note. No charts.
- **Animation** — none (deliberately still; this is a reflective surface).

## SystemManager / IdentityManager

`src/components/systems/SystemManager.tsx` · `src/components/identity/IdentityManager.tsx`

- **Purpose** — let the user define the identities and systems their routines serve.
- **Principle** — #2 identity; #3 systems over goals; #5 progressive disclosure
  (both live in the All tab, not on the home).
- **Emotion** — "I trust my system" / "I know who I'm becoming."
- **Interaction** — list existing (with linked-routine counts); a compact add form.
  A system can optionally declare the identity it serves.
- **Animation** — none; management is a deliberate, low-frequency task.

## RoutineForm

`src/components/routines/RoutineForm.tsx`

- **Purpose** — capture a routine with sensible defaults and optional depth.
- **Principle** — #7 reduce friction (defaults over choices); #2/#3 (optional
  identity + system pickers appear only when those exist).
- **Emotion** — "Adding this was quick and painless."
- **Interaction** — name + category + frequency are enough; identity/system/time/
  preferred-days are optional and progressively revealed.
- **Animation** — dialog transitions from shadcn defaults.

---

## Adding a new component

Before building, answer the five axes above. If Principle is blank, or Emotion is
"neutral / none", reconsider whether the component earns its place. Prefer removing
friction or a decision over adding a feature.
