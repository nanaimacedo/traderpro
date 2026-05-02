export const dynamic = "force-dynamic";

import { getBrokerReports } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileBarChart, Upload } from "lucide-react";
import { ReportUploadForm } from "@/components/reports/ReportUploadForm";
import { DeleteReportButton } from "@/components/reports/DeleteReportButton";

export default async function ReportsPage() {
  const reports = await getBrokerReports();

  return (
    <div className="space-y-8">
      {/* Upload form */}
      <ReportUploadForm />

      {/* Reports list */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
          Relatorios Anteriores
        </h3>

        {reports.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileBarChart className="h-12 w-12 text-zinc-200 mb-4" />
              <p className="text-sm text-zinc-500">Nenhum relatorio enviado</p>
              <p className="text-xs text-zinc-400 mt-1">
                Envie os PDFs da sua corretora para manter o historico
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {reports.map((report: any) => (
              <Card key={report.id}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-50">
                        <FileBarChart className="h-5 w-5 text-zinc-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">{report.originalName}</p>
                        <p className="text-xs text-zinc-400">{formatDate(report.date)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {report.totalTrades && (
                        <div className="text-center">
                          <p className="text-xs text-zinc-400">Trades</p>
                          <p className="text-sm font-semibold text-zinc-700">{report.totalTrades}</p>
                        </div>
                      )}
                      {report.totalGain !== null && (
                        <div className="text-center">
                          <p className="text-xs text-zinc-400">Ganhos</p>
                          <p className="text-sm font-semibold text-emerald-600">
                            {formatCurrency(report.totalGain)}
                          </p>
                        </div>
                      )}
                      {report.totalLoss !== null && (
                        <div className="text-center">
                          <p className="text-xs text-zinc-400">Perdas</p>
                          <p className="text-sm font-semibold text-rose-500">
                            {formatCurrency(Math.abs(report.totalLoss))}
                          </p>
                        </div>
                      )}
                      {report.netResult !== null && (
                        <div className="text-center">
                          <p className="text-xs text-zinc-400">Liquido</p>
                          <p className={`text-sm font-bold ${report.netResult >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                            {formatCurrency(report.netResult)}
                          </p>
                        </div>
                      )}
                      {report.fees !== null && (
                        <div className="text-center">
                          <p className="text-xs text-zinc-400">Taxas</p>
                          <p className="text-sm font-semibold text-zinc-500">
                            {formatCurrency(report.fees)}
                          </p>
                        </div>
                      )}

                      <a
                        href={`/reports/${report.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-zinc-500 hover:text-zinc-700 underline"
                      >
                        Ver PDF
                      </a>

                      <DeleteReportButton id={report.id} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
