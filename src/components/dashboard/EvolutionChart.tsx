"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  BarChart3,
  Target,
  DollarSign,
  Activity,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TradeItem {
  date: string;
  time: string;
  result: string;
  points: number;
  financialResult: number;
  contracts: number;
}

interface EvolutionChartProps {
  trades: TradeItem[];
}

type Indicator = "saldo" | "operacoes" | "gains" | "losses" | "winrate" | "pontos";
type Period = "mes" | "semana";

const indicators: { key: Indicator; label: string; icon: typeof TrendingUp; shortLabel: string }[] = [
  { key: "saldo", label: "Evolucao do Saldo", icon: DollarSign, shortLabel: "Saldo" },
  { key: "operacoes", label: "Qtd Operacoes", icon: BarChart3, shortLabel: "Operacoes" },
  { key: "gains", label: "Gains Acumulados", icon: TrendingUp, shortLabel: "Gains" },
  { key: "losses", label: "Losses Acumulados", icon: Activity, shortLabel: "Losses" },
  { key: "winrate", label: "Win Rate Evolutivo", icon: Target, shortLabel: "Win Rate" },
  { key: "pontos", label: "Pontos Acumulados", icon: Layers, shortLabel: "Pontos" },
];

const tooltipStyle = {
  backgroundColor: "rgba(255,255,255,0.95)",
  border: "1px solid #e4e4e7",
  borderRadius: "10px",
  fontSize: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

function getWeekNumber(dateStr: string) {
  const d = new Date(dateStr);
  const dayOfMonth = d.getDate();
  return Math.ceil(dayOfMonth / 7);
}

export function EvolutionChart({ trades }: EvolutionChartProps) {
  const [indicator, setIndicator] = useState<Indicator>("saldo");
  const [period, setPeriod] = useState<Period>("mes");

  const chartData = useMemo(() => {
    if (trades.length === 0) return [];

    const sorted = [...trades].sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      return da - db || a.time.localeCompare(b.time);
    });

    if (period === "semana") {
      const weekMap = new Map<number, { trades: TradeItem[] }>();
      sorted.forEach((t) => {
        const week = getWeekNumber(t.date);
        if (!weekMap.has(week)) weekMap.set(week, { trades: [] });
        weekMap.get(week)!.trades.push(t);
      });

      let cumSaldo = 0;
      let cumGains = 0;
      let cumLosses = 0;
      let cumPontos = 0;
      let totalTrades = 0;
      let totalGains = 0;

      return Array.from(weekMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([week, data]) => {
          const weekTrades = data.trades;
          weekTrades.forEach((t) => {
            cumSaldo += t.financialResult;
            cumPontos += t.points;
            totalTrades++;
            if (t.result === "GAIN") { cumGains += t.financialResult; totalGains++; }
            if (t.result === "LOSS") cumLosses += Math.abs(t.financialResult);
          });

          return {
            label: `Sem ${week}`,
            saldo: cumSaldo,
            operacoes: weekTrades.length,
            gains: cumGains,
            losses: cumLosses,
            winrate: totalTrades > 0 ? (totalGains / totalTrades) * 100 : 0,
            pontos: cumPontos,
          };
        });
    }

    // Per day (mes)
    const dayMap = new Map<string, TradeItem[]>();
    sorted.forEach((t) => {
      const key = t.date.slice(0, 10);
      if (!dayMap.has(key)) dayMap.set(key, []);
      dayMap.get(key)!.push(t);
    });

    let cumSaldo = 0;
    let cumGains = 0;
    let cumLosses = 0;
    let cumPontos = 0;
    let totalTrades = 0;
    let totalGains = 0;

    return Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, dayTrades]) => {
        dayTrades.forEach((t) => {
          cumSaldo += t.financialResult;
          cumPontos += t.points;
          totalTrades++;
          if (t.result === "GAIN") { cumGains += t.financialResult; totalGains++; }
          if (t.result === "LOSS") cumLosses += Math.abs(t.financialResult);
        });

        return {
          label: dateKey.slice(5).replace("-", "/"),
          saldo: cumSaldo,
          operacoes: dayTrades.length,
          gains: cumGains,
          losses: cumLosses,
          winrate: totalTrades > 0 ? (totalGains / totalTrades) * 100 : 0,
          pontos: cumPontos,
        };
      });
  }, [trades, period]);

  const activeIndicator = indicators.find((i) => i.key === indicator)!;

  function getColor() {
    if (indicator === "losses") return "#f43f5e";
    if (indicator === "winrate") return "#f59e0b";
    if (indicator === "operacoes") return "#6366f1";
    if (indicator === "pontos") return "#8b5cf6";
    return "#059669";
  }

  function formatValue(val: number) {
    if (indicator === "winrate") return `${val.toFixed(1)}%`;
    if (indicator === "operacoes") return val.toString();
    if (indicator === "pontos") return `${val > 0 ? "+" : ""}${val.toFixed(1)} pts`;
    return `R$ ${val.toFixed(2)}`;
  }

  function formatAxis(val: number) {
    if (indicator === "winrate") return `${val}%`;
    if (indicator === "operacoes" || indicator === "pontos") return val.toString();
    return `R$${val}`;
  }

  const color = getColor();
  const lastValue = chartData.length > 0 ? chartData[chartData.length - 1][indicator] : 0;

  return (
    <Card className="overflow-hidden">
      {/* Header with indicator selector */}
      <div className="flex flex-col gap-3 p-4 lg:p-6 pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <activeIndicator.icon className="h-4 w-4" style={{ color }} />
            <h3 className="text-base font-semibold text-zinc-900">{activeIndicator.label}</h3>
            {chartData.length > 0 && (
              <span className="text-sm font-bold ml-1" style={{ color }}>
                {formatValue(lastValue)}
              </span>
            )}
          </div>

          {/* Period toggle */}
          <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
            {(["mes", "semana"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer",
                  period === p
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                {p === "mes" ? "Diario" : "Semanal"}
              </button>
            ))}
          </div>
        </div>

        {/* Indicator pills */}
        <div className="flex flex-wrap gap-1.5">
          {indicators.map((ind) => (
            <button
              key={ind.key}
              onClick={() => setIndicator(ind.key)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer",
                indicator === ind.key
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700"
              )}
            >
              <ind.icon className="h-3 w-3" />
              {ind.shortLabel}
            </button>
          ))}
        </div>
      </div>

      <CardContent className="pt-0">
        <div className="h-64 lg:h-72">
          {chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-zinc-400">Sem dados no periodo</p>
            </div>
          ) : indicator === "operacoes" ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={period === "semana" ? 32 : 18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#a1a1aa" }} axisLine={{ stroke: "#f4f4f5" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#a1a1aa" }} tickFormatter={formatAxis} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, "Operacoes"]} />
                <Bar dataKey="operacoes" fill={color} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : indicator === "winrate" ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#a1a1aa" }} axisLine={{ stroke: "#f4f4f5" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#a1a1aa" }} tickFormatter={formatAxis} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${Number(v).toFixed(1)}%`, "Win Rate"]} />
                {/* Reference line at 50% */}
                <Line type="monotone" dataKey={() => 50} stroke="#e4e4e7" strokeDasharray="4 4" dot={false} strokeWidth={1} />
                <Line type="monotone" dataKey="winrate" stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color, stroke: "white", strokeWidth: 2 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`grad-${indicator}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#a1a1aa" }} axisLine={{ stroke: "#f4f4f5" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#a1a1aa" }} tickFormatter={formatAxis} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatValue(Number(v)), activeIndicator.label]} />
                <Area
                  type="monotone"
                  dataKey={indicator}
                  stroke={color}
                  strokeWidth={2.5}
                  fill={`url(#grad-${indicator})`}
                  dot={false}
                  activeDot={{ r: 5, stroke: "white", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
