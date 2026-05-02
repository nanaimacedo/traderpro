export const dynamic = "force-dynamic";

import { getTrades } from "@/lib/actions";
import { calculateMetrics, getDailyResults, getCumulativeResults } from "@/lib/calculations";
import { formatCurrency } from "@/lib/utils";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DailyResultChart, CumulativeChart } from "@/components/dashboard/Charts";
import { WinRateGauge } from "@/components/dashboard/WinRateGauge";
import { DistributionDonut } from "@/components/dashboard/DistributionDonut";
import { PeriodFilter } from "@/components/dashboard/PeriodFilter";
import { StreakIndicator } from "@/components/dashboard/StreakIndicator";
import {
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Flame,
  AlertTriangle,
  Layers,
  Zap,
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

  const payoffRatio = metrics.losses > 0 && metrics.gains > 0
    ? Math.abs(metrics.totalGain / metrics.gains) / Math.abs(metrics.totalLoss / metrics.losses)
    : 0;

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Period Filter */}
      <PeriodFilter />

      {/* Hero row — Win Rate Gauge + Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        {/* Win Rate Gauge */}
        <Card className="lg:col-span-3 flex items-center justify-center p-6">
          <WinRateGauge
            winRate={metrics.winRate}
            gains={metrics.gains}
            losses={metrics.losses}
            zeros={metrics.zeros}
          />
        </Card>

        {/* Key Metrics 2x2 */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          <MetricCard
            title="Resultado Liquido"
            value={formatCurrency(metrics.netResult)}
            subtitle={`${metrics.totalPoints > 0 ? "+" : ""}${metrics.totalPoints.toFixed(1)} pontos`}
            icon={metrics.netResult >= 0 ? TrendingUp : TrendingDown}
            trend={metrics.netResult > 0 ? "up" : metrics.netResult < 0 ? "down" : "neutral"}
          />
          <MetricCard
            title="Total de Trades"
            value={metrics.totalTrades.toString()}
            subtitle={`Media ${metrics.avgPointsPerTrade > 0 ? "+" : ""}${metrics.avgPointsPerTrade.toFixed(1)} pts`}
            icon={BarChart3}
          />
          <MetricCard
            title="Contratos"
            value={metrics.totalContracts.toString()}
            subtitle="Operados no mes"
            icon={Layers}
          />
          <MetricCard
            title="Payoff Ratio"
            value={payoffRatio > 0 ? payoffRatio.toFixed(2) : "—"}
            subtitle={payoffRatio >= 1.5 ? "Excelente" : payoffRatio >= 1 ? "Adequado" : payoffRatio > 0 ? "Melhorar" : "Sem dados"}
            icon={Zap}
            trend={payoffRatio >= 1.5 ? "up" : payoffRatio > 0 ? "down" : "neutral"}
          />
        </div>

        {/* Distribution + Streak */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <Card className="flex-1 flex items-center justify-center p-5">
            <DistributionDonut
              gains={metrics.gains}
              losses={metrics.losses}
              zeros={metrics.zeros}
            />
          </Card>
          <StreakIndicator
            maxWinStreak={metrics.maxWinStreak}
            maxLossStreak={metrics.maxLossStreak}
            currentStreak={metrics.currentStreak}
          />
        </div>
      </div>

      {/* Financial row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Recent trades */}
      <Card>
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
                  className="flex items-center justify-between rounded-lg border border-zinc-50 bg-zinc-50/50 px-3 lg:px-4 py-3 transition-colors hover:bg-zinc-100/50"
                >
                  <div className="flex items-center gap-2 lg:gap-3">
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
  );
}
