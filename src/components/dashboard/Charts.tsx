"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3 } from "lucide-react";

interface DailyData {
  date: string;
  gain: number;
  loss: number;
  net: number;
  trades: number;
}

interface CumulativeData {
  index: number;
  date: string;
  cumulative: number;
}

const tooltipStyleLight = {
  backgroundColor: "rgba(255,255,255,0.95)",
  border: "1px solid #e4e4e7",
  borderRadius: "10px",
  fontSize: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  backdropFilter: "blur(8px)",
};

const tooltipStyleDark = {
  backgroundColor: "rgba(24,24,27,0.95)",
  border: "1px solid #3f3f46",
  borderRadius: "10px",
  fontSize: "12px",
  color: "#fafafa",
  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  backdropFilter: "blur(8px)",
};

function useTooltipStyle() {
  if (typeof document === "undefined") return tooltipStyleLight;
  return document.documentElement.classList.contains("dark") ? tooltipStyleDark : tooltipStyleLight;
}

export function DailyResultChart({ data }: { data: DailyData[] }) {
  const tooltipStyle = useTooltipStyle();
  const gridStroke = typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "#27272a" : "#f4f4f5";
  const formatted = data.map((d) => ({
    ...d,
    date: d.date.slice(5).replace("-", "/"),
    loss: Math.abs(d.loss),
  }));

  return (
    <Card className="group overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-2">
        <BarChart3 className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
        <CardTitle className="text-base">Resultado Diário</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 lg:h-72">
          {formatted.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-zinc-400 dark:text-zinc-500">Sem dados no período</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formatted} barGap={2} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#a1a1aa" }}
                  axisLine={{ stroke: gridStroke }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#a1a1aa" }}
                  tickFormatter={(v) => `R$${v}`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "rgba(0,0,0,0.03)" }}
                  formatter={(value, name) => [
                    `R$ ${Number(value).toFixed(2)}`,
                    name === "gain" ? "Ganhos" : "Perdas",
                  ]}
                />
                <Bar dataKey="gain" fill="#059669" radius={[6, 6, 0, 0]} name="gain" />
                <Bar dataKey="loss" fill="#f43f5e" radius={[6, 6, 0, 0]} name="loss" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function CumulativeChart({ data }: { data: CumulativeData[] }) {
  const tooltipStyle = useTooltipStyle();
  const gridStroke = typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "#27272a" : "#f4f4f5";
  const lastValue = data.length > 0 ? data[data.length - 1].cumulative : 0;
  const isPositive = lastValue >= 0;

  return (
    <Card className="group overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-2">
        <TrendingUp className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
        <CardTitle className="text-base">Evolução do Saldo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 lg:h-72">
          {data.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-zinc-400 dark:text-zinc-500">Sem dados no período</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="gradPositive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradNegative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#a1a1aa" }}
                  tickFormatter={(v) => v.slice(5).replace("-", "/")}
                  axisLine={{ stroke: gridStroke }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#a1a1aa" }}
                  tickFormatter={(v) => `R$${v}`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ stroke: "#d4d4d8", strokeDasharray: "4 4" }}
                  formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, "Saldo"]}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke={isPositive ? "#059669" : "#f43f5e"}
                  strokeWidth={2.5}
                  fill={isPositive ? "url(#gradPositive)" : "url(#gradNegative)"}
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
