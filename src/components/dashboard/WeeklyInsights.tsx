"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, TrendingUp, TrendingDown, Target, Loader2, Clock, Flame, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface InsightData {
  total: number;
  gains: number;
  losses: number;
  winRate: number;
  netResult: number;
  totalPoints: number;
  payoff: number;
  maxWinStreak: number;
  maxLossStreak: number;
  bestHour: { hour: string; result: number } | null;
  worstHour: { hour: string; result: number } | null;
  insights: string[];
}

interface WeeklyResponse {
  weekStart: string;
  weekEnd: string;
  insights: InsightData | null;
}

export function WeeklyInsights() {
  const [data, setData] = useState<WeeklyResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/insights/weekly")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
        </CardContent>
      </Card>
    );
  }

  if (!data?.insights || data.insights.total === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Brain className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-base">Insights da Semana</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-400 text-center py-4">Sem operacoes nesta semana</p>
        </CardContent>
      </Card>
    );
  }

  const i = data.insights;
  const isPositive = i.netResult >= 0;

  return (
    <Card className="overflow-hidden">
      {/* Accent top */}
      <div className={cn("h-1", isPositive ? "bg-emerald-500" : "bg-rose-500")} />

      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-base">Insights da Semana</CardTitle>
        </div>
        <Link
          href={`/mentor`}
          className="text-[10px] font-medium text-amber-600 hover:text-amber-700 uppercase tracking-wider"
        >
          Falar com Mentor
        </Link>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Mini KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg bg-zinc-50 p-3 text-center">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Resultado</p>
            <p className={cn("text-lg font-bold mt-0.5", isPositive ? "text-emerald-600" : "text-rose-500")}>
              R$ {i.netResult.toFixed(0)}
            </p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-3 text-center">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Win Rate</p>
            <p className={cn("text-lg font-bold mt-0.5", i.winRate >= 50 ? "text-emerald-600" : "text-rose-500")}>
              {i.winRate.toFixed(0)}%
            </p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-3 text-center">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Payoff</p>
            <p className={cn("text-lg font-bold mt-0.5", i.payoff >= 1.5 ? "text-emerald-600" : i.payoff >= 1 ? "text-amber-500" : "text-rose-500")}>
              {i.payoff > 0 ? i.payoff.toFixed(2) : "—"}
            </p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-3 text-center">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Trades</p>
            <p className="text-lg font-bold mt-0.5 text-zinc-900">
              {i.total}
            </p>
          </div>
        </div>

        {/* Insights list */}
        <div className="space-y-2">
          {i.insights.map((insight, idx) => {
            let icon = <Target className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" />;
            if (insight.includes("positiva") || insight.includes("excelente")) icon = <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />;
            if (insight.includes("negativa") || insight.includes("abaixo")) icon = <TrendingDown className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />;
            if (insight.includes("horario") || insight.includes("periodo")) icon = <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />;
            if (insight.includes("Sequencia") && insight.includes("gains")) icon = <Flame className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />;
            if (insight.includes("Sequencia") && insight.includes("losses")) icon = <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />;

            return (
              <div key={idx} className="flex items-start gap-2 rounded-lg bg-zinc-50/50 px-3 py-2">
                {icon}
                <p className="text-xs text-zinc-600 leading-relaxed">{insight}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
