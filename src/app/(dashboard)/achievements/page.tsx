export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { calculateGamification } from "@/lib/gamification";
import { cn } from "@/lib/utils";
import { Trophy, Star, Shield, TrendingUp, Flame, Lock } from "lucide-react";
import Link from "next/link";

const categoryIcons: Record<string, typeof Trophy> = {
  milestone: Star,
  streak: Flame,
  discipline: Shield,
  performance: TrendingUp,
};

const categoryLabels: Record<string, string> = {
  milestone: "Marcos",
  streak: "Sequências",
  discipline: "Disciplina",
  performance: "Performance",
};

export default async function AchievementsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const trades = await prisma.trade.findMany({
    where: { userId: session.userId },
    orderBy: [{ date: "asc" }, { time: "asc" }],
    select: { date: true, result: true, financialResult: true, points: true, setup: true },
  });

  const gam = calculateGamification(trades);
  const categories = ["milestone", "streak", "discipline", "performance"];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Conquistas</h1>
        </div>
        <span className="text-xs text-zinc-500">{gam.earnedCount}/{gam.totalCount} desbloqueadas</span>
      </div>

      {/* Level Card */}
      <div className="rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-zinc-100 dark:to-zinc-200 p-5 text-white dark:text-zinc-900 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-medium opacity-70">Nível {gam.level}</p>
            <p className="text-xl font-bold">{gam.levelName}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{gam.xp.toLocaleString()}</p>
            <p className="text-xs opacity-70">XP total</p>
          </div>
        </div>
        <div className="h-2 rounded-full bg-white/20 dark:bg-zinc-900/20 overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-400 transition-all duration-700"
            style={{ width: `${gam.levelProgress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] opacity-50">{Math.round(gam.levelProgress)}%</span>
          <span className="text-[10px] opacity-50">Próximo: {gam.nextLevelXp.toLocaleString()} XP</span>
        </div>

        <div className="flex gap-6 mt-4 pt-3 border-t border-white/10 dark:border-zinc-900/10">
          <div>
            <p className="text-lg font-bold">{gam.currentStreak}</p>
            <p className="text-[10px] opacity-70">Streak atual</p>
          </div>
          <div>
            <p className="text-lg font-bold">{gam.bestStreak}</p>
            <p className="text-[10px] opacity-70">Melhor streak</p>
          </div>
          <div>
            <p className="text-lg font-bold">{gam.earnedCount}</p>
            <p className="text-[10px] opacity-70">Badges</p>
          </div>
        </div>
      </div>

      {/* XP Info */}
      <div className="rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
        <strong>Como ganhar XP:</strong> +5 por trade registrado, +10 por gain, +3 por setup tagueado, +5 por R:R alto, +8/dia por streak verde.
      </div>

      {/* Achievements by Category */}
      {categories.map((cat) => {
        const achievements = gam.achievements.filter((a) => a.category === cat);
        const Icon = categoryIcons[cat];
        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className="h-4 w-4 text-zinc-400" />
              <h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                {categoryLabels[cat]}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {achievements.map((a) => (
                <div
                  key={a.id}
                  className={cn(
                    "rounded-xl border p-4 transition-all",
                    a.earned
                      ? "bg-white dark:bg-zinc-800 border-amber-200 dark:border-amber-800 shadow-sm"
                      : "bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 opacity-60"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full text-lg",
                      a.earned ? "bg-amber-100 dark:bg-amber-900" : "bg-zinc-100 dark:bg-zinc-800"
                    )}>
                      {a.earned ? a.icon : <Lock className="h-4 w-4 text-zinc-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-semibold",
                        a.earned ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500"
                      )}>
                        {a.name}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">{a.description}</p>
                      {!a.earned && (
                        <div className="mt-2">
                          <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-amber-400 transition-all"
                              style={{ width: `${a.progress}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-zinc-400 mt-0.5">{Math.round(a.progress)}%</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
