import { Flame, AlertTriangle, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakIndicatorProps {
  maxWinStreak: number;
  maxLossStreak: number;
  currentStreak: { type: "win" | "loss" | "none"; count: number };
}

export function StreakIndicator({ maxWinStreak, maxLossStreak, currentStreak }: StreakIndicatorProps) {
  const isWinning = currentStreak.type === "win";
  const isLosing = currentStreak.type === "loss";

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-xl border p-4 transition-all duration-300",
      isWinning && "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/50",
      isLosing && "border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/50",
      !isWinning && !isLosing && "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isWinning ? (
            <Flame className="h-4 w-4 text-emerald-600" />
          ) : isLosing ? (
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          ) : (
            <Minus className="h-4 w-4 text-zinc-400" />
          )}
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Sequência Atual
          </span>
        </div>
        <span className={cn(
          "text-2xl font-bold",
          isWinning && "text-emerald-600",
          isLosing && "text-rose-500",
          !isWinning && !isLosing && "text-zinc-400 dark:text-zinc-500"
        )}>
          {currentStreak.count > 0 ? currentStreak.count : "—"}
        </span>
      </div>

      {/* Progress bars */}
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 w-12">Max W</span>
          <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min((maxWinStreak / Math.max(maxWinStreak, maxLossStreak, 1)) * 100, 100)}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-emerald-600 w-6 text-right">{maxWinStreak}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 w-12">Max L</span>
          <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min((maxLossStreak / Math.max(maxWinStreak, maxLossStreak, 1)) * 100, 100)}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-rose-500 w-6 text-right">{maxLossStreak}</span>
        </div>
      </div>
    </div>
  );
}
