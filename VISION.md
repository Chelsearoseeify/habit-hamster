# Behaviour-Driven Habit App — Vision

## Vision

This is **not** another habit tracker. The goal is **not** to help users complete
more tasks. The goal is to **reduce cognitive load**, remove unnecessary decisions,
and help users become the kind of person they want to be through small, repeatable
actions. The product should feel like a calm companion, not a productivity tool.

Core feeling:

> "I don't have to remember what to do. The app already knows my next step."

## Design Philosophy

Every screen, component and interaction must exist to support a specific
psychological principle. No UI element should exist only because "other habit apps
have it." Human behaviour first, UI second.

## Core Principles

1. **Reduce decision fatigue** — always present a single obvious next action
   (next action · current routine · estimated completion time). Not 20 habits,
   dashboards, and stats.
2. **Identity before habits** — Identity → Systems → Routines → Habits →
   Completions. Show "128 votes for becoming a healthy person", not "128 habits
   completed". Every completion is evidence of identity.
3. **Systems over goals** — goals are temporary, systems are permanent. Reinforce
   "I trust my system", not "I hope I'll stay motivated".
4. **Chunking** — habits belong to routines (Morning / Work / Evening / Weekly).
   Finish one block before seeing the next.
5. **Progressive disclosure** — only show what matters now; stats and history stay
   secondary. Home screen feels extremely calm.
6. **Goal gradient effect** — emphasise "only one step left", not "75% done".
   Completion should always feel close.
7. **Reduce friction** — minimum effort per interaction: one-tap completion, no
   confirmation dialogs, large touch targets, no unnecessary forms, defaults over
   choices.
8. **Immediate reward** — every completion gives subtle feedback (smooth checkbox
   animation, progress update, collapsing completed cards, haptics, animated
   counters). Satisfying, not distracting. No fireworks.
9. **Consistency over perfection** — prefer monthly consistency / reliability
   ("26 active days this month") over guilt-inducing streaks.
10. **Reflection** — "How did today feel? 😀 😐 😞" + optional note; weekly and
    monthly review. Help users understand themselves, not just collect data.
11. **Insights instead of statistics** — interpret, don't report. "Morning routines
    are your strongest", not "you skipped three habits."
12. **Calm productivity** — generous spacing, few colours, low visual noise,
    minimal notifications, almost no urgency, no guilt. Like opening a notebook,
    not a control panel.

## Behaviour Design System

Not a traditional design system. Every component documents:

- **Purpose** — why does this component exist?
- **Psychological principle** — which behavioural principle does it support?
- **Desired emotion** — how should the user feel?
- **Interaction** — how does it behave?
- **Animation** — how does feedback reinforce the behaviour?

*Example — Identity Card:* Purpose: reinforce identity. Principle: identity-based
habits. Emotion: "I am becoming this person." Interaction: updates after every
completed habit. Animation: smooth progress increase.

## Data Model Philosophy

The data model reflects psychology, not implementation, and tells the same story
as the UX:

    Identity → System → Routine → Habit → Completion → Reflection → Insight

## Product North Star

The app should never feel like a to-do list. It should feel like a guide that
quietly removes friction from everyday life. Every design decision answers one
question:

> Does this reduce mental effort while reinforcing the identity the user wants to build?

If the answer is no, the feature probably doesn't belong in the product.
