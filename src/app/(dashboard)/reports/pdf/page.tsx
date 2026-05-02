export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { calculateMetrics, getDailyResults } from "@/lib/calculations";
import { formatCurrency } from "@/lib/utils";
import { ReportPrintView } from "@/components/reports/ReportPrintView";

interface PageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function ReportPDFPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const now = new Date();
  const month = params.month !== undefined ? parseInt(params.month) : now.getMonth();
  const year = params.year !== undefined ? parseInt(params.year) : now.getFullYear();

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);

  const trades = await prisma.trade.findMany({
    where: { date: { gte: startDate, lte: endDate } },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  const metrics = calculateMetrics(trades);
  const dailyResults = getDailyResults(trades);

  const monthNames = [
    "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  const payoffRatio = metrics.losses > 0 && metrics.gains > 0
    ? Math.abs(metrics.totalGain / metrics.gains) / Math.abs(metrics.totalLoss / metrics.losses)
    : 0;

  const reportData = {
    period: `${monthNames[month]} ${year}`,
    generatedAt: now.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    metrics,
    payoffRatio,
    trades: trades.map((t: any) => ({
      date: new Date(t.date).toLocaleDateString("pt-BR"),
      time: t.time,
      direction: t.direction,
      entryPrice: t.entryPrice,
      exitPrice: t.exitPrice,
      contracts: t.contracts,
      result: t.result,
      points: t.points,
      financialResult: t.financialResult,
    })),
    dailyResults,
  };

  return <ReportPrintView data={reportData} />;
}
