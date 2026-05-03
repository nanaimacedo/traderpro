export const dynamic = "force-dynamic";

import { MentorChat } from "@/components/mentor/MentorChat";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { calculateMetrics } from "@/lib/calculations";
import { generateWeeklyInsights } from "@/lib/insights";

export default async function MentorPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Semana atual
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 4);
  endOfWeek.setHours(23, 59, 59, 999);

  // === TRADES ===
  const monthTrades = await prisma.trade.findMany({
    where: { date: { gte: startOfMonth, lte: endOfMonth } },
    orderBy: { date: "asc" },
  });

  const weekTrades = monthTrades.filter(
    (t) => new Date(t.date) >= startOfWeek && new Date(t.date) <= endOfWeek
  );

  const lastTrades = await prisma.trade.findMany({
    orderBy: [{ date: "desc" }, { time: "desc" }],
    take: 8,
  });

  // === DIÁRIO ===
  const diaryEntries = await prisma.diaryEntry.findMany({
    orderBy: { date: "desc" },
    take: 5,
  });

  // === REPLAYS ===
  const replays = await prisma.replay.findMany({
    orderBy: { date: "desc" },
    take: 5,
  });

  // === RELATÓRIOS DA CORRETORA ===
  const reports = await prisma.brokerReport.findMany({
    orderBy: { date: "desc" },
    take: 3,
  });

  // === MONTAR CONTEXTO COMPLETO ===
  let context = "";

  // Métricas do mês
  if (monthTrades.length > 0) {
    const metrics = calculateMetrics(monthTrades);
    const payoff = metrics.losses > 0 && metrics.gains > 0
      ? Math.abs(metrics.totalGain / metrics.gains) / Math.abs(metrics.totalLoss / metrics.losses)
      : 0;

    context += `## MÉTRICAS DO MÊS (${now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })})\n`;
    context += `- Total de trades: ${metrics.totalTrades}\n`;
    context += `- Win rate: ${metrics.winRate.toFixed(1)}%\n`;
    context += `- Resultado líquido: ${formatCurrency(metrics.netResult)}\n`;
    context += `- Gains: ${metrics.gains} | Losses: ${metrics.losses} | Zeros: ${metrics.zeros}\n`;
    context += `- Total pontos: ${metrics.totalPoints.toFixed(1)}\n`;
    context += `- Média pts/trade: ${metrics.avgPointsPerTrade.toFixed(1)}\n`;
    context += `- Payoff ratio: ${payoff > 0 ? payoff.toFixed(2) : "—"}\n`;
    context += `- Sequência vencedora max: ${metrics.maxWinStreak}\n`;
    context += `- Sequência perdedora max: ${metrics.maxLossStreak}\n`;
    context += `- Total contratos: ${metrics.totalContracts}\n`;
    context += `- Meta mensal: R$ 4.400,00 | Progresso: ${formatCurrency(metrics.netResult)} (${((metrics.netResult / 4400) * 100).toFixed(0)}%)\n\n`;
  }

  // Insights da semana
  if (weekTrades.length > 0) {
    const weekInsights = generateWeeklyInsights(weekTrades);
    if (weekInsights) {
      context += `## INSIGHTS DA SEMANA\n`;
      context += `- Trades: ${weekInsights.total} | Win rate: ${weekInsights.winRate.toFixed(1)}%\n`;
      context += `- Resultado: ${formatCurrency(weekInsights.netResult)}\n`;
      context += `- Payoff: ${weekInsights.payoff > 0 ? weekInsights.payoff.toFixed(2) : "—"}\n`;
      if (weekInsights.bestHour) context += `- Melhor horário: ${weekInsights.bestHour.hour} (${formatCurrency(weekInsights.bestHour.result)})\n`;
      if (weekInsights.worstHour && weekInsights.worstHour.result < 0) context += `- Pior horário: ${weekInsights.worstHour.hour} (${formatCurrency(weekInsights.worstHour.result)})\n`;
      weekInsights.insights.forEach((i) => { context += `- ${i}\n`; });
      context += "\n";
    }
  }

  // Últimos trades
  if (lastTrades.length > 0) {
    context += `## ÚLTIMOS ${lastTrades.length} TRADES\n`;
    for (const t of lastTrades) {
      context += `- ${formatDate(t.date)} ${t.time} | ${t.direction} | ${t.contracts}ct | ${t.result} | ${t.points > 0 ? "+" : ""}${t.points.toFixed(1)}pts | ${formatCurrency(t.financialResult)}${t.notes ? ` | "${t.notes}"` : ""}\n`;
    }
    context += "\n";
  }

  // Diário
  if (diaryEntries.length > 0) {
    context += `## DIÁRIO DO TRADER (últimas ${diaryEntries.length} entradas)\n`;
    for (const d of diaryEntries) {
      context += `### ${formatDate(d.date)} — ${d.title}${d.mood ? ` [${d.mood}]` : ""}\n`;
      context += `${d.content.slice(0, 300)}${d.content.length > 300 ? "..." : ""}\n\n`;
    }
  }

  // Replays
  if (replays.length > 0) {
    context += `## REPLAYS (últimos ${replays.length} estudos)\n`;
    for (const r of replays) {
      const wr = r.entries > 0 ? ((r.gains / r.entries) * 100).toFixed(0) : "0";
      context += `- ${formatDate(r.date)} | "${r.title}" | ${r.entries} entradas | ${r.gains}G/${r.losses}L | WR: ${wr}% | ${r.points > 0 ? "+" : ""}${r.points.toFixed(1)}pts${r.mood ? ` | [${r.mood}]` : ""}\n`;
      if (r.content) context += `  Diário: ${r.content.slice(0, 300)}${r.content.length > 300 ? "..." : ""}\n`;
    }
    context += "\n";
  }

  // Relatórios da corretora
  if (reports.length > 0) {
    context += `## RELATÓRIOS DA CORRETORA\n`;
    for (const r of reports) {
      context += `- ${formatDate(r.date)} | ${r.originalName} | ${r.totalTrades || "?"} trades | Ganhos: ${r.totalGain ? formatCurrency(r.totalGain) : "?"} | Perdas: ${r.totalLoss ? formatCurrency(Math.abs(r.totalLoss)) : "?"} | Líquido: ${r.netResult ? formatCurrency(r.netResult) : "?"}\n`;
    }
    context += "\n";
  }

  // Situação geral
  if (!context) {
    context = "O trader ainda não registrou nenhuma operação no sistema. É o primeiro acesso.";
  } else {
    context += `## SITUAÇÃO ATUAL\n`;
    context += `- Data de hoje: ${now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}\n`;
    context += `- Total de replays realizados: ${replays.length}\n`;
    context += `- Total de entradas no diário: ${diaryEntries.length}\n`;
    context += `- Dia da semana: ${now.toLocaleDateString("pt-BR", { weekday: "long" })}\n`;
  }

  return <MentorChat tradesContext={context} />;
}
