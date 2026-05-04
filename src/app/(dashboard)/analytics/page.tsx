export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { calculateAdvancedMetrics, getCumulativeResults } from "@/lib/calculations";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { BarChart3, TrendingUp, TrendingDown, Shield, Zap, Target, Clock, Calendar, Activity, Award } from "lucide-react";
import Link from "next/link";

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const allTrades = await prisma.trade.findMany({
    where: { userId: session.userId },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthTrades = allTrades.filter((t) => new Date(t.date) >= startOfMonth);

  const allMetrics = calculateAdvancedMetrics(allTrades);
  const monthMetrics = calculateAdvancedMetrics(monthTrades);
  const equityCurve = getCumulativeResults(allTrades);

  if (!allMetrics || allTrades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <BarChart3 className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-4" />
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Sem dados ainda</h2>
        <p className="text-sm text-zinc-500 mt-1">Registre trades para ver o analytics avançado</p>
      </div>
    );
  }

  function MetricCard({ label, value, subtitle, icon, color }: { label: string; value: string; subtitle?: string; icon: React.ReactNode; color: string }) {
    return (
      <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/80 p-4 border border-zinc-100 dark:border-zinc-700/50">
        <div className="flex items-center gap-2 mb-2">
          <div className={cn("p-1.5 rounded-lg", color)}>{icon}</div>
          <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{label}</span>
        </div>
        <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
        {subtitle && <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
    );
  }

  function HeatmapBar({ label, value, max, winRate, trades }: { label: string; value: number; max: number; winRate: number; trades: number }) {
    const width = max > 0 ? Math.abs(value) / max * 100 : 0;
    const isPositive = value >= 0;
    return (
      <div className="flex items-center gap-3 py-1.5">
        <span className="text-xs text-zinc-500 dark:text-zinc-400 w-14 shrink-0 font-mono">{label}</span>
        <div className="flex-1 h-6 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden relative">
          <div
            className={cn("h-full rounded-full transition-all", isPositive ? "bg-emerald-500/80" : "bg-rose-500/80")}
            style={{ width: `${Math.min(width, 100)}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
            {formatCurrency(value)} ({winRate.toFixed(0)}% WR · {trades}t)
          </span>
        </div>
      </div>
    );
  }

  // Equity curve simplified (last 50 points for display)
  const equityPoints = equityCurve.slice(-50);
  const equityMin = Math.min(...equityPoints.map((p) => p.cumulative), 0);
  const equityMax = Math.max(...equityPoints.map((p) => p.cumulative), 1);
  const equityRange = equityMax - equityMin || 1;

  const hourMax = Math.max(...allMetrics.heatmap.map((h) => Math.abs(h.result)), 1);
  const dayMax = Math.max(...allMetrics.dayHeatmap.map((d) => Math.abs(d.result)), 1);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-violet-500" />
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Analytics</h1>
        </div>
        <Link
          href="/insights"
          className="flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors"
        >
          Insights
        </Link>
      </div>

      {/* Métricas Institucionais */}
      <div>
        <h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Métricas Institucionais</h2>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Expectancy"
            value={formatCurrency(allMetrics.expectancy)}
            subtitle="Expectativa por trade"
            icon={<Target className="h-3.5 w-3.5 text-white" />}
            color={allMetrics.expectancy >= 0 ? "bg-emerald-500" : "bg-rose-500"}
          />
          <MetricCard
            label="Profit Factor"
            value={allMetrics.profitFactor === Infinity ? "∞" : allMetrics.profitFactor.toFixed(2)}
            subtitle="Ganho bruto / Perda bruta"
            icon={<Zap className="h-3.5 w-3.5 text-white" />}
            color={allMetrics.profitFactor >= 1.5 ? "bg-emerald-500" : allMetrics.profitFactor >= 1 ? "bg-amber-500" : "bg-rose-500"}
          />
          <MetricCard
            label="Sharpe Ratio"
            value={allMetrics.sharpeRatio.toFixed(2)}
            subtitle={allMetrics.sharpeRatio >= 2 ? "Excelente" : allMetrics.sharpeRatio >= 1 ? "Bom" : "Melhorar"}
            icon={<Activity className="h-3.5 w-3.5 text-white" />}
            color={allMetrics.sharpeRatio >= 2 ? "bg-emerald-500" : allMetrics.sharpeRatio >= 1 ? "bg-amber-500" : "bg-rose-500"}
          />
          <MetricCard
            label="Max Drawdown"
            value={formatCurrency(-allMetrics.maxDrawdown)}
            subtitle={`${allMetrics.maxDrawdownPct.toFixed(1)}% do pico`}
            icon={<TrendingDown className="h-3.5 w-3.5 text-white" />}
            color={allMetrics.maxDrawdownPct <= 10 ? "bg-emerald-500" : allMetrics.maxDrawdownPct <= 25 ? "bg-amber-500" : "bg-rose-500"}
          />
          <MetricCard
            label="Recovery Factor"
            value={allMetrics.recoveryFactor.toFixed(2)}
            subtitle="Retorno / Drawdown"
            icon={<TrendingUp className="h-3.5 w-3.5 text-white" />}
            color={allMetrics.recoveryFactor >= 2 ? "bg-emerald-500" : allMetrics.recoveryFactor >= 1 ? "bg-amber-500" : "bg-rose-500"}
          />
          <MetricCard
            label="Disciplina"
            value={`${allMetrics.disciplineScore}%`}
            subtitle="Dias dentro do limite"
            icon={<Shield className="h-3.5 w-3.5 text-white" />}
            color={allMetrics.disciplineScore >= 90 ? "bg-emerald-500" : allMetrics.disciplineScore >= 70 ? "bg-amber-500" : "bg-rose-500"}
          />
        </div>
      </div>

      {/* Equity Curve */}
      <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/80 p-4 border border-zinc-100 dark:border-zinc-700/50">
        <div className="flex items-center gap-2 mb-3">
          <Award className="h-4 w-4 text-violet-500" />
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Curva de Equity</span>
          <span className={cn("ml-auto text-sm font-bold", allMetrics.totalReturn >= 0 ? "text-emerald-600" : "text-rose-500")}>
            {formatCurrency(allMetrics.totalReturn)}
          </span>
        </div>
        <div className="h-32 flex items-end gap-[2px]">
          {equityPoints.map((point, i) => {
            const height = ((point.cumulative - equityMin) / equityRange) * 100;
            const isPositive = point.cumulative >= 0;
            return (
              <div
                key={i}
                className={cn("flex-1 rounded-t-sm min-h-[2px] transition-all", isPositive ? "bg-emerald-500/70" : "bg-rose-500/70")}
                style={{ height: `${Math.max(height, 2)}%` }}
                title={`${point.date}: ${formatCurrency(point.cumulative)}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-zinc-400">{equityPoints[0]?.date || ""}</span>
          <span className="text-[9px] text-zinc-400">{equityPoints[equityPoints.length - 1]?.date || ""}</span>
        </div>
      </div>

      {/* Heatmap por Horário */}
      <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/80 p-4 border border-zinc-100 dark:border-zinc-700/50">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-blue-500" />
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Performance por Horário</span>
        </div>
        <div className="space-y-0.5">
          {allMetrics.heatmap.map((h) => (
            <HeatmapBar key={h.hour} label={h.hour} value={h.result} max={hourMax} winRate={h.winRate} trades={h.trades} />
          ))}
        </div>
      </div>

      {/* Heatmap por Dia da Semana */}
      <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/80 p-4 border border-zinc-100 dark:border-zinc-700/50">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Performance por Dia</span>
        </div>
        <div className="space-y-0.5">
          {allMetrics.dayHeatmap.map((d) => (
            <HeatmapBar key={d.day} label={d.day.slice(0, 3)} value={d.result} max={dayMax} winRate={d.winRate} trades={d.trades} />
          ))}
        </div>
      </div>

      {/* Mês Atual vs Geral */}
      {monthMetrics && (
        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/80 p-4 border border-zinc-100 dark:border-zinc-700/50">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-violet-500" />
            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Mês Atual vs Geral</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Expectancy", month: formatCurrency(monthMetrics.expectancy), all: formatCurrency(allMetrics.expectancy) },
              { label: "Profit Factor", month: monthMetrics.profitFactor === Infinity ? "∞" : monthMetrics.profitFactor.toFixed(2), all: allMetrics.profitFactor === Infinity ? "∞" : allMetrics.profitFactor.toFixed(2) },
              { label: "Disciplina", month: `${monthMetrics.disciplineScore}%`, all: `${allMetrics.disciplineScore}%` },
            ].map((row) => (
              <div key={row.label}>
                <p className="text-[10px] text-zinc-400 uppercase">{row.label}</p>
                <p className="text-sm font-bold text-violet-600 dark:text-violet-400">{row.month}</p>
                <p className="text-[10px] text-zinc-400">Geral: {row.all}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
