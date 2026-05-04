export const dynamic = "force-dynamic";

import { getDiaryEntries } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Tags } from "lucide-react";
import { NewDiaryForm } from "@/components/diary/NewDiaryForm";
import { DiaryEntryCard } from "@/components/diary/DiaryEntryCard";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

const moodLabels: Record<string, { label: string; color: string }> = {
  OTIMISTA: { label: "Otimista", color: "bg-emerald-50 text-emerald-700" },
  NEUTRO: { label: "Neutro", color: "bg-zinc-100 text-zinc-600" },
  FRUSTRADO: { label: "Frustrado", color: "bg-rose-50 text-rose-700" },
  DISCIPLINADO: { label: "Disciplinado", color: "bg-blue-50 text-blue-700" },
  ANSIOSO: { label: "Ansioso", color: "bg-amber-50 text-amber-700" },
};

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function DiaryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab = params.tab === "setups" ? "setups" : "diario";

  const session = await getSession();
  if (!session) redirect("/login");

  const tabClass = (active: boolean) =>
    cn(
      "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
      active
        ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
        : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
    );

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        <Link href="/diary" className={tabClass(tab === "diario")}>
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Diário
          </span>
        </Link>
        <Link href="/diary?tab=setups" className={tabClass(tab === "setups")}>
          <span className="flex items-center gap-1.5">
            <Tags className="h-3.5 w-3.5" />
            Setups
          </span>
        </Link>
      </div>

      {tab === "diario" ? (
        <DiarioTab />
      ) : (
        <SetupsTab userId={session.userId} />
      )}
    </div>
  );
}

async function DiarioTab() {
  const entries = await getDiaryEntries();

  return (
    <div className="space-y-8">
      <NewDiaryForm />
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
          Entradas Anteriores
        </h3>
        {entries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BookOpen className="h-12 w-12 text-zinc-200 mb-4" />
              <p className="text-sm text-zinc-500">Nenhuma entrada no diário</p>
              <p className="text-xs text-zinc-400 mt-1">Registre suas análises e aprendizados</p>
            </CardContent>
          </Card>
        ) : (
          (entries as any[]).map((entry) => (
            <DiaryEntryCard key={entry.id} entry={entry} moodLabels={moodLabels} />
          ))
        )}
      </div>
    </div>
  );
}

async function SetupsTab({ userId }: { userId: string }) {
  const trades = await prisma.trade.findMany({
    where: { userId },
    orderBy: [{ date: "asc" }, { time: "asc" }],
    select: { setup: true, result: true, financialResult: true },
  });

  const tradesWithSetup = trades.filter((t) => t.setup);
  const tradesWithoutSetup = trades.filter((t) => !t.setup);
  const tagRate = trades.length > 0 ? (tradesWithSetup.length / trades.length) * 100 : 0;

  const setupMap = new Map<string, { results: number[]; gains: number; losses: number }>();
  for (const t of tradesWithSetup) {
    const key = t.setup!;
    const existing = setupMap.get(key) || { results: [], gains: 0, losses: 0 };
    existing.results.push(t.financialResult);
    if (t.result === "GAIN") existing.gains++;
    if (t.result === "LOSS") existing.losses++;
    setupMap.set(key, existing);
  }

  const setupStats = Array.from(setupMap.entries())
    .map(([setup, data]) => {
      const total = data.results.length;
      const winRate = (data.gains / total) * 100;
      const totalResult = data.results.reduce((s, v) => s + v, 0);
      const gainResults = data.results.filter((r) => r > 0);
      const lossResults = data.results.filter((r) => r < 0);
      const avgGain = gainResults.length > 0 ? gainResults.reduce((s, v) => s + v, 0) / gainResults.length : 0;
      const avgLoss = lossResults.length > 0 ? Math.abs(lossResults.reduce((s, v) => s + v, 0) / lossResults.length) : 0;
      const grossGain = gainResults.reduce((s, v) => s + v, 0);
      const grossLoss = Math.abs(lossResults.reduce((s, v) => s + v, 0));
      const profitFactor = grossLoss > 0 ? grossGain / grossLoss : grossGain > 0 ? Infinity : 0;
      return { setup, trades: total, gains: data.gains, losses: data.losses, winRate, totalResult, avgGain, avgLoss, profitFactor };
    })
    .sort((a, b) => b.totalResult - a.totalResult);

  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <Tags className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-4" />
        <p className="text-sm text-zinc-500">Registre trades com setup tagueado para ver analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tag Rate */}
      <div className={cn(
        "rounded-xl p-4 border",
        tagRate >= 80 ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800"
          : tagRate >= 50 ? "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800"
          : "bg-zinc-50 dark:bg-zinc-800/80 border-zinc-100 dark:border-zinc-700/50"
      )}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Taxa de Tagging</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{tagRate.toFixed(0)}%</p>
          </div>
          <div className="text-right text-xs text-zinc-500">
            <p>{tradesWithSetup.length} com setup</p>
            <p>{tradesWithoutSetup.length} sem setup</p>
          </div>
        </div>
        <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 mt-3 overflow-hidden">
          <div className="h-full rounded-full bg-violet-500" style={{ width: `${tagRate}%` }} />
        </div>
      </div>

      {setupStats.length === 0 ? (
        <p className="text-center text-sm text-zinc-500 py-8">Nenhum trade com setup tagueado ainda.</p>
      ) : (
        <div className="space-y-3">
          {setupStats.map((s, i) => (
            <div key={s.setup} className="rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900 text-xs font-bold text-violet-700 dark:text-violet-300">
                    #{i + 1}
                  </span>
                  <div>
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{s.setup}</span>
                    <span className="text-xs text-zinc-400 ml-2">{s.trades} trades</span>
                  </div>
                </div>
                <span className={cn("text-sm font-bold", s.totalResult >= 0 ? "text-emerald-600" : "text-rose-500")}>
                  {formatCurrency(s.totalResult)}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase">Win Rate</p>
                  <p className={cn("text-sm font-bold", s.winRate >= 50 ? "text-emerald-600" : "text-rose-500")}>{s.winRate.toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase">Fator L.</p>
                  <p className={cn("text-sm font-bold", s.profitFactor >= 1.5 ? "text-emerald-600" : s.profitFactor >= 1 ? "text-amber-500" : "text-rose-500")}>
                    {s.profitFactor === Infinity ? "∞" : s.profitFactor.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase">Média G.</p>
                  <p className="text-sm font-bold text-emerald-600">{formatCurrency(s.avgGain)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase">Média L.</p>
                  <p className="text-sm font-bold text-rose-500">{formatCurrency(-s.avgLoss)}</p>
                </div>
              </div>
              <div className="flex h-1.5 rounded-full overflow-hidden mt-3 bg-zinc-100 dark:bg-zinc-700">
                <div className="bg-emerald-500 rounded-l-full" style={{ width: `${s.winRate}%` }} />
                <div className="bg-rose-500 rounded-r-full" style={{ width: `${100 - s.winRate}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
