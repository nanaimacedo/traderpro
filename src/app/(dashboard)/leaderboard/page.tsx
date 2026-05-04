"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Trophy, Medal, TrendingUp, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface LeaderboardEntry {
  rank: number;
  displayName: string;
  isYou: boolean;
  trades: number;
  winRate: number;
  netResult: number;
  totalPoints: number;
  sharpe: number;
}

export default function LeaderboardPage() {
  const [data, setData] = useState<{ month: string; leaderboard: LeaderboardEntry[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then(async (res) => {
        if (res.status === 403) {
          setError("pro");
          return;
        }
        if (!res.ok) throw new Error();
        const d = await res.json();
        setData(d);
      })
      .catch(() => setError("error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-zinc-400">Carregando ranking...</div>
      </div>
    );
  }

  if (error === "pro") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <Lock className="h-12 w-12 text-zinc-300 dark:text-zinc-600" />
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Recurso Pro</h2>
        <p className="text-sm text-zinc-500 max-w-sm">
          O leaderboard esta disponivel apenas para assinantes Pro.
          Compare seu desempenho com outros traders de forma anonima.
        </p>
        <Link href="/pricing">
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
            <Crown className="h-4 w-4 mr-2" />
            Ver planos
          </Button>
        </Link>
      </div>
    );
  }

  if (!data || data.leaderboard.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Trophy className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-4" />
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Sem dados ainda</h2>
        <p className="text-sm text-zinc-500 mt-1">O ranking aparece quando ha traders operando no mes</p>
      </div>
    );
  }

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-amber-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-zinc-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="text-sm font-bold text-zinc-400 w-5 text-center">{rank}</span>;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-5 w-5 text-amber-500" />
        <div>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Leaderboard</h1>
          <p className="text-xs text-zinc-500">{data.month} — Ranking por Sharpe Ratio</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
            <div className="col-span-1">#</div>
            <div className="col-span-3">Trader</div>
            <div className="col-span-2 text-center">Trades</div>
            <div className="col-span-2 text-center">WR%</div>
            <div className="col-span-2 text-right">Pontos</div>
            <div className="col-span-2 text-right">Sharpe</div>
          </div>

          {/* Rows */}
          {data.leaderboard.map((entry) => (
            <div
              key={entry.rank}
              className={cn(
                "grid grid-cols-12 gap-2 px-4 py-3 items-center border-b border-zinc-50 dark:border-zinc-800/50 transition-colors",
                entry.isYou && "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30"
              )}
            >
              <div className="col-span-1 flex items-center">{rankIcon(entry.rank)}</div>
              <div className="col-span-3">
                <span className={cn(
                  "text-sm font-medium",
                  entry.isYou ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-700 dark:text-zinc-300"
                )}>
                  {entry.displayName}
                  {entry.isYou && <span className="text-[10px] ml-1 text-emerald-500">(voce)</span>}
                </span>
              </div>
              <div className="col-span-2 text-center text-sm text-zinc-500">{entry.trades}</div>
              <div className={cn(
                "col-span-2 text-center text-sm font-semibold",
                entry.winRate >= 60 ? "text-emerald-600" : entry.winRate >= 50 ? "text-amber-600" : "text-rose-500"
              )}>
                {entry.winRate}%
              </div>
              <div className={cn(
                "col-span-2 text-right text-sm font-mono font-medium",
                entry.totalPoints >= 0 ? "text-emerald-600" : "text-rose-500"
              )}>
                {entry.totalPoints > 0 ? "+" : ""}{entry.totalPoints.toFixed(1)}
              </div>
              <div className={cn(
                "col-span-2 text-right text-sm font-bold",
                entry.sharpe >= 2 ? "text-emerald-600" : entry.sharpe >= 1 ? "text-amber-600" : "text-rose-500"
              )}>
                {entry.sharpe.toFixed(2)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <TrendingUp className="h-3 w-3" />
        Ranking baseado no Sharpe Ratio (retorno ajustado ao risco). Nomes anonimizados.
      </div>
    </div>
  );
}
