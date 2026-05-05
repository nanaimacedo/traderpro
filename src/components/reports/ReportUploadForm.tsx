"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrokerReport } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, FileBarChart } from "lucide-react";

export function ReportUploadForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ filename: string; originalName: string } | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload-report", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      setUploadedFile(data);
    }

    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!uploadedFile) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("filename", uploadedFile.filename);
    formData.set("originalName", uploadedFile.originalName);

    await createBrokerReport(formData);

    setLoading(false);
    setFileName(null);
    setUploadedFile(null);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileBarChart className="h-5 w-5 text-zinc-400" />
          Enviar Relatório da Corretora
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Arquivo PDF</label>
            <label className="cursor-pointer block">
              <input type="file" accept=".pdf" onChange={handleFileChange} className="sr-only" />
              <div className="flex items-center gap-3 rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-700 p-4 transition-colors hover:border-zinc-400 dark:hover:border-zinc-500">
                <Upload className="h-5 w-5 text-zinc-400" />
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {loading ? "Enviando..." : fileName ? fileName : "Clique para selecionar o PDF do relatório"}
                </span>
              </div>
            </label>
          </div>

          {/* Data + Taxas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Data do Relatório</label>
              <Input type="date" name="date" required defaultValue={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Total de Trades</label>
              <Input type="number" name="totalTrades" placeholder="ex: 137" min="0" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Dias Operados</label>
              <Input type="number" name="tradingDays" placeholder="ex: 11" min="0" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Taxas / Emolumentos</label>
              <Input type="number" name="fees" placeholder="R$ 0,00" step="0.01" />
            </div>
          </div>

          {/* Contagens */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Operações</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Quant. Op. Gain</label>
                <Input type="number" name="gains" placeholder="ex: 68" min="0" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-rose-500 uppercase tracking-wide">Quant. Op. Loss</label>
                <Input type="number" name="losses" placeholder="ex: 23" min="0" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Op. Zeradas</label>
                <Input type="number" name="zeros" placeholder="ex: 46" min="0" />
              </div>
            </div>
          </div>

          {/* Extremos diários e por op */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Extremos</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Maior Gain Diário</label>
                <Input type="number" name="maxDailyGain" placeholder="ex: 304.00" step="0.01" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-rose-500 uppercase tracking-wide">Maior Loss Diário</label>
                <Input type="number" name="maxDailyLoss" placeholder="ex: -552.00" step="0.01" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Maior Gain por Op.</label>
                <Input type="number" name="maxGainPerOp" placeholder="ex: 266.00" step="0.01" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-rose-500 uppercase tracking-wide">Maior Loss por Op.</label>
                <Input type="number" name="maxLossPerOp" placeholder="ex: -466.00" step="0.01" />
              </div>
            </div>
          </div>

          {/* Tempos */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Tempo por Operação <span className="normal-case font-normal">(opcional)</span></p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Maior Tempo (min)</label>
                <Input type="number" name="maxDurationMinutes" placeholder="ex: 202" min="0" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Resultado (maior)</label>
                <Input type="number" name="maxDurationResult" placeholder="ex: 76.00" step="0.01" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Menor Tempo (min)</label>
                <Input type="number" name="minDurationMinutes" placeholder="ex: 1" min="0" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Resultado (menor)</label>
                <Input type="number" name="minDurationResult" placeholder="ex: 2.00" step="0.01" />
              </div>
            </div>
          </div>

          {/* Financeiro */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Resultado Financeiro</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Valor Total Gain</label>
                <Input type="number" name="totalGain" placeholder="ex: 4657.00" step="0.01" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-rose-500 uppercase tracking-wide">Valor Total Loss</label>
                <Input type="number" name="totalLoss" placeholder="ex: -3718.00" step="0.01" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">Resultado Final</label>
                <Input type="number" name="netResult" placeholder="ex: 939.00" step="0.01" />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={loading || !uploadedFile}>
            {loading ? "Salvando..." : "Salvar Relatório"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
