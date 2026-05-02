"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = {
  gain: "#059669",
  loss: "#f43f5e",
  zero: "#a1a1aa",
};

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

interface DistributionData {
  gains: number;
  losses: number;
  zeros: number;
}

export function DailyResultChart({ data }: { data: DailyData[] }) {
  const formatted = data.map((d) => ({
    ...d,
    date: d.date.slice(5).replace("-", "/"),
    loss: Math.abs(d.loss),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultado Diario</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formatted} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#71717a" }} />
              <YAxis tick={{ fontSize: 11, fill: "#71717a" }} tickFormatter={(v) => `R$${v}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e4e4e7",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value, name) => [
                  `R$ ${Number(value).toFixed(2)}`,
                  name === "gain" ? "Ganhos" : "Perdas",
                ]}
              />
              <Bar dataKey="gain" fill={COLORS.gain} radius={[4, 4, 0, 0]} name="gain" />
              <Bar dataKey="loss" fill={COLORS.loss} radius={[4, 4, 0, 0]} name="loss" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function CumulativeChart({ data }: { data: CumulativeData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolucao do Saldo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#71717a" }} tickFormatter={(v) => v.slice(5).replace("-", "/")} />
              <YAxis tick={{ fontSize: 11, fill: "#71717a" }} tickFormatter={(v) => `R$${v}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e4e4e7",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, "Saldo"]}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#059669"
                strokeWidth={2}
                fill="url(#colorCumulative)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function DistributionChart({ data }: { data: DistributionData }) {
  const chartData = [
    { name: "Gain", value: data.gains, color: COLORS.gain },
    { name: "Loss", value: data.losses, color: COLORS.loss },
    { name: "Zero", value: data.zeros, color: COLORS.zero },
  ].filter((d) => d.value > 0);

  const total = data.gains + data.losses + data.zeros;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuicao</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 flex items-center justify-center">
          {total === 0 ? (
            <p className="text-sm text-zinc-400">Sem dados</p>
          ) : (
            <div className="flex items-center gap-8">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {chartData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-zinc-600">
                      {entry.name}: {entry.value} ({((entry.value / total) * 100).toFixed(0)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
