export const revalidate = 300;

import { getTrades, getBrokerReportForMonth } from "@/lib/actions";
import { calculateMetrics, getDailyResults, formatDuration } from "@/lib/calculations";
import { formatCurrency, cn } from "@/lib/utils";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DailyResultChart } from "@/components/dashboard/Charts";
import { EvolutionChart } from "@/components/dashboard/EvolutionChart";
import { WinRateGauge } from "@/components/dashboard/WinRateGauge";
import { DistributionDonut } from "@/components/dashboard/DistributionDonut";
import { PeriodFilter } from "@/components/dashboard/PeriodFilter";
import { StreakIndicator } from "@/components/dashboard/StreakIndicator";
import { WeeklyInsights } from "@/components/dashboard/WeeklyInsights";
import {
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Flame,
  AlertTriangle,
  Layers,
  Zap,
  Calendar,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CircuitBreakerAlert } from "@/components/dashboard/CircuitBreakerAlert";
import { EconomicCalendar } from "@/components/dashboard/EconomicCalendar";

interface PageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function Dashboard({ searchParams }: PageProps) {
  const params = await searchParams;
  const now = new Date();
  const month = params.month !== undefined ? parseInt(params.month) : now.getMonth();
  const year = params.year !== undefined ? parseInt(params.year) : now.getFullYear();

  const [trades, brokerReport] = await Promise.all([
    getTrades(month, year),
    getBrokerReportForMonth(month, year),
  ]);
  const calculatedMetrics = calculateMetrics(trades);
  const dailyResults = getDailyResults(trades);

  // Prefer broker report data for all available fields when a report exists
  const metrics = brokerReport
    ? {
        ...calculatedMetrics,
        totalTrades:      brokerReport.totalTrades      ?? calculatedMetrics.totalTrades,
        gains:            brokerReport.gains            ?? calculatedMetrics.gains,
        losses:           brokerReport.losses           ?? calculatedMetrics.losses,
        zeros:            brokerReport.zeros            ?? calculatedMetrics.zeros,
        totalGain:        brokerReport.totalGain        ?? calculatedMetrics.totalGain,
        totalLoss:        brokerReport.totalLoss        ?? calculatedMetrics.totalLoss,
        netResult:        brokerReport.netResult        ?? calculatedMetrics.netResult,
        tradingDays:      brokerReport.tradingDays      ?? calculatedMetrics.tradingDays,
        maxDailyGain:     brokerReport.maxDailyGain     ?? calculatedMetrics.maxDailyGain,
        maxDailyLoss:     brokerReport.maxDailyLoss     ?? calculatedMetrics.maxDailyLoss,
        maxGainPerOp:     brokerReport.maxGainPerOp     ?? calculatedMetrics.maxGainPerOp,
        maxLossPerOp:     brokerReport.maxLossPerOp     ?? calculatedMetrics.maxLossPerOp,
        maxDurationTrade: brokerReport.maxDurationMinutes != null
          ? { seconds: brokerReport.maxDurationMinutes * 60, financialResult: brokerReport.maxDurationResult ?? 0 }
          : calculatedMetrics.maxDurationTrade,
        minDurationTrade: brokerReport.minDurationMinutes != null
          ? { seconds: brokerReport.minDurationMinutes * 60, financialResult: brokerReport.minDurationResult ?? 0 }
          : calculatedMetrics.minDurationTrade,
      }
    : calculatedMetrics;

