export const dynamic = "force-dynamic";

import { getAllTrades } from "@/lib/actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
          <span className="text-sm text-zinc-500">{trades.length} operacoes registradas</span>
        </div>
        <Link href="/trades/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Nova Operacao
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {trades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <History className="h-12 w-12 text-zinc-200 mb-4" />
              <p className="text-sm text-zinc-500">Nenhuma operacao registrada</p>
              <Link href="/trades/new" className="mt-4">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Registrar primeira operacao
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Hora</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Direcao</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Entrada</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Saida</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">Cts</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">Resultado</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Pontos</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Financeiro</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {trades.map((trade: any) => (
                    <tr key={trade.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-zinc-700">{formatDate(trade.date)}</td>
                      <td className="px-4 py-3 text-sm text-zinc-500">{trade.time}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                          trade.direction === "COMPRA"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}>
                          {trade.direction}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-700 text-right font-mono">
                        {trade.entryPrice.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-700 text-right font-mono">
                        {trade.exitPrice.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-700 text-center">{trade.contracts}</td>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
