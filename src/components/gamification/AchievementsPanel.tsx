import type { Achievement } from "@/types";
import { ACHIEVEMENT_DEFINITIONS } from "@/lib/gamification";
import {
  Footprints,
  Star,
  Flame,
  Trophy,
  Crown,
  Gem,
  Pill,
  Dumbbell,
  Sparkles,
  Lock,
} from "lucide-react";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Footprints,
  Star,
  Flame,
  Trophy,
  Crown,
  Gem,
  Pill,
  Dumbbell,
  Sparkles,
};

interface AchievementsPanelProps {
  unlockedAchievements: Achievement[];
}

export function AchievementsPanel({ unlockedAchievements }: AchievementsPanelProps) {
  const unlockedMap = new Map(unlockedAchievements.map((a) => [a.id, a]));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {ACHIEVEMENT_DEFINITIONS.map((def) => {
          const unlocked = unlockedMap.get(def.id);
          const Icon = ICONS[def.icon] ?? Star;

          return (
            <div
              key={def.id}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors ${
                unlocked
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-muted/30 opacity-50"
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  unlocked ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                {unlocked ? (
                  <Icon className="h-5 w-5" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
              </div>
              <p className="text-xs font-semibold leading-tight">{def.name}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{def.description}</p>
              {unlocked?.unlockedAt && (
                <p className="text-[10px] text-primary/70">
                  {new Date(unlocked.unlockedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