  const payoffRatio = metrics.losses > 0 && metrics.gains > 0
    ? Math.abs(metrics.totalGain / metrics.gains) / Math.abs(metrics.totalLoss / metrics.losses)
    : 0;

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Circuit Breaker Alert */}
      <CircuitBreakerAlert />

      {/* Economic Calendar */}
      <EconomicCalendar />

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
            title="Resultado Líquido"
            value={formatCurrency(metrics.netResult)}
            subtitle={`${metrics.totalPoints > 0 ? "+" : ""}${metrics.totalPoints.toFixed(1)} pontos`}
            icon={metrics.netResult >= 0 ? TrendingUp : TrendingDown}
            trend={metrics.netResult > 0 ? "up" : metrics.netResult < 0 ? "down" : "neutral"}
          />
          <MetricCard
            title="Total de Trades"
            value={metrics.totalTrades.toString()}
            subtitle={`Média ${metrics.avgPointsPerTrade > 0 ? "+" : ""}${metrics.avgPointsPerTrade.toFixed(1)} pts`}
            icon={BarChart3}
          />
          <MetricCard
            title="Contratos"
            value={metrics.totalContracts.toString()}
            subtitle="Média por operação"
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

      {/* Resumo do Período */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-zinc-400" />
            Resumo do Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Coluna 1: Operações */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                <Calendar className="h-3 w-3" /> Operações
              </p>
              {[
                { label: "Dias Operados", value: metrics.tradingDays.toString(), color: "" },
                { label: "Total Operações", value: metrics.totalTrades.toString(), color: "" },
                { label: "Quant. Gain", value: metrics.gains.toString(), color: "text-emerald-600 dark:text-emerald-400" },
                { label: "Quant. Loss", value: metrics.losses.toString(), color: "text-rose-500" },
                { label: "Zeradas", value: metrics.zeros.toString(), color: "text-zinc-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                  <span className="text-xs text-zinc-500">{label}</span>
                  <span className={cn("text-sm font-semibold tabular-nums", color || "text-zinc-900 dark:text-zinc-100")}>{value}</span>
                </div>
              ))}
            </div>

            {/* Coluna 2: Extremos */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                <Zap className="h-3 w-3" /> Extremos
              </p>
              <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs text-zinc-500">Maior Gain Diário</span>
                <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{metrics.maxDailyGain > 0 ? formatCurrency(metrics.maxDailyGain) : "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs text-zinc-500">Maior Loss Diário</span>
                <span className="text-sm font-semibold tabular-nums text-rose-500">{metrics.maxDailyLoss < 0 ? formatCurrency(metrics.maxDailyLoss) : "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs text-zinc-500">Maior Gain por Op.</span>
                <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{metrics.maxGainPerOp > 0 ? formatCurrency(metrics.maxGainPerOp) : "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs text-zinc-500">Maior Loss por Op.</span>
                <span className="text-sm font-semibold tabular-nums text-rose-500">{metrics.maxLossPerOp < 0 ? formatCurrency(metrics.maxLossPerOp) : "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs text-zinc-500 flex items-center gap-1"><Clock className="h-3 w-3" /> Maior Tempo</span>
                <div className="text-right">
                  <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {metrics.maxDurationTrade ? formatDuration(metrics.maxDurationTrade.seconds) : "—"}
                  </span>
                  {metrics.maxDurationTrade && (
                    <span className={cn("text-xs ml-2", metrics.maxDurationTrade.financialResult >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500")}>
                      {formatCurrency(metrics.maxDurationTrade.financialResult)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-zinc-500 flex items-center gap-1"><Clock className="h-3 w-3" /> Menor Tempo</span>
                <div className="text-right">
                  <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {metrics.minDurationTrade ? formatDuration(metrics.minDurationTrade.seconds) : "—"}
                  </span>
                  {metrics.minDurationTrade && (
                    <span className={cn("text-xs ml-2", metrics.minDurationTrade.financialResult >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500")}>
                      {formatCurrency(metrics.minDurationTrade.financialResult)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Coluna 3: Resultado */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3" /> Resultado
              </p>
              <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs text-zinc-500">Valor Total Gain</span>
                <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(metrics.totalGain)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs text-zinc-500">Valor Total Loss</span>
                <span className="text-sm font-semibold tabular-nums text-rose-500">{formatCurrency(metrics.totalLoss)}</span>
              </div>
              <div className={cn(
                "flex items-center justify-between mt-4 p-3 rounded-xl",
                metrics.netResult >= 0
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800"
                  : "bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800"
              )}>
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">Resultado Final</span>
                <span className={cn(
                  "text-lg font-bold tabular-nums",
                  metrics.netResult >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                )}>
                  {formatCurrency(metrics.netResult)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DailyResultChart data={dailyResults} />
        <EvolutionChart
          trades={trades.map((t: any) => ({
            date: new Date(t.date).toISOString(),
            time: t.time,
            result: t.result,
            points: t.points,
            financialResult: t.financialResult,
            contracts: t.contracts,
          }))}
        />
      </div>

      {/* Weekly Insights */}
      <WeeklyInsights />

      {/* Recent trades */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Operações</CardTitle>
        </CardHeader>
        <CardContent>
          {trades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="h-10 w-10 text-zinc-300 dark:text-zinc-600 mb-3" />
              <p className="text-sm text-zinc-500">Nenhuma operação neste período</p>
              <p className="text-xs text-zinc-400 mt-1">Use as setas para navegar entre os meses</p>
            </div>
          ) : (
            <div className="space-y-2">
              {trades.slice(-5).reverse().map((trade: any) => (
                <div
                  key={trade.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-50 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 px-3 lg:px-4 py-3 transition-colors hover:bg-zinc-100/50 dark:hover:bg-zinc-800"
                >
                  <div className="flex items-center gap-2 lg:gap-3">
                    <Badge variant={trade.result === "GAIN" ? "gain" : trade.result === "LOSS" ? "loss" : "zero"}>
                      {trade.result}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
