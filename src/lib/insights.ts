interface TradeForInsight {
  date: Date;
  time: string;
  result: string;
  points: number;
  financialResult: number;
  contracts: number;
}

export function generateWeeklyInsights(trades: TradeForInsight[]) {
  if (trades.length === 0) return null;

  const total = trades.length;
  const gains = trades.filter((t) => t.result === "GAIN");
  const losses = trades.filter((t) => t.result === "LOSS");
  const winRate = (gains.length / total) * 100;
  const netResult = trades.reduce((s, t) => s + t.financialResult, 0);
  const totalPoints = trades.reduce((s, t) => s + t.points, 0);

  const avgGain = gains.length > 0 ? gains.reduce((s, t) => s + t.financialResult, 0) / gains.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.financialResult, 0) / losses.length) : 0;
  const payoff = avgLoss > 0 ? avgGain / avgLoss : 0;

  // Horarios
  const hourMap = new Map<string, { gains: number; losses: number; result: number }>();
  trades.forEach((t) => {
    const hour = t.time.slice(0, 2) + ":00";
    const entry = hourMap.get(hour) || { gains: 0, losses: 0, result: 0 };
    if (t.result === "GAIN") entry.gains++;
    else if (t.result === "LOSS") entry.losses++;
    entry.result += t.financialResult;
    hourMap.set(hour, entry);
  });

  const bestHour = Array.from(hourMap.entries()).sort((a, b) => b[1].result - a[1].result)[0];
  const worstHour = Array.from(hourMap.entries()).sort((a, b) => a[1].result - b[1].result)[0];

  // Streaks
  let maxWin = 0, maxLoss = 0, curWin = 0, curLoss = 0;
  trades.forEach((t) => {
    if (t.result === "GAIN") { curWin++; curLoss = 0; maxWin = Math.max(maxWin, curWin); }
    else if (t.result === "LOSS") { curLoss++; curWin = 0; maxLoss = Math.max(maxLoss, curLoss); }
    else { curWin = 0; curLoss = 0; }
  });

  // Daily breakdown
  const dayMap = new Map<string, number>();
  trades.forEach((t) => {
    const key = new Date(t.date).toLocaleDateString("pt-BR", { weekday: "short" });
    dayMap.set(key, (dayMap.get(key) || 0) + t.financialResult);
  });
  const bestDay = Array.from(dayMap.entries()).sort((a, b) => b[1] - a[1])[0];
  const worstDay = Array.from(dayMap.entries()).sort((a, b) => a[1] - b[1])[0];

  // Gerar insights texto
  const insights: string[] = [];

  // Performance geral
  if (netResult > 0) {
    insights.push(`Semana positiva: +R$ ${netResult.toFixed(2)} com ${total} operações.`);
  } else {
    insights.push(`Semana negativa: R$ ${netResult.toFixed(2)} com ${total} operações. Revise os pontos de atenção.`);
  }

  // Win rate
  if (winRate >= 60) {
    insights.push(`Win rate excelente: ${winRate.toFixed(0)}% — sua seletividade está afiada.`);
  } else if (winRate >= 45) {
    insights.push(`Win rate adequado: ${winRate.toFixed(0)}% — foque em melhorar a localização das entradas.`);
  } else {
    insights.push(`Win rate abaixo do ideal: ${winRate.toFixed(0)}% — revise se está respeitando a M8 como guarda.`);
  }

  // Payoff
  if (payoff >= 2) {
    insights.push(`Payoff ratio de ${payoff.toFixed(2)} — excelente gestão de gain vs loss.`);
  } else if (payoff >= 1) {
    insights.push(`Payoff ratio de ${payoff.toFixed(2)} — adequado, mas busque gains maiores ou losses menores.`);
  } else if (payoff > 0) {
    insights.push(`Payoff ratio de ${payoff.toFixed(2)} — seus losses médios são maiores que seus gains. Revise o stop.`);
  }

  // Streaks
  if (maxLoss >= 3) {
    insights.push(`Sequência de ${maxLoss} losses detectada — sinal de possível tilt ou falta de seletividade.`);
  }
  if (maxWin >= 3) {
    insights.push(`Sequência de ${maxWin} gains — cuidado com excesso de confiança. Mantenha o processo.`);
  }

  // Horarios
  if (bestHour) {
    insights.push(`Melhor horário: ${bestHour[0]} (R$ ${bestHour[1].result.toFixed(2)}). Considere concentrar operações nesse período.`);
  }
  if (worstHour && worstHour[1].result < 0) {
    insights.push(`Pior horário: ${worstHour[0]} (R$ ${worstHour[1].result.toFixed(2)}). Avalie se vale operar nesse período.`);
  }

  // Dias
  if (bestDay) {
    insights.push(`Melhor dia: ${bestDay[0]} (R$ ${bestDay[1].toFixed(2)}).`);
  }
  if (worstDay && worstDay[1] < 0) {
    insights.push(`Pior dia: ${worstDay[0]} (R$ ${worstDay[1].toFixed(2)}).`);
  }

  return {
    period: "semanal",
    total,
    gains: gains.length,
    losses: losses.length,
    winRate,
    netResult,
    totalPoints,
    payoff,
    avgGain,
    avgLoss,
    maxWinStreak: maxWin,
    maxLossStreak: maxLoss,
    bestHour: bestHour ? { hour: bestHour[0], result: bestHour[1].result } : null,
    worstHour: worstHour ? { hour: worstHour[0], result: worstHour[1].result } : null,
    insights,
  };
}
