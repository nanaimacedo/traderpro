"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Check, AlertTriangle, Loader2, ArrowLeft } from "lucide-react";
import { parseCSV, type ParsedTrade } from "@/lib/csv-parsers";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function ImportTradesPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [trades, setTrades] = useState<ParsedTrade[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [platform, setPlatform] = useState("");
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [fileName, setFileName] = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const result = parseCSV(reader.result as string);
      setTrades(result.trades);
      setErrors(result.errors);
      setPlatform(result.platform);
      setStep("preview");
    };
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  }

  async function handleImport() {
    setImporting(true);
    try {
      const source = `csv-${platform.toLowerCase().replace(/[^a-z]/g, "")}`;
      const res = await fetch("/api/trades/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trades, source }),
      });
      const data = await res.json();
      if (res.ok) {
        setImportedCount(data.imported);
        setStep("done");
      } else {
        setErrors((prev) => [...prev, data.error || "Erro ao importar"]);
      }
    } catch {
      setErrors((prev) => [...prev, "Erro de conexão"]);
    }
    setImporting(false);
  }

  function formatCurrency(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/trades"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Importar Trades</h1>
          <p className="text-xs text-zinc-500">CSV do Profit, Tryd ou MetaTrader</p>
        </div>
      </div>

      {step === "upload" && (
        <Card>
          <CardContent className="pt-6">
            <div
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl py-16 px-6 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-all"
            >
              <Upload className="h-10 w-10 text-zinc-300 dark:text-zinc-600 mb-4" />
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Arraste ou clique para selecionar
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Aceita CSV do Profit (Nelogica), Tryd e MetaTrader
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFile}
              className="sr-only"
            />

            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { name: "Profit", desc: "Nelogica" },
                { name: "Tryd", desc: "Cedro" },
                { name: "MetaTrader", desc: "MT4/MT5" },
              ].map((p) => (
                <div key={p.name} className="flex items-center gap-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 px-3 py-2.5">
                  <FileSpreadsheet className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{p.name}</p>
                    <p className="text-[10px] text-zinc-400">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {step === "preview" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-violet-500" />
                  Preview — {platform}
                </span>
                <span className="text-sm font-normal text-zinc-500">{fileName}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {errors.length > 0 && (
                <div className="mb-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-medium mb-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {errors.length} aviso(s)
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-500 space-y-0.5 max-h-24 overflow-y-auto">
                    {errors.slice(0, 5).map((e, i) => <p key={i}>{e}</p>)}
                    {errors.length > 5 && <p>...e mais {errors.length - 5}</p>}
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-zinc-100 dark:border-zinc-700 overflow-hidden">
                <div className="grid grid-cols-6 gap-0 bg-zinc-50 dark:bg-zinc-800 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  <div className="px-3 py-2">Data</div>
                  <div className="px-3 py-2">Hora</div>
                  <div className="px-3 py-2">Dir</div>
                  <div className="px-3 py-2">Entrada</div>
                  <div className="px-3 py-2">Saída</div>
                  <div className="px-3 py-2">Ctrs</div>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                  {trades.slice(0, 50).map((t, i) => {
                    const points = t.direction === "COMPRA" ? t.exitPrice - t.entryPrice : t.entryPrice - t.exitPrice;
                    const isGain = points > 0;
                    return (
                      <div key={i} className="grid grid-cols-6 gap-0 text-xs">
                        <div className="px-3 py-2 text-zinc-700 dark:text-zinc-300">{t.date}</div>
                        <div className="px-3 py-2 text-zinc-500">{t.time}</div>
                        <div className={cn("px-3 py-2 font-medium", t.direction === "COMPRA" ? "text-emerald-600" : "text-rose-500")}>
                          {t.direction === "COMPRA" ? "C" : "V"}
                        </div>
                        <div className="px-3 py-2 text-zinc-700 dark:text-zinc-300">{t.entryPrice.toLocaleString()}</div>
                        <div className="px-3 py-2 text-zinc-700 dark:text-zinc-300">{t.exitPrice.toLocaleString()}</div>
                        <div className={cn("px-3 py-2 font-medium", isGain ? "text-emerald-600" : points < 0 ? "text-rose-500" : "text-zinc-400")}>
                          {t.contracts}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {trades.length > 50 && (
                  <div className="px-3 py-2 text-center text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800">
                    ...e mais {trades.length - 50} trades
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="text-sm">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{trades.length}</span>
                  <span className="text-zinc-500 ml-1">trades prontos para importar</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setStep("upload"); setTrades([]); setErrors([]); }}>
                    Voltar
                  </Button>
                  <Button variant="success" onClick={handleImport} disabled={importing || trades.length === 0}>
                    {importing ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Importando...</>
                    ) : (
                      <><Upload className="h-4 w-4 mr-1" /> Importar {trades.length} trades</>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {step === "done" && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900 mb-4">
                <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {importedCount} trades importados!
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                Todos os trades do {platform} foram registrados com sucesso.
              </p>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => { setStep("upload"); setTrades([]); setErrors([]); }}>
                  Importar mais
                </Button>
                <Button onClick={() => router.push("/trades")}>
                  Ver trades
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
