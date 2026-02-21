import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";
import { xpForNextLevel, xpProgressInLevel, XP_PER_LEVEL } from "@/lib/gamification";

interface LevelCardProps {
  level: number;
  xp: number;
}

export function LevelCard({ level, xp }: LevelCardProps) {
  const progressXP = xpProgressInLevel(xp);
  const nextLevelXP = xpForNextLevel(level);
  const percentage = Math.round((progressXP / XP_PER_LEVEL) * 100);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Level
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{level}</div>
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {progressXP} / {nextLevelXP} XP
        </p>
      </CardContent>
    </Card>
  );
}
