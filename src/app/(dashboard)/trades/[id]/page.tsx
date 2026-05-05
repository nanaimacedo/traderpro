export const revalidate = 0;

import { getTradeById } from "@/lib/actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Clock, BarChart2, Camera } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteTradeButton } from "@/components/trades/DeleteTradeButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TradeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const trade = await getTradeById(id);
  if (!trade) notFound();

  const emotions: string[] = (() => {
    try { return JSON.parse(trade.emotions || "[]"); } catch { return []; }
  })();

  const ResultIcon = trade.result === "GAIN" ? TrendingUp : trade.result === "LOSS" ? TrendingDown : Minus;
  const resultColor = trade.result === "GAIN" ? "text-emerald-600 dark:text-emerald-400" : trade.result === "LOSS" ? "text-rose-500 dark:text-rose-400" : "text-zinc-500";

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/trades" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Histórico
        </Link>
        <DeleteTradeButton id={trade.id} redirectTo="/trades" />
      </div>

      {/* Result card */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-zinc-500 mb-1">
                {formatDate(trade.date)} · {trade.time} · {trade.asset}
              </p>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  trade.direction === "COMPRA"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                    : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                }`}>{trade.direction}</span>
                <Badge variant={trade.result === "GAIN" ? "gain" : trade.result === "LOSS" ? "loss" : "zero"}>
                  {trade.result}
                </Badge>
                {trade.setup && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
                    {trade.setup}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-2xl font-bold ${resultColor}`}>
                {trade.financialResult > 0 ? "+" : ""}{formatCurrency(trade.financialResult)}
              </p>
              <p className={`text-sm font-medium ${resultColor}`}>
                {trade.points > 0 ? "+" : ""}{trade.points.toFixed(1)} pts
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Numbers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Entrada", value: trade.entryPrice.toLocaleString("pt-BR") },
          { label: "Saída", value: trade.exitPrice.toLocaleString("pt-BR") },
          { label: "Contratos", value: String(trade.contracts) },
          { label: "Duração", value: trade.durationMinutes ? `${trade.durationMinutes}min` : "—" },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-zinc-500 mb-1">{label}</p>
              <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100 font-mono">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Screenshot */}
      {trade.screenshotUrl && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Camera className="h-4 w-4 text-zinc-400" />
              Print do gráfico
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={trade.screenshotUrl}
              alt="Print do gráfico"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 object-contain max-h-96 bg-zinc-50 dark:bg-zinc-900"
            />
          </CardContent>
        </Card>
      )}

      {/* Emotions */}
      {emotions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Como eu me senti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {emotions.map((e) => {
                const isNeg = ["ANSIEDADE", "FURIA", "FRUSTRACAO", "MEDO", "INSEGURANCA"].includes(e);
                return (
                  <span key={e} className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    isNeg
                      ? "bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                      : "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                  }`}>{e.charAt(0) + e.slice(1).toLowerCase()}</span>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diary fields */}
      {(trade.notes || trade.whatWentRight || trade.whereToImprove) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-zinc-400" />
              Relato da operação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {trade.notes && (
              <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-img:rounded-lg prose-img:border prose-img:border-zinc-200 dark:prose-img:border-zinc-700 prose-img:w-full prose-img:max-h-96 prose-img:object-contain">
                <ReactMarkdown>{trade.notes}</ReactMarkdown>
              </div>
            )}
            {trade.whatWentRight && (
              <div>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">O que fiz certo</p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{trade.whatWentRight}</p>
              </div>
            )}
            {trade.whereToImprove && (
              <div>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">Onde melhorar</p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{trade.whereToImprove}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
