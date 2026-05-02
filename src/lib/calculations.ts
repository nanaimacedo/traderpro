interface TradeData {
  result: string;
  points: number;
  financialResult: number;
  contracts: number;
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
