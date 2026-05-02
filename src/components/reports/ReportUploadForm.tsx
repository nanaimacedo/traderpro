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
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* File upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Arquivo PDF</label>
            <label className="cursor-pointer block">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="sr-only"
              />
              <div className="flex items-center gap-3 rounded-lg border-2 border-dashed border-zinc-200 p-4 transition-colors hover:border-zinc-400">
                <Upload className="h-5 w-5 text-zinc-400" />
                <span className="text-sm text-zinc-500">
                  {loading
                    ? "Enviando..."
                    : fileName
                    ? fileName
                    : "Clique para selecionar o PDF do relatório"}
                </span>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Data do Relatório</label>
              <Input
                type="date"
                name="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Total de Trades</label>
              <Input type="number" name="totalTrades" placeholder="Opcional" min="0" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Taxas / Emolumentos</label>
              <Input type="number" name="fees" placeholder="R$ 0,00" step="0.01" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Total Ganhos (R$)</label>
              <Input type="number" name="totalGain" placeholder="R$ 0,00" step="0.01" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Total Perdas (R$)</label>
              <Input type="number" name="totalLoss" placeholder="R$ 0,00" step="0.01" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Resultado Líquido (R$)</label>
              <Input type="number" name="netResult" placeholder="R$ 0,00" step="0.01" />
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
