export const dynamic = "force-dynamic";

import { getAllTrades } from "@/lib/actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, History } from "lucide-react";
import Link from "next/link";
import { DeleteTradeButton } from "@/components/trades/DeleteTradeButton";

export default async function TradesPage() {
  const trades = await getAllTrades();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="h-5 w-5 text-zinc-400" />
          <span className="text-sm text-zinc-500">{trades.length} operações registradas</span>
        </div>
        <Link href="/trades/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Nova Operação</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {trades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <History className="h-12 w-12 text-zinc-200 dark:text-zinc-600 mb-4" />
              <p className="text-sm text-zinc-500">Nenhuma operação registrada</p>
              <Link href="/trades/new" className="mt-4">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Registrar primeira operação
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Data</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Hora</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Direção</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Entrada</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Saída</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Cts</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Resultado</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Pontos</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Financeiro</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                    {trades.map((trade: any) => (
                      <tr key={trade.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">{formatDate(trade.date)}</td>
                        <td className="px-4 py-3 text-sm text-zinc-500">{trade.time}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                            trade.direction === "COMPRA"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                          }`}>
                            {trade.direction}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 text-right font-mono">
                          {trade.entryPrice.toLocaleString("pt-BR")}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 text-right font-mono">
                          {trade.exitPrice.toLocaleString("pt-BR")}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 text-center">{trade.contracts}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={trade.result === "GAIN" ? "gain" : trade.result === "LOSS" ? "loss" : "zero"}>
                            {trade.result}
                          </Badge>
                        </td>
                        <td className={`px-4 py-3 text-sm text-right font-mono font-medium ${
                          trade.points > 0 ? "text-emerald-600" : trade.points < 0 ? "text-rose-500" : "text-zinc-500"
                        }`}>
                          {trade.points > 0 ? "+" : ""}{trade.points.toFixed(1)}
                        </td>
                        <td className={`px-4 py-3 text-sm text-right font-semibold ${
                          trade.financialResult > 0 ? "text-emerald-600" : trade.financialResult < 0 ? "text-rose-500" : "text-zinc-500"
                        }`}>
                          {formatCurrency(trade.financialResult)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DeleteTradeButton id={trade.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                {trades.map((trade: any) => (
                  <div key={trade.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={trade.result === "GAIN" ? "gain" : trade.result === "LOSS" ? "loss" : "zero"}>
                          {trade.result}
                        </Badge>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                          trade.direction === "COMPRA"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}>
                          {trade.direction}
                        </span>
                      </div>
                      <DeleteTradeButton id={trade.id} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-zinc-400">
                          {formatDate(trade.date)} {trade.time}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {trade.contracts}ct | {trade.entryPrice.toLocaleString("pt-BR")} → {trade.exitPrice.toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${
                          trade.financialResult > 0 ? "text-emerald-600" : trade.financialResult < 0 ? "text-rose-500" : "text-zinc-500"
                        }`}>
                          {formatCurrency(trade.financialResult)}
                        </p>
                        <p className={`text-xs ${
                          trade.points > 0 ? "text-emerald-600" : trade.points < 0 ? "text-rose-500" : "text-zinc-500"
                        }`}>
                          {trade.points > 0 ? "+" : ""}{trade.points.toFixed(1)} pts
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
