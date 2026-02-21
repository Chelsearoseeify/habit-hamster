import { useState, useEffect, useCallback, useRef } from "react";
import type { Achievement, Completion, GamificationState, Routine } from "@/types";
import { getGamificationState, saveGamificationState } from "@/lib/storage";
import {
  calculateLevel,
  XP_PER_COMPLETION,
  XP_PERFECT_DAY_BONUS,
  XP_STREAK_MILESTONE,
  ACHIEVEMENT_DEFINITIONS,
  getNewlyUnlockedAchievements,
  type AchievementCheckContext,
} from "@/lib/gamification";

export function useGamification(
  completions: Completion[],
  routines: Routine[],
  streak: number,
  todayPercentage: number
) {
  const [state, setState] = useState<GamificationState>(() => getGamificationState());
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [levelUp, setLevelUp] = useState(false);

  // Track previous streak to detect milestone crossings
  const prevStreakRef = useRef(streak);

  const awardXP = useCallback((amount: number) => {
    setState((prev) => {
      const newXP = prev.xp + amount;
      const newLevel = calculateLevel(newXP);
      const didLevelUp = newLevel > prev.level;
      const next = { ...prev, xp: newXP, level: newLevel };
      saveGamificationState(next);
      if (didLevelUp) setLevelUp(true);
      return next;
    });
  }, []);

  const checkAchievements = useCallback(
    (ctx: AchievementCheckContext) => {
      setState((prev) => {
        const alreadyUnlocked = prev.achievements.map((a) => a.id);
        const newIds = getNewlyUnlockedAchievements(alreadyUnlocked, ctx);
        if (newIds.length === 0) return prev;

        const now = new Date().toISOString();
        const newAchievements: Achievement[] = newIds.map((id) => {
          const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === id)!;
          return { ...def, unlockedAt: now };
        });

        // Show the first newly unlocked achievement as a notification
        setNewAchievement(newAchievements[0]);

        const next = {
          ...prev,
          achievements: [...prev.achievements, ...newAchievements],
        };
        saveGamificationState(next);
        return next;
      });
    },
    []
  );

  // Award XP for streak milestones when streak changes
  useEffect(() => {
    const prev = prevStreakRef.current;
    prevStreakRef.current = streak;
    if (streak === prev) return;

    const milestones = [7, 30, 100];
    for (const m of milestones) {
      if (streak >= m && prev < m) {
        awardXP(XP_STREAK_MILESTONE);
      }
    }
  }, [streak, awardXP]);

  const dismissAchievement = useCallback(() => setNewAchievement(null), []);
  const dismissLevelUp = useCallback(() => setLevelUp(false), []);

  /**
   * Call this after a successful toggle to award XP and check achievements.
   */
  const onCompletionToggled = useCallback(
    (wasCompleted: boolean) => {
      if (wasCompleted) {
        awardXP(XP_PER_COMPLETION);
      }
      if (todayPercentage === 100) {
        // Award perfect day bonus once per day
        const today = new Date().toISOString().slice(0, 10);
        const bonusKey = `habit-hamster-perfect-bonus-${today}`;
        if (!localStorage.getItem(bonusKey)) {
          localStorage.setItem(bonusKey, "1");
          awardXP(XP_PERFECT_DAY_BONUS);
        }
      }
      checkAchievements({
        completions,
        routines,
        streak,
        todayPercentage,
      });
    },
    [awardXP, checkAchievements, completions, routines, streak, todayPercentage]
  );

  return {
    state,
    newAchievement,
    levelUp,
    dismissAchievement,
    dismissLevelUp,
    onCompletionToggled,
    XP_PER_COMPLETION,
    XP_PERFECT_DAY_BONUS,
    XP_STREAK_MILESTONE,
  };
}
