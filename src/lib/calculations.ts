interface TradeData {
  result: string;
  points: number;
  financialResult: number;
  contracts: number;
  date?: Date | string;
  durationMinutes?: number | null;
}

export function formatDuration(minutes: number): string {
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}min` : `${h}h`;
}

export function calculateMetrics(trades: TradeData[]) {
  const total = trades.length;
  if (total === 0) {
    return {
      totalTrades: 0,
      gains: 0,
      losses: 0,
      zeros: 0,
      winRate: 0,
      totalGain: 0,
      totalLoss: 0,
      netResult: 0,
      totalPoints: 0,
      avgPointsPerTrade: 0,
      totalContracts: 0,
      maxWinStreak: 0,
      maxLossStreak: 0,
      currentStreak: { type: "none" as const, count: 0 },
      tradingDays: 0,
      maxDailyGain: 0,
      maxDailyLoss: 0,
      maxGainPerOp: 0,
      maxLossPerOp: 0,
      maxDurationTrade: null as { minutes: number; financialResult: number } | null,
      minDurationTrade: null as { minutes: number; financialResult: number } | null,
    };
  }

  const gains = trades.filter((t) => t.result === "GAIN").length;
  const losses = trades.filter((t) => t.result === "LOSS").length;
  const zeros = trades.filter((t) => t.result === "ZERO").length;
  const winRate = (gains / total) * 100;

  const totalGain = trades
    .filter((t) => t.result === "GAIN")
    .reduce((sum, t) => sum + t.financialResult, 0);
  const totalLoss = trades
    .filter((t) => t.result === "LOSS")
    .reduce((sum, t) => sum + t.financialResult, 0);
  const netResult = totalGain + totalLoss;

  const totalPoints = trades.reduce((sum, t) => sum + t.points, 0);
  const avgPointsPerTrade = totalPoints / total;
  const totalContracts = trades.reduce((sum, t) => sum + t.contracts, 0);

  // Streaks
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let currentWin = 0;
  let currentLoss = 0;

  for (const trade of trades) {
    if (trade.result === "GAIN") {
      currentWin++;
      currentLoss = 0;
      maxWinStreak = Math.max(maxWinStreak, currentWin);
    } else if (trade.result === "LOSS") {
      currentLoss++;
      currentWin = 0;
      maxLossStreak = Math.max(maxLossStreak, currentLoss);
    } else {
      currentWin = 0;
      currentLoss = 0;
    }
  }

  const lastTrade = trades[trades.length - 1];
  const currentStreak = {
    type: lastTrade.result === "GAIN" ? ("win" as const) : lastTrade.result === "LOSS" ? ("loss" as const) : ("none" as const),
    count: lastTrade.result === "GAIN" ? currentWin : lastTrade.result === "LOSS" ? currentLoss : 0,
  };

  // Trading days
  const tradingDaysSet = new Set<string>();
  for (const t of trades) {
    if (t.date) tradingDaysSet.add(new Date(t.date as Date).toISOString().split("T")[0]);
  }
  const tradingDays = tradingDaysSet.size;

  // Daily extremes
  const dailyNetMap = new Map<string, number>();
  for (const t of trades) {
    if (!t.date) continue;
    const key = new Date(t.date as Date).toISOString().split("T")[0];
    dailyNetMap.set(key, (dailyNetMap.get(key) || 0) + t.financialResult);
  }
  const dailyValues = Array.from(dailyNetMap.values());
  const positiveDaily = dailyValues.filter((v) => v > 0);
  const negativeDaily = dailyValues.filter((v) => v < 0);
  const maxDailyGain = positiveDaily.length > 0 ? Math.max(...positiveDaily) : 0;
  const maxDailyLoss = negativeDaily.length > 0 ? Math.min(...negativeDaily) : 0;

  // Per-op extremes
  const gainResults = trades.filter((t) => t.result === "GAIN").map((t) => t.financialResult);
  const lossResults = trades.filter((t) => t.result === "LOSS").map((t) => t.financialResult);
  const maxGainPerOp = gainResults.length > 0 ? Math.max(...gainResults) : 0;
  const maxLossPerOp = lossResults.length > 0 ? Math.min(...lossResults) : 0;

  // Duration extremes
  const tradesWithDuration = trades.filter((t) => t.durationMinutes != null && t.durationMinutes > 0);
  let maxDurationTrade: { minutes: number; financialResult: number } | null = null;
  let minDurationTrade: { minutes: number; financialResult: number } | null = null;
  if (tradesWithDuration.length > 0) {
    const maxDur = tradesWithDuration.reduce((a, b) => (a.durationMinutes! > b.durationMinutes! ? a : b));
    const minDur = tradesWithDuration.reduce((a, b) => (a.durationMinutes! < b.durationMinutes! ? a : b));
    maxDurationTrade = { minutes: maxDur.durationMinutes!, financialResult: maxDur.financialResult };
    minDurationTrade = { minutes: minDur.durationMinutes!, financialResult: minDur.financialResult };
  }

  return {
    totalTrades: total,
    gains,
    losses,
    zeros,
    winRate,
    totalGain,
    totalLoss,
    netResult,
    totalPoints,
    avgPointsPerTrade,
    totalContracts,
    maxWinStreak,
    maxLossStreak,
    currentStreak,
    tradingDays,
    maxDailyGain,
    maxDailyLoss,
    maxGainPerOp,
    maxLossPerOp,
    maxDurationTrade,
    minDurationTrade,
  };
}

export function getDailyResults(trades: { date: Date; financialResult: number; result: string }[]) {
  const dailyMap = new Map<string, { date: string; gain: number; loss: number; net: number; trades: number }>();

  for (const trade of trades) {
    const dateKey = new Date(trade.date).toISOString().split("T")[0];
    const existing = dailyMap.get(dateKey) || { date: dateKey, gain: 0, loss: 0, net: 0, trades: 0 };

    if (trade.result === "GAIN") {
      existing.gain += trade.financialResult;
    } else if (trade.result === "LOSS") {
      existing.loss += trade.financialResult;
    }
    existing.net += trade.financialResult;
    existing.trades++;

    dailyMap.set(dateKey, existing);
  }

  return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function getCumulativeResults(trades: { date: Date; financialResult: number }[]) {
  const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let cumulative = 0;

  return sorted.map((trade, index) => {
    cumulative += trade.financialResult;
    return {
      index: index + 1,
      date: new Date(trade.date).toISOString().split("T")[0],
      cumulative,
    };
  });
}

// --- Advanced Analytics (Institutional Grade) ---

interface AdvancedTradeData {
  date: Date;
  time: string;
  result: string;
  points: number;
  financialResult: number;
  contracts: number;
}

export function calculateAdvancedMetrics(trades: AdvancedTradeData[]) {
  if (trades.length === 0) return null;

  const results = trades.map((t) => t.financialResult);
  const gains = results.filter((r) => r > 0);
  const losses = results.filter((r) => r < 0);

  // Expectancy (expectativa matemática por trade)
  const avgGain = gains.length > 0 ? gains.reduce((s, v) => s + v, 0) / gains.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, v) => s + v, 0) / losses.length) : 0;
  const winRate = gains.length / trades.length;
  const expectancy = winRate * avgGain - (1 - winRate) * avgLoss;

  // Profit Factor
  const grossProfit = gains.reduce((s, v) => s + v, 0);
  const grossLoss = Math.abs(losses.reduce((s, v) => s + v, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  // Sharpe Ratio (simplified - annualized)
  const mean = results.reduce((s, v) => s + v, 0) / results.length;
  const variance = results.reduce((s, v) => s + (v - mean) ** 2, 0) / results.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (mean / stdDev) * Math.sqrt(252) : 0; // 252 trading days

  // Maximum Drawdown
  let peak = 0;
  let cumulative = 0;
  let maxDrawdown = 0;
  let maxDrawdownPct = 0;
  const equityCurve: number[] = [];

  for (const r of results) {
    cumulative += r;
    equityCurve.push(cumulative);
    if (cumulative > peak) peak = cumulative;
    const drawdown = peak - cumulative;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownPct = peak > 0 ? (drawdown / peak) * 100 : 0;
    }
  }

  // Recovery Factor
  const totalReturn = cumulative;
  const recoveryFactor = maxDrawdown > 0 ? totalReturn / maxDrawdown : 0;

  // Heatmap de horários (resultado por hora)
  const hourMap = new Map<string, { result: number; trades: number; gains: number; losses: number }>();
  for (const t of trades) {
    const hour = t.time.slice(0, 2) + ":00";
    const existing = hourMap.get(hour) || { result: 0, trades: 0, gains: 0, losses: 0 };
    existing.result += t.financialResult;
    existing.trades++;
    if (t.result === "GAIN") existing.gains++;
    if (t.result === "LOSS") existing.losses++;
    hourMap.set(hour, existing);
  }
  const heatmap = Array.from(hourMap.entries())
    .map(([hour, data]) => ({ hour, ...data, winRate: data.trades > 0 ? (data.gains / data.trades) * 100 : 0 }))
    .sort((a, b) => a.hour.localeCompare(b.hour));

  // Heatmap por dia da semana
  const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const dayMap = new Map<number, { result: number; trades: number; gains: number; losses: number }>();
  for (const t of trades) {
    const day = new Date(t.date).getDay();
    const existing = dayMap.get(day) || { result: 0, trades: 0, gains: 0, losses: 0 };
    existing.result += t.financialResult;
    existing.trades++;
    if (t.result === "GAIN") existing.gains++;
    if (t.result === "LOSS") existing.losses++;
    dayMap.set(day, existing);
  }
  const dayHeatmap = Array.from(dayMap.entries())
    .map(([day, data]) => ({ day: dayNames[day], ...data, winRate: data.trades > 0 ? (data.gains / data.trades) * 100 : 0 }))
    .sort((a, b) => {
      const order = [1, 2, 3, 4, 5]; // seg-sex
      return order.indexOf(dayNames.indexOf(a.day) || 0) - order.indexOf(dayNames.indexOf(b.day) || 0);
    });

  // Discipline Score (0-100)
  const dailyTradeCounts = new Map<string, number>();
  for (const t of trades) {
    const dateKey = new Date(t.date).toISOString().split("T")[0];
    dailyTradeCounts.set(dateKey, (dailyTradeCounts.get(dateKey) || 0) + 1);
  }
  const daysOverLimit = Array.from(dailyTradeCounts.values()).filter((c) => c > 4).length;
  const totalDays = dailyTradeCounts.size;
  const disciplineScore = totalDays > 0 ? Math.round(((totalDays - daysOverLimit) / totalDays) * 100) : 100;

  return {
    expectancy,
    profitFactor,
    sharpeRatio,
    maxDrawdown,
    maxDrawdownPct,
    recoveryFactor,
    equityCurve,
    heatmap,
    dayHeatmap,
    disciplineScore,
    totalReturn: cumulative,
    avgGain,
    avgLoss,
    stdDev,
  };
}
