# Habit Hamster — Behaviour-Driven Roadmap

Execution plan for the vision in [`VISION.md`](./VISION.md). Everything is
**additive**: the streak / XP / achievements / calendar tracker stays untouched
behind the "More & stats" disclosure. Each phase ships end-to-end
(types → API schema/mapper/router → web hook → UI) and updates the status table
below on completion.

## Principle status (what the code actually does today)

| # | Principle | Status | Where |
|---|-----------|--------|-------|
| 1 | Reduce decision fatigue | ✅ | `NowView` single next action + est. minutes |
| 2 | Identity before habits | ✅ | `IdentityCard` votes, `identity-utils` |
| 3 | Systems over goals | ❌ | no System layer yet |
| 4 | Chunking (routine blocks) | ✅ | `lib/blocks.ts` time-of-day blocks, one at a time (Phase 3) |
| 5 | Progressive disclosure | ✅ | Now home + "More & stats" |
| 6 | Goal gradient | ✅ | "Only N left" in `NextActionCard` |
| 7 | Reduce friction | ✅ | one-tap Done, big target, no dialog |
| 8 | Immediate reward | ✅ | `now-enter`/`check-pop` anim, count-up, haptic (Phase 2) |
| 9 | Consistency over perfection | ✅ | `useConsistency`, monthly % |
| 10 | Reflection | ⚠️ | daily mood done; no weekly/monthly review |
| 11 | Insights over statistics | ✅ | `generateInsights` surfaced in Now |
| 12 | Calm productivity | ✅ | tone throughout |

Remaining gaps: **3 (systems), 4 (chunking), 8 (immediate reward), 10 (reviews)**,
plus the Behaviour Design System doc.

---

## ✅ Phase 1 — Identity, Reflection, Consistency, Calm Now (shipped `fc07c59`)

Identity + Reflection types/tables/routers/hooks; nullable `routines.identity_id`;
calm "Now" home (next action + identity votes + mood + consistency + insights);
`IdentityCard` / `IdentityManager` / `MoodSelector` / `NowView`; tracker moved
behind disclosure.

---

## ✅ Phase 2 — Immediate Reward (principle 8, shipped)

Web-only, no schema. Completing the next action now *feels* good without fireworks.

- `useReducedMotion` hook — all animation no-ops under `prefers-reduced-motion`.
- `useCountUp` hook — "N of M done today", active days, monthly % tick up.
- `tapHaptic` (`navigator.vibrate`) on mobile completion.
- `now-enter` keyframe: next action slides/fades in when it changes (keyed remount).
- `check-pop` keyframe on the tick; `active:scale-95` press feedback on Done.

**Files:** `hooks/useReducedMotion.ts`, `hooks/useCountUp.ts`, `lib/haptics.ts`,
`tailwind.config.js` (keyframes), `views/NowView.tsx`.

---

## ✅ Phase 3 — Chunking / Routine Blocks (principle 4, shipped)

Reveal one time-of-day block at a time — finish the current block before the next.

**Note:** `category` turned out to be a *topic* (Fitness/Nutrition/…), not a time
block. Blocks are derived from `timeRange.start` → Morning (<12) / Afternoon
(<17) / Evening / Anytime (no time), matching the `insights.ts` convention.

- `lib/blocks.ts` — `buildDayBlocks` groups today's due routines; `currentBlock`
  = first block with remaining actions. Now's next action only ever comes from it.
- `NowView` — block header "Morning · 2 of 4 done" (goal gradient per block);
  calm hand-off line "Morning done — Afternoon is next." for ~2.6s on block change.

**Tradeoff:** untimed overdue interval/weekly routines fall into the last
("Anytime") block, so they no longer jump ahead of timed morning actions. Chunking
flow was prioritised over global urgency ranking; revisit if it feels wrong.

**Files:** `lib/blocks.ts`, `views/NowView.tsx`.

---

## ⏳ Phase 4 — Systems Layer (principle 3, data hierarchy)

Introduce the missing **System** level so the model matches the vision:
`Identity → System → Routine → Habit → Completion`.

**Naming decision (needs a call before coding — see below).**

- `packages/types`: add `System` (and resolve Routine/Habit naming).
- `apps/api`: `systems` table, mappers, router; FK wiring.
- `apps/web`: `useSystems` hook; light system framing in Now ("I trust my system"),
  no dashboard.

---

## ⏳ Phase 5 — Weekly & Monthly Review (principle 10)

Turn accumulated reflections + completions into a calm periodic review.

- Weekly review: mood trend, most-voted identity, strongest block, one gentle note.
- Monthly review: consistency, reliability, identity progress.
- Lives behind disclosure; reuses `generateInsights` + `useConsistency`.

**Files:** `insights.ts`, a `ReviewView`, hook wiring.

---

## ⏳ Phase 6 — Behaviour Design System doc

Document each behaviour-bearing component with Purpose / Psychological principle /
Desired emotion / Interaction / Animation (format in `VISION.md`). Living doc, e.g.
`apps/web/BEHAVIOUR_DS.md`, covering IdentityCard, NextActionCard, MoodSelector,
consistency line, insights, and new Phase 2–5 components.

---

## Open decision — data-model naming (blocks Phase 4, touches Phase 3)

The vision hierarchy is `Identity → System → Routine → Habit → Completion`. The
current code uses **`Routine`** for the individual action (with `frequency`) and
**`category`** (a string) for the block. So today's `Routine` ≈ the vision's
`Habit`, and today's `category` ≈ the vision's `Routine`/block.

Options:
- **A. Keep code names, add `System` above.** Least churn; docs note that code
  `Routine` = vision `Habit`. Chunking uses `category` as the block.
- **B. Rename to match vision** (`Routine`→`Habit`, promote block to a real
  `Routine` entity). Truest to the manifesto; largest migration across types, API,
  DB, hooks, components.
- **C. Hybrid** — introduce `System` now, defer the Routine/Habit rename until it
  earns its cost.

Recommendation: **A now, revisit B later** — keeps momentum, avoids a big rename
before the UX proves it needs one.

---

## Conventions

- Additive only; never remove or gate existing tracker features.
- Ship per phase: types → api schema/mapper/router → web hook → UI → update status.
- Calm tone in Now: no guilt, no red, one thing at a time, respect reduced-motion.
- Commit at each phase boundary.
