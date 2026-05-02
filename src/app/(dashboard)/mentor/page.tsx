export const dynamic = "force-dynamic";

import { MentorChat } from "@/components/mentor/MentorChat";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { calculateMetrics } from "@/lib/calculations";

export default async function MentorPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const trades = await prisma.trade.findMany({
    where: { date: { gte: startOfMonth, lte: endOfMonth } },
    orderBy: { date: "asc" },
  });

  const allTrades = await prisma.trade.findMany({
    orderBy: [{ date: "desc" }, { time: "desc" }],
    take: 20,
  });

  let tradesContext = "";

  if (trades.length > 0) {
    const metrics = calculateMetrics(trades);
    tradesContext += `Mês atual (${now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}):\n`;
    tradesContext += `- Total de trades: ${metrics.totalTrades}\n`;
    tradesContext += `- Win rate: ${metrics.winRate.toFixed(1)}%\n`;
    tradesContext += `- Resultado líquido: ${formatCurrency(metrics.netResult)}\n`;
    tradesContext += `- Gains: ${metrics.gains} | Losses: ${metrics.losses} | Zeros: ${metrics.zeros}\n`;
    tradesContext += `- Total pontos: ${metrics.totalPoints.toFixed(1)}\n`;
    tradesContext += `- Média pts/trade: ${metrics.avgPointsPerTrade.toFixed(1)}\n`;
    tradesContext += `- Sequência vencedora max: ${metrics.maxWinStreak}\n`;
    tradesContext += `- Sequência perdedora max: ${metrics.maxLossStreak}\n`;
    tradesContext += `- Total contratos: ${metrics.totalContracts}\n`;
  }

  if (allTrades.length > 0) {
    tradesContext += `\nÚltimos ${allTrades.length} trades:\n`;
    for (const t of allTrades.slice(0, 10)) {
      tradesContext += `- ${new Date(t.date).toLocaleDateString("pt-BR")} ${t.time} | ${t.direction} | ${t.contracts}ct | ${t.result} | ${t.points > 0 ? "+" : ""}${t.points.toFixed(1)}pts | ${formatCurrency(t.financialResult)}${t.notes ? ` | "${t.notes}"` : ""}\n`;
    }
  }

  if (!tradesContext) {
    tradesContext = "O trader ainda nao registrou nenhuma operação no sistema.";
  }

  return <MentorChat tradesContext={tradesContext} />;
}
