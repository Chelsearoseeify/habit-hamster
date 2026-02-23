import type { Achievement, Completion, Routine } from "@/types";
import { isRoutineDueOnDate, getMaxCountForRoutine } from "@/hooks/useCompletions";
import { formatDate, getDaysInRange } from "@/lib/date-utils";

// XP values
export const XP_PER_COMPLETION = 10;
export const XP_PERFECT_DAY_BONUS = 25;
export const XP_STREAK_MILESTONE = 100;
export const XP_PER_LEVEL = 500;
export const MAX_LEVEL = 50;

export function calculateLevel(xp: number): number {
  return Math.min(Math.floor(xp / XP_PER_LEVEL) + 1, MAX_LEVEL);
}

export function xpForNextLevel(level: number): number {
  return level * XP_PER_LEVEL;
}

export function xpProgressInLevel(xp: number): number {
  return xp % XP_PER_LEVEL;
}

// All possible achievements (definitions only — no unlocked state here)
export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, "unlockedAt">[] = [
  {
    id: "first_completion",
    name: "First Step",
    description: "Complete any routine for the first time",
    icon: "Footprints",
  },
  {
    id: "perfect_day",
    name: "Perfect Day",
    description: "Complete 100% of routines in a single day",
    icon: "Star",
  },
  {
    id: "week_streak",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "Flame",
  },
  {
    id: "perfect_week",
    name: "Perfect Week",
    description: "7 consecutive days at 100% completion",
    icon: "Trophy",
  },
  {
    id: "month_streak",
    name: "Month Master",
    description: "Maintain a 30-day streak",
    icon: "Crown",
  },
  {
    id: "century",
    name: "Century",
    description: "Maintain a 100-day streak",
    icon: "Gem",
  },
  {
    id: "supplement_master",
    name: "Supplement Master",
    description: "Complete all Supplements for 30 days",
    icon: "Pill",
  },
  {
    id: "fitness_fanatic",
    name: "Fitness Fanatic",
    description: "Complete 20 Fitness routines",
    icon: "Dumbbell",
  },
  {
    id: "skincare_queen",
    name: "Glow Up",
    description: "Complete all Skincare routines for 30 days",
    icon: "Sparkles",
  },
];

export interface AchievementCheckContext {
  completions: Completion[];
  routines: Routine[];
  streak: number;
  todayPercentage: number;
}

/**
 * Returns IDs of achievements that should now be unlocked given the current context,
 * excluding any already unlocked.
 */
export function getNewlyUnlockedAchievements(
  alreadyUnlocked: string[],
  ctx: AchievementCheckContext
): string[] {
  const { completions, routines, streak, todayPercentage } = ctx;
  const newlyUnlocked: string[] = [];
  const unlocked = new Set(alreadyUnlocked);

  const check = (id: string, condition: boolean) => {
    if (!unlocked.has(id) && condition) newlyUnlocked.push(id);
  };

  // first_completion: any completion exists
  check("first_completion", completions.length > 0);

  // perfect_day: today is 100%
  check("perfect_day", todayPercentage === 100);

  // week_streak
  check("week_streak", streak >= 7);

  // month_streak
  check("month_streak", streak >= 30);

  // century
  check("century", streak >= 100);

  // perfect_week: last 7 days all 100%
  if (!unlocked.has("perfect_week")) {
    const today = new Date();
    let perfectWeek = true;
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      const due = routines.filter((r) => isRoutineDueOnDate(r, dateStr, completions));
      if (due.length === 0) continue;
      const allDone = due.every((r) => {
        const c = completions.find((c) => c.routineId === r.id && c.date === dateStr);
        return (c?.count ?? 0) >= getMaxCountForRoutine(r);
      });
      if (!allDone) { perfectWeek = false; break; }
    }
    check("perfect_week", perfectWeek);
  }

  // supplement_master: all supplement routines completed every day for last 30 days
  if (!unlocked.has("supplement_master")) {
    const supplementRoutines = routines.filter((r) => r.category === "Supplements");
    if (supplementRoutines.length > 0) {
      const today = new Date();
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      const days = getDaysInRange(start, today);
      const allGood = days.every((dateStr) => {
        const due = supplementRoutines.filter((r) => isRoutineDueOnDate(r, dateStr, completions));
        return due.every((r) => {
          const c = completions.find((c) => c.routineId === r.id && c.date === dateStr);
          return (c?.count ?? 0) >= getMaxCountForRoutine(r);
        });
      });
      check("supplement_master", allGood);
    }
  }

  // fitness_fanatic: 20+ fitness completions total
  if (!unlocked.has("fitness_fanatic")) {
    const fitnessRoutines = new Set(
      routines.filter((r) => r.category === "Fitness").map((r) => r.id)
    );
    const fitnessCompletions = completions.filter(
      (c) => fitnessRoutines.has(c.routineId) && c.count > 0
    ).length;
    check("fitness_fanatic", fitnessCompletions >= 20);
  }

  // skincare_queen: all skincare completed every day for last 30 days
  if (!unlocked.has("skincare_queen")) {
    const skincareRoutines = routines.filter((r) => r.category === "Skincare");
    if (skincareRoutines.length > 0) {
      const today = new Date();
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      const days = getDaysInRange(start, today);
      const allGood = days.every((dateStr) => {
        const due = skincareRoutines.filter((r) => isRoutineDueOnDate(r, dateStr, completions));
        return due.every((r) => {
          const c = completions.find((c) => c.routineId === r.id && c.date === dateStr);
          return (c?.count ?? 0) >= getMaxCountForRoutine(r);
        });
      });
      check("skincare_queen", allGood);
    }
  }

  return newlyUnlocked;
}
