export const dynamic = "force-dynamic";

import { getTrades } from "@/lib/actions";
import { calculateMetrics, getDailyResults, getCumulativeResults } from "@/lib/calculations";
import { formatCurrency } from "@/lib/utils";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DailyResultChart, CumulativeChart, DistributionChart } from "@/components/dashboard/Charts";
import { PeriodFilter } from "@/components/dashboard/PeriodFilter";
import {
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Flame,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function Dashboard({ searchParams }: PageProps) {
  const params = await searchParams;
  const now = new Date();
  const month = params.month !== undefined ? parseInt(params.month) : now.getMonth();
  const year = params.year !== undefined ? parseInt(params.year) : now.getFullYear();

  const trades = await getTrades(month, year);
  const metrics = calculateMetrics(trades);
  const dailyResults = getDailyResults(trades);
  const cumulativeResults = getCumulativeResults(trades);

  return (
    <div className="space-y-8">
      {/* Period Filter */}
      <PeriodFilter />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Resultado Liquido"
          value={formatCurrency(metrics.netResult)}
          subtitle={`${metrics.totalPoints.toFixed(1)} pontos totais`}
          icon={metrics.netResult >= 0 ? TrendingUp : TrendingDown}
          trend={metrics.netResult > 0 ? "up" : metrics.netResult < 0 ? "down" : "neutral"}
        />
        <MetricCard
          title="Win Rate"
          value={`${metrics.winRate.toFixed(1)}%`}
          subtitle={`${metrics.gains}G / ${metrics.losses}L / ${metrics.zeros}Z`}
          icon={Target}
          trend={metrics.winRate >= 50 ? "up" : "down"}
        />
        <MetricCard
          title="Total de Trades"
          value={metrics.totalTrades.toString()}
          subtitle={`Media ${metrics.avgPointsPerTrade.toFixed(1)} pts/trade`}
          icon={BarChart3}
        />
        <MetricCard
          title="Contratos"
          value={metrics.totalContracts.toString()}
          subtitle="Total operados no mes"
          icon={Layers}
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Gains"
          value={formatCurrency(metrics.totalGain)}
          icon={TrendingUp}
          trend="up"
        />
        <MetricCard
          title="Total Losses"
          value={formatCurrency(Math.abs(metrics.totalLoss))}
          icon={TrendingDown}
          trend="down"
        />
        <MetricCard
          title="Seq. Vencedora"
          value={`${metrics.maxWinStreak} trades`}
          subtitle={metrics.currentStreak.type === "win" ? `Atual: ${metrics.currentStreak.count}` : undefined}
          icon={Flame}
          trend="up"
        />
        <MetricCard
          title="Seq. Perdedora"
          value={`${metrics.maxLossStreak} trades`}
          subtitle={metrics.currentStreak.type === "loss" ? `Atual: ${metrics.currentStreak.count}` : undefined}
          icon={AlertTriangle}
          trend="down"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DailyResultChart data={dailyResults} />
        <CumulativeChart data={cumulativeResults} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DistributionChart data={{ gains: metrics.gains, losses: metrics.losses, zeros: metrics.zeros }} />

        {/* Recent trades */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ultimas Operacoes</CardTitle>
          </CardHeader>
          <CardContent>
            {trades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="h-10 w-10 text-zinc-300 mb-3" />
                <p className="text-sm text-zinc-500">Nenhuma operacao neste periodo</p>
                <p className="text-xs text-zinc-400 mt-1">Use as setas para navegar entre os meses</p>
              </div>
            ) : (
              <div className="space-y-2">
                {trades.slice(-5).reverse().map((trade: any) => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-50 bg-zinc-50/50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={trade.result === "GAIN" ? "gain" : trade.result === "LOSS" ? "loss" : "zero"}>
                        {trade.result}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium text-zinc-700">
                          {trade.direction} - {trade.contracts} ct
                        </p>
                        <p className="text-xs text-zinc-400">
                          {new Date(trade.date).toLocaleDateString("pt-BR")} {trade.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${trade.financialResult >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                        {formatCurrency(trade.financialResult)}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {trade.points > 0 ? "+" : ""}{trade.points.toFixed(1)} pts
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
