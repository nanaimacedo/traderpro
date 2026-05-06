"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, TrendingUp, TrendingDown, Target, Loader2, Clock, Flame, AlertTriangle, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
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

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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
        <CardContent className="flex items-center justify-center py-12">
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
          <p className="text-sm text-zinc-400 text-center py-6">Sem operações nesta semana</p>
        </CardContent>
      </Card>
    );
  }

  const i = data.insights;
  const isPositive = i.netResult >= 0;
  const zeros = i.total - i.gains - i.losses;

  return (
    <Card className="overflow-hidden">
      {/* Gradient accent */}
      <div className={cn(
        "h-1.5",
        isPositive
          ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
          : "bg-gradient-to-r from-rose-500 to-rose-400"
      )} />

      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
            <Brain className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <CardTitle className="text-base">Insights da Semana</CardTitle>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              {new Date(data.weekStart).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} — {new Date(data.weekEnd).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
            </p>
          </div>
        </div>
        <Link
          href="/mentor"
          className="flex items-center gap-1 rounded-lg bg-amber-50 dark:bg-amber-950 px-2.5 py-1.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors uppercase tracking-wider"
        >
          <Brain className="h-3 w-3" />
          Mentor
        </Link>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Hero result */}
        <div className={cn(
          "rounded-xl p-4 text-center",
          isPositive
            ? "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900"
            : "bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-900"
        )}>
          <div className="flex items-center justify-center gap-2">
            {isPositive
              ? <ArrowUpRight className="h-5 w-5 text-emerald-500" />
              : <ArrowDownRight className="h-5 w-5 text-rose-500" />
            }
            <span className={cn("text-2xl font-bold", isPositive ? "text-emerald-600" : "text-rose-500")}>
              {formatCurrency(i.netResult)}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {i.totalPoints > 0 ? "+" : ""}{i.totalPoints.toFixed(1)} pontos em {i.total} operações
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/80 p-3 text-center">
            <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Win Rate</p>
            <p className={cn("text-lg font-bold mt-0.5", i.winRate >= 50 ? "text-emerald-600" : "text-rose-500")}>
              {i.winRate.toFixed(0)}%
            </p>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span className="text-[10px] text-emerald-600 font-semibold">{i.gains}G</span>
              <span className="text-[10px] text-zinc-300 dark:text-zinc-600">/</span>
              <span className="text-[10px] text-rose-500 font-semibold">{i.losses}L</span>
              {zeros > 0 && (
                <>
                  <span className="text-[10px] text-zinc-300 dark:text-zinc-600">/</span>
                  <span className="text-[10px] text-zinc-400 font-semibold">{zeros}Z</span>
                </>
              )}
            </div>
          </div>
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/80 p-3 text-center">
            <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Payoff</p>
            <p className={cn("text-lg font-bold mt-0.5", i.payoff >= 1.5 ? "text-emerald-600" : i.payoff >= 1 ? "text-amber-500" : "text-rose-500")}>
              {i.payoff > 0 ? i.payoff.toFixed(2) : "—"}
            </p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
              {i.payoff >= 1.5 ? "Excelente" : i.payoff >= 1 ? "Adequado" : "Melhorar"}
            </p>
          </div>
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/80 p-3 text-center">
            <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Streaks</p>
            <div className="flex items-center justify-center gap-2 mt-1.5">
              <div className="flex items-center gap-0.5">
                <Flame className="h-3 w-3 text-emerald-500" />
                <span className="text-sm font-bold text-emerald-600">{i.maxWinStreak}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <AlertTriangle className="h-3 w-3 text-rose-500" />
                <span className="text-sm font-bold text-rose-500">{i.maxLossStreak}</span>
              </div>
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Max W / L</p>
          </div>
        </div>

        {/* Best/Worst hours */}
        {(i.bestHour || (i.worstHour && i.worstHour.result < 0)) && (
          <div className="flex gap-2">
            {i.bestHour && (
              <div className="flex-1 flex items-center gap-2 rounded-lg border border-emerald-100 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30 px-3 py-2">
                <Clock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">Melhor: {i.bestHour.hour}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-500">{formatCurrency(i.bestHour.result)}</p>
                </div>
              </div>
            )}
            {i.worstHour && i.worstHour.result < 0 && (
              <div className="flex-1 flex items-center gap-2 rounded-lg border border-rose-100 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30 px-3 py-2">
                <Clock className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">Pior: {i.worstHour.hour}</p>
                  <p className="text-[10px] text-rose-500">{formatCurrency(i.worstHour.result)}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Insights list */}
        <div className="space-y-1.5">
          {i.insights.map((insight, idx) => {
            let Icon = Target;
            let color = "text-zinc-400";

            if (insight.includes("positiva") || insight.includes("excelente")) { Icon = TrendingUp; color = "text-emerald-500"; }
            else if (insight.includes("negativa") || insight.includes("abaixo")) { Icon = TrendingDown; color = "text-rose-500"; }
            else if (insight.includes("orário") || insight.includes("eríodo")) { Icon = Clock; color = "text-blue-500"; }
            else if (insight.includes("equência") && insight.includes("gains")) { Icon = Flame; color = "text-emerald-500"; }
            else if (insight.includes("equência") && insight.includes("losses")) { Icon = AlertTriangle; color = "text-rose-500"; }
            else if (insight.includes("dia:") || insight.includes("Melhor dia") || insight.includes("Pior dia")) { Icon = Minus; color = "text-amber-500"; }

            return (
              <div key={idx} className="flex items-start gap-2.5 rounded-lg bg-zinc-50/80 dark:bg-zinc-800/50 px-3 py-2.5">
                <Icon className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", color)} />
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{insight}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
