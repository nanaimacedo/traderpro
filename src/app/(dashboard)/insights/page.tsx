export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateWeeklyInsights } from "@/lib/insights";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, TrendingUp, TrendingDown, Target, Clock, Flame, AlertTriangle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 4);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

export default async function InsightsPage() {
  const session = await getSession();
  const userId = session?.userId;

  const week = getWeekRange();
  const month = getMonthRange();

  const weekTrades = await prisma.trade.findMany({
    where: { userId, date: { gte: week.start, lte: week.end } },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  const monthTrades = await prisma.trade.findMany({
    where: { userId, date: { gte: month.start, lte: month.end } },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  const weekInsights = generateWeeklyInsights(weekTrades);
  const monthInsights = generateWeeklyInsights(monthTrades);

  const now = new Date();
  const monthName = now.toLocaleDateString("pt-BR", { month: "long" });

  function renderInsightCard(
    title: string,
    icon: React.ReactNode,
    insights: ReturnType<typeof generateWeeklyInsights>,
    accentColor: string,
  ) {
    if (!insights || insights.total === 0) {
      return (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            {icon}
            <CardTitle className="text-base">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-400 text-center py-6">Sem operações neste período</p>
          </CardContent>
        </Card>
      );
    }

    const isPositive = insights.netResult >= 0;

    return (
      <Card className="overflow-hidden">
        <div className={cn("h-1", accentColor)} />
        <CardHeader className="flex flex-row items-center gap-2 pb-3">
          {icon}
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* KPIs Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-4 text-center">
              <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Resultado</p>
              <p className={cn("text-xl font-bold mt-1", isPositive ? "text-emerald-600" : "text-rose-500")}>
                {formatCurrency(insights.netResult)}
              </p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                {insights.totalPoints > 0 ? "+" : ""}{insights.totalPoints.toFixed(1)} pts
              </p>
            </div>
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-4 text-center">
              <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Win Rate</p>
              <p className={cn("text-xl font-bold mt-1", insights.winRate >= 50 ? "text-emerald-600" : "text-rose-500")}>
                {insights.winRate.toFixed(1)}%
              </p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                {insights.gains}G / {insights.losses}L
              </p>
            </div>
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-4 text-center">
              <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Payoff</p>
              <p className={cn("text-xl font-bold mt-1", insights.payoff >= 1.5 ? "text-emerald-600" : insights.payoff >= 1 ? "text-amber-500" : "text-rose-500")}>
                {insights.payoff > 0 ? insights.payoff.toFixed(2) : "—"}
              </p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                G: R${insights.avgGain.toFixed(0)} / L: R${insights.avgLoss.toFixed(0)}
              </p>
            </div>
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-4 text-center">
              <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Trades</p>
              <p className="text-xl font-bold mt-1 text-zinc-900 dark:text-zinc-100">{insights.total}</p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                Streaks: {insights.maxWinStreak}W / {insights.maxLossStreak}L
              </p>
            </div>
          </div>

          {/* Horarios */}
          {(insights.bestHour || insights.worstHour) && (
            <div className="flex gap-3">
              {insights.bestHour && (
                <div className="flex-1 rounded-lg border border-emerald-100 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/50 p-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-emerald-600" />
                    <span className="text-[10px] font-semibold text-emerald-700 uppercase">Melhor Horário</span>
                  </div>
                  <p className="text-sm font-bold text-emerald-700 mt-1">{insights.bestHour.hour}</p>
                  <p className="text-[10px] text-emerald-600">{formatCurrency(insights.bestHour.result)}</p>
                </div>
              )}
              {insights.worstHour && insights.worstHour.result < 0 && (
                <div className="flex-1 rounded-lg border border-rose-100 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/50 p-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-rose-500" />
                    <span className="text-[10px] font-semibold text-rose-600 uppercase">Pior Horário</span>
                  </div>
                  <p className="text-sm font-bold text-rose-600 mt-1">{insights.worstHour.hour}</p>
                  <p className="text-[10px] text-rose-500">{formatCurrency(insights.worstHour.result)}</p>
                </div>
              )}
            </div>
          )}

          {/* Insights */}
          <div className="space-y-1.5">
            {insights.insights.map((text, idx) => {
              let icon = <Target className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" />;
              if (text.includes("positiva") || text.includes("excelente")) icon = <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />;
              if (text.includes("negativa") || text.includes("abaixo")) icon = <TrendingDown className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />;
              if (text.includes("horário")) icon = <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />;
              if (text.includes("gains") && text.includes("Sequência")) icon = <Flame className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />;
              if (text.includes("losses") && text.includes("Sequência")) icon = <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />;

              return (
                <div key={idx} className="flex items-start gap-2 rounded-lg bg-zinc-50/50 dark:bg-zinc-800/50 px-3 py-2">
                  {icon}
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{text}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-amber-500" />
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Insights</h1>
        </div>
        <Link
          href="/mentor"
          className="flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors"
        >
          <Brain className="h-3.5 w-3.5" />
          Falar com Mentor
        </Link>
      </div>

      {/* Semanal */}
      {renderInsightCard(
        "Esta Semana",
        <Calendar className="h-4 w-4 text-blue-500" />,
        weekInsights,
        weekInsights && weekInsights.netResult >= 0 ? "bg-emerald-500" : "bg-rose-500"
      )}

      {/* Mensal */}
      {renderInsightCard(
        `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`,
        <Calendar className="h-4 w-4 text-amber-500" />,
        monthInsights,
        monthInsights && monthInsights.netResult >= 0 ? "bg-emerald-500" : "bg-rose-500"
      )}
    </div>
  );
}
