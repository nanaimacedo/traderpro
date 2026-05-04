// Gamification engine — computes XP, level, badges and achievements from trade data

interface TradeForGamification {
  date: Date;
  result: string;
  financialResult: number;
  points: number;
  setup?: string | null;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  progress: number; // 0-100
  category: "discipline" | "performance" | "milestone" | "streak";
}

export interface GamificationData {
  xp: number;
  level: number;
  levelName: string;
  nextLevelXp: number;
  levelProgress: number; // 0-100
  achievements: Achievement[];
  earnedCount: number;
  totalCount: number;
  currentStreak: number;
  bestStreak: number;
}

const LEVELS = [
  { xp: 0, name: "Novato" },
  { xp: 100, name: "Aprendiz" },
  { xp: 300, name: "Estudante" },
  { xp: 600, name: "Praticante" },
  { xp: 1000, name: "Operador" },
  { xp: 1500, name: "Consistente" },
  { xp: 2200, name: "Profissional" },
  { xp: 3000, name: "Veterano" },
  { xp: 4000, name: "Mestre" },
  { xp: 5500, name: "Elite" },
  { xp: 7500, name: "Lenda" },
];

function calculateXP(trades: TradeForGamification[]): number {
  let xp = 0;
  for (const t of trades) {
    // Base XP for registering a trade
    xp += 5;
    // Bonus for gains
    if (t.result === "GAIN") xp += 10;
    // Bonus for using a setup tag
    if (t.setup) xp += 3;
    // Bonus for good R:R (gain > 2x average loss)
    if (t.financialResult > 0 && t.financialResult > 50) xp += 5;
  }

  // Streak bonuses computed separately
  const { currentStreak } = getStreaks(trades);
  xp += currentStreak * 8;

  return xp;
}

function getLevel(xp: number): { level: number; name: string; nextXp: number; progress: number } {
  let idx = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp) { idx = i; break; }
  }
  const next = LEVELS[idx + 1] || { xp: LEVELS[idx].xp + 2000, name: "Beyond" };
  const currentXp = LEVELS[idx].xp;
  const range = next.xp - currentXp;
  const progress = range > 0 ? Math.min(((xp - currentXp) / range) * 100, 100) : 100;
  return { level: idx + 1, name: LEVELS[idx].name, nextXp: next.xp, progress };
}

function getStreaks(trades: TradeForGamification[]) {
  const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Daily discipline streak (days where trader stayed within 4 trades limit)
  const dailyCounts = new Map<string, { count: number; hasGain: boolean }>();
  for (const t of sorted) {
    const key = new Date(t.date).toISOString().split("T")[0];
    const existing = dailyCounts.get(key) || { count: 0, hasGain: false };
    existing.count++;
    if (t.result === "GAIN") existing.hasGain = true;
    dailyCounts.set(key, existing);
  }

  // Consecutive profitable days
  const days = Array.from(dailyCounts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  let currentStreak = 0;
  let bestStreak = 0;

  // Daily P&L
  const dailyPnL = new Map<string, number>();
  for (const t of sorted) {
    const key = new Date(t.date).toISOString().split("T")[0];
    dailyPnL.set(key, (dailyPnL.get(key) || 0) + t.financialResult);
  }

  const dayKeys = Array.from(dailyPnL.keys()).sort();
  for (const key of dayKeys) {
    const pnl = dailyPnL.get(key) || 0;
    if (pnl >= 0) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return { currentStreak, bestStreak, totalDays: days.length };
}

function computeAchievements(trades: TradeForGamification[]): Achievement[] {
  const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const total = sorted.length;
  const gains = sorted.filter((t) => t.result === "GAIN");
  const winRate = total > 0 ? (gains.length / total) * 100 : 0;
  const { currentStreak, bestStreak, totalDays } = getStreaks(sorted);

  // Daily counts
  const dailyCounts = new Map<string, number>();
  for (const t of sorted) {
    const key = new Date(t.date).toISOString().split("T")[0];
    dailyCounts.set(key, (dailyCounts.get(key) || 0) + 1);
  }
  const daysWithin4 = Array.from(dailyCounts.values()).filter((c) => c <= 4).length;
  const disciplineRate = totalDays > 0 ? (daysWithin4 / totalDays) * 100 : 0;

  // Monthly P&L
  const monthlyPnL = new Map<string, number>();
  for (const t of sorted) {
    const key = `${new Date(t.date).getFullYear()}-${String(new Date(t.date).getMonth() + 1).padStart(2, "0")}`;
    monthlyPnL.set(key, (monthlyPnL.get(key) || 0) + t.financialResult);
  }
  const greenMonths = Array.from(monthlyPnL.values()).filter((v) => v > 0).length;

  // Setup usage
  const withSetup = sorted.filter((t) => t.setup).length;
  const setupRate = total > 0 ? (withSetup / total) * 100 : 0;

  // Total profit
  const totalProfit = sorted.reduce((s, t) => s + t.financialResult, 0);

  return [
    // Milestones
    {
      id: "first-trade", name: "Primeiro Passo", description: "Registre seu primeiro trade",
      icon: "🎯", earned: total >= 1, progress: Math.min(total, 1) * 100, category: "milestone",
    },
    {
      id: "10-trades", name: "Aquecendo", description: "Registre 10 trades",
      icon: "🔥", earned: total >= 10, progress: Math.min((total / 10) * 100, 100), category: "milestone",
    },
    {
      id: "50-trades", name: "Meio Centenário", description: "Registre 50 trades",
      icon: "⚡", earned: total >= 50, progress: Math.min((total / 50) * 100, 100), category: "milestone",
    },
    {
      id: "100-trades", name: "Centurião", description: "Registre 100 trades",
      icon: "🏛️", earned: total >= 100, progress: Math.min((total / 100) * 100, 100), category: "milestone",
    },
    {
      id: "500-trades", name: "Veterano de Guerra", description: "Registre 500 trades",
      icon: "🎖️", earned: total >= 500, progress: Math.min((total / 500) * 100, 100), category: "milestone",
    },

    // Streaks
    {
      id: "streak-3", name: "Sequência Quente", description: "3 dias verdes consecutivos",
      icon: "🔥", earned: bestStreak >= 3, progress: Math.min((bestStreak / 3) * 100, 100), category: "streak",
    },
    {
      id: "streak-5", name: "Semana Perfeita", description: "5 dias verdes consecutivos",
      icon: "💎", earned: bestStreak >= 5, progress: Math.min((bestStreak / 5) * 100, 100), category: "streak",
    },
    {
      id: "streak-10", name: "Imparável", description: "10 dias verdes consecutivos",
      icon: "👑", earned: bestStreak >= 10, progress: Math.min((bestStreak / 10) * 100, 100), category: "streak",
    },
    {
      id: "streak-20", name: "Lenda Viva", description: "20 dias verdes consecutivos",
      icon: "🏆", earned: bestStreak >= 20, progress: Math.min((bestStreak / 20) * 100, 100), category: "streak",
    },

    // Discipline
    {
      id: "discipline-7", name: "Disciplinado", description: "7 dias seguidos respeitando o limite de trades",
      icon: "🛡️", earned: disciplineRate >= 100 && totalDays >= 7, progress: Math.min(disciplineRate, 100), category: "discipline",
    },
    {
      id: "discipline-30", name: "Monge do Mercado", description: "30 dias respeitando o limite de trades",
      icon: "🧘", earned: daysWithin4 >= 30, progress: Math.min((daysWithin4 / 30) * 100, 100), category: "discipline",
    },
    {
      id: "setup-tagger", name: "Analítico", description: "Taguear setup em 80% dos trades",
      icon: "🏷️", earned: setupRate >= 80 && total >= 10, progress: Math.min(setupRate, 100), category: "discipline",
    },

    // Performance
    {
      id: "winrate-60", name: "Sniper", description: "Win rate acima de 60% (min 20 trades)",
      icon: "🎯", earned: winRate >= 60 && total >= 20, progress: total >= 20 ? Math.min((winRate / 60) * 100, 100) : (total / 20) * 100, category: "performance",
    },
    {
      id: "green-month", name: "Mês Verde", description: "Feche um mês com lucro",
      icon: "💚", earned: greenMonths >= 1, progress: greenMonths >= 1 ? 100 : 0, category: "performance",
    },
    {
      id: "green-3months", name: "Trimestre Verde", description: "3 meses consecutivos com lucro",
      icon: "🌟", earned: greenMonths >= 3, progress: Math.min((greenMonths / 3) * 100, 100), category: "performance",
    },
    {
      id: "green-6months", name: "Consistência", description: "6 meses com lucro — pronto para conta real",
      icon: "🏅", earned: greenMonths >= 6, progress: Math.min((greenMonths / 6) * 100, 100), category: "performance",
    },
    {
      id: "profit-1k", name: "Primeiro Milhar", description: "Acumule R$ 1.000 de lucro",
      icon: "💰", earned: totalProfit >= 1000, progress: totalProfit > 0 ? Math.min((totalProfit / 1000) * 100, 100) : 0, category: "performance",
    },
    {
      id: "profit-10k", name: "Cinco Dígitos", description: "Acumule R$ 10.000 de lucro",
      icon: "💎", earned: totalProfit >= 10000, progress: totalProfit > 0 ? Math.min((totalProfit / 10000) * 100, 100) : 0, category: "performance",
    },
  ];
}

export function calculateGamification(trades: TradeForGamification[]): GamificationData {
  const xp = calculateXP(trades);
  const { level, name: levelName, nextXp, progress: levelProgress } = getLevel(xp);
  const achievements = computeAchievements(trades);
  const earnedCount = achievements.filter((a) => a.earned).length;
  const { currentStreak, bestStreak } = getStreaks(trades);

  return {
    xp,
    level,
    levelName,
    nextLevelXp: nextXp,
    levelProgress,
    achievements,
    earnedCount,
    totalCount: achievements.length,
    currentStreak,
    bestStreak,
  };
}
