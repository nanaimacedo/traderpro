"use client";

import { createTradeWithDiary } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SETUP_TAGS, GENERIC_SETUPS } from "@/lib/methodology-plugins";
import { cn } from "@/lib/utils";
import { ScanLine, Loader2, CheckCircle2, AlertTriangle, X, ImagePlus, ChevronLeft, ChevronRight } from "lucide-react";
import { ASSET_CONFIG } from "@/lib/asset-config";
import { RelatoEditor } from "@/components/trades/RelatoEditor";

const EMOTIONS = [
  { value: "ANSIEDADE", label: "Ansiedade" },
  { value: "FURIA", label: "Fúria" },
  { value: "FRUSTRACAO", label: "Frustração" },
  { value: "MEDO", label: "Medo" },
  { value: "EUFORIA", label: "Euforia" },
  { value: "INSEGURANCA", label: "Insegurança" },
  { value: "SEGURANCA", label: "Segurança" },
  { value: "CONFIANCA", label: "Confiança" },
  { value: "ALEGRIA", label: "Alegria" },
  { value: "TRANQUILIDADE", label: "Tranquilidade" },
];

interface OcrTrade {
  date: string; time: string; asset: string; direction: string;
  entryPrice: string; exitPrice: string; contracts: string; durationMinutes: string;
  financialResult: string; confidence: string;
}

interface Subjective {
  setup: string; emotions: string[]; relato: string;
}

function timeToSecs(t: string): number | null {
  const parts = t.split(":").map(Number);
  if (parts.length < 2 || parts.some(isNaN)) return null;
  const [h, m, s = 0] = parts;
  return h * 3600 + m * 60 + s;
}

function calcDurationSecs(entry: string, exit: string): number | null {
  if (!entry || !exit) return null;
  const a = timeToSecs(entry), b = timeToSecs(exit);
  if (a == null || b == null) return null;
  const diff = b - a;
  return diff > 0 ? diff : null;
}

function formatDuration(secs: number): string {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60), s = secs % 60;
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60), rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

function defaultSubjective(): Subjective {
  return { setup: "", emotions: [], relato: "" };
}

function normalizeOcrTrade(t: any): OcrTrade {
  return {
    date: t.date ?? new Date().toISOString().split("T")[0],
    time: t.time ?? "",
    asset: t.asset ?? "WIN",
    direction: t.direction ?? "COMPRA",
    entryPrice: t.entryPrice != null ? String(t.entryPrice) : "",
    exitPrice: t.exitPrice != null ? String(t.exitPrice) : "",
    contracts: t.contracts != null ? String(t.contracts) : "1",
    durationMinutes: t.durationMinutes != null ? String(t.durationMinutes) : "",
    financialResult: t.financialResult != null ? String(t.financialResult) : "",
    confidence: t.confidence ?? "medium",
  };
}

export default function NewTradePage() {
  const router = useRouter();
  const [methodology, setMethodology] = useState("oliver-velez");

  // ── OCR ──────────────────────────────────────────────────────────────
  const [ocrStatus, setOcrStatus] = useState<"idle" | "scanning" | "done" | "error">("idle");
  const [ocrError, setOcrError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Batch stepper ────────────────────────────────────────────────────
  const [batchMode, setBatchMode] = useState(false);
  const [batchTrades, setBatchTrades] = useState<OcrTrade[]>([]);
  const [batchSubjective, setBatchSubjective] = useState<Subjective[]>([]);
  const [batchIndex, setBatchIndex] = useState(0);
  const [batchSaving, setBatchSaving] = useState(false);
  const [batchError, setBatchError] = useState("");

  // ── Single form ──────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedSetup, setSelectedSetup] = useState("");
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 8));
  const [exitTime, setExitTime] = useState("");
  const [financialResultOverride, setFinancialResultOverride] = useState("");
  const [relato, setRelato] = useState("");
  const [direction, setDirection] = useState("COMPRA");
  const [asset, setAsset] = useState("WIN");
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [contracts, setContracts] = useState("1");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [ocrConfidence, setOcrConfidence] = useState<string | null>(null);

  // ── Screenshot ───────────────────────────────────────────────────────
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [screenshotUploading, setScreenshotUploading] = useState(false);
  const screenshotRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/profile/check")
      .then((r) => r.json())
      .then((d) => { if (d.profile?.methodology) setMethodology(d.profile.methodology); })
      .catch(() => {});
  }, []);

  const setupOptions = [...(SETUP_TAGS[methodology] || []), ...GENERIC_SETUPS];

  // ── OCR upload ───────────────────────────────────────────────────────
  async function handleOcrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setOcrStatus("scanning");
    setOcrError("");

    const fd = new FormData();
    fd.append("image", file);

    try {
      const res = await fetch("/api/trades/ocr", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok || !data.trades?.length) {
        setOcrError(data.error || "Não foi possível extrair os dados.");
        setOcrStatus("error");
        return;
      }

      const trades: OcrTrade[] = data.trades.map(normalizeOcrTrade);

      if (trades.length > 1) {
        // Multi-trade → stepper
        setBatchTrades(trades);
        setBatchSubjective(trades.map(defaultSubjective));
        setBatchIndex(0);
        setBatchMode(true);
        setOcrStatus("idle");
      } else {
        // Single trade → pre-fill form
        const t = trades[0];
        if (t.date) setDate(t.date);
        if (t.time) setTime(t.time);
        if (t.direction) setDirection(t.direction);
        if (t.asset) setAsset(t.asset);
        if (t.entryPrice) setEntryPrice(t.entryPrice);
        if (t.exitPrice) setExitPrice(t.exitPrice);
        if (t.contracts) setContracts(t.contracts);
        if (t.durationMinutes) setDurationMinutes(t.durationMinutes);
        if (t.financialResult) setFinancialResultOverride(t.financialResult);
        setOcrConfidence(t.confidence);
        setOcrStatus("done");
      }
    } catch {
      setOcrError("Erro de conexão. Tente novamente.");
      setOcrStatus("error");
    }
  }

  // ── Screenshot upload ────────────────────────────────────────────────
  async function uploadScreenshot(file: File) {
    setScreenshotUploading(true);
    setScreenshotPreview(URL.createObjectURL(file));
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload-trade-screenshot", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) setScreenshotUrl(data.url);
      else setScreenshotPreview("");
    } catch { setScreenshotPreview(""); }
    setScreenshotUploading(false);
  }

  // ── Single form submit ───────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      // Auto-fill durationMinutes if calculated from entry/exit time and not manually set
      if (!durationMinutes) {
        const calcSecs = calcDurationSecs(time, exitTime);
        if (calcSecs != null) {
          formData.set("durationMinutes", String(Math.max(1, Math.round(calcSecs / 60))));
        }
      }
      await createTradeWithDiary(formData);
      router.push("/trades");
    } catch (err: any) {
      setError(err.message || "Erro ao salvar");
      setLoading(false);
    }
  }

  // ── Batch stepper helpers ─────────────────────────────────────────────
  function updateBatchTrade(field: keyof OcrTrade, value: string) {
    setBatchTrades((prev) => prev.map((t, i) => i === batchIndex ? { ...t, [field]: value } : t));
  }

  function updateSubjective(field: keyof Subjective, value: any) {
    setBatchSubjective((prev) => prev.map((s, i) => i === batchIndex ? { ...s, [field]: value } : s));
  }

  async function saveBatchAll() {
    setBatchSaving(true);
    setBatchError("");
    let saved = 0;
    for (let i = 0; i < batchTrades.length; i++) {
      try {
        const t = batchTrades[i];
        const s = batchSubjective[i];
        const fd = new FormData();
        fd.set("date", t.date); fd.set("time", t.time);
        fd.set("asset", t.asset); fd.set("direction", t.direction);
        fd.set("entryPrice", t.entryPrice); fd.set("exitPrice", t.exitPrice);
        fd.set("contracts", t.contracts);
        if (t.durationMinutes) fd.set("durationMinutes", t.durationMinutes);
        fd.set("setup", s.setup);
        fd.set("emotions", JSON.stringify(s.emotions));
        fd.set("notes", s.relato);
        await createTradeWithDiary(fd);
        saved++;
      } catch (err: any) {
        setBatchError(`Operação ${i + 1}: ${err.message || "Erro ao salvar"}`);
        setBatchSaving(false);
        return;
      }
    }
    router.push("/trades");
  }

  const cur = batchTrades[batchIndex];
  const curS = batchSubjective[batchIndex];

  // ═══════════════════════════════════════════════════════════════════
  // BATCH STEPPER UI
  // ═══════════════════════════════════════════════════════════════════
  if (batchMode && cur) {
    return (
      <div className="max-w-2xl mx-auto px-0">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Operação {batchIndex + 1} de {batchTrades.length}
              </CardTitle>
              <button
                onClick={() => { setBatchMode(false); setOcrStatus("idle"); }}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                Cancelar
              </button>
            </div>
            {/* Progress bar */}
            <div className="flex gap-1 mt-2">
              {batchTrades.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setBatchIndex(i)}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-all",
                    i < batchIndex ? "bg-emerald-500" : i === batchIndex ? "bg-violet-500" : "bg-zinc-200 dark:bg-zinc-700"
                  )}
                />
              ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Confidence warning */}
            {cur.confidence === "low" && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Confiança baixa — confira os dados antes de continuar
              </div>
            )}

            {/* Objective fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Data</label>
                <Input type="date" value={cur.date} onChange={(e) => updateBatchTrade("date", e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Horário</label>
                <Input type="time" value={cur.time} onChange={(e) => updateBatchTrade("time", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Direção</label>
              <div className="grid grid-cols-2 gap-3">
                {["COMPRA", "VENDA"].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => updateBatchTrade("direction", d)}
                    className={cn(
                      "flex items-center justify-center rounded-lg border-2 py-2.5 text-sm font-medium transition-all",
                      cur.direction === d
                        ? d === "COMPRA"
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
                          : "border-rose-500 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-500"
                    )}
                  >{d}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Entrada</label>
                <Input type="number" step="any" value={cur.entryPrice} onChange={(e) => updateBatchTrade("entryPrice", e.target.value)} placeholder="Ex: 128500" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Saída</label>
                <Input type="number" step="any" value={cur.exitPrice} onChange={(e) => updateBatchTrade("exitPrice", e.target.value)} placeholder="Ex: 128650" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Contratos</label>
                <Input type="number" min="1" value={cur.contracts} onChange={(e) => updateBatchTrade("contracts", e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Duração (min)</label>
                <Input type="number" min="0" value={cur.durationMinutes} onChange={(e) => updateBatchTrade("durationMinutes", e.target.value)} placeholder="Opcional" />
              </div>
            </div>

            {/* Subjective layer */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-4">
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Contexto desta operação
              </p>

              {/* Setup */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Setup</label>
                <div className="flex flex-wrap gap-1.5">
                  {setupOptions.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => updateSubjective("setup", curS.setup === s.value ? "" : s.value)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium border transition-all cursor-pointer",
                        curS.setup === s.value
                          ? "bg-violet-500 text-white border-violet-500"
                          : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-violet-300 dark:hover:border-violet-700"
                      )}
                    >{s.value}</button>
                  ))}
                </div>
              </div>

              {/* Emoções */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Como você se sentiu?</label>
                <div className="flex flex-wrap gap-1.5">
                  {EMOTIONS.map((e) => {
                    const selected = curS.emotions.includes(e.value);
                    const isNeg = ["ANSIEDADE", "FURIA", "FRUSTRACAO", "MEDO", "INSEGURANCA"].includes(e.value);
                    return (
                      <button
                        key={e.value}
                        type="button"
                        onClick={() =>
                          updateSubjective("emotions",
                            selected ? curS.emotions.filter((v) => v !== e.value) : [...curS.emotions, e.value]
                          )
                        }
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-medium border transition-all cursor-pointer",
                          selected
                            ? isNeg ? "bg-rose-500 text-white border-rose-500" : "bg-emerald-500 text-white border-emerald-500"
                            : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                        )}
                      >{e.label}</button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Relato da operação</label>
                <RelatoEditor value={curS.relato} onChange={(v) => updateSubjective("relato", v)} placeholder="Descreva o que aconteceu: contexto, execução, o que funcionou, o que pode melhorar... Cole prints com Ctrl+V" rows={4} />
              </div>
            </div>

            {batchError && (
              <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-950 rounded-lg px-3 py-2">{batchError}</p>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBatchIndex((i) => i - 1)}
                disabled={batchIndex === 0}
                className="w-10 px-0 shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {batchIndex < batchTrades.length - 1 ? (
                <Button type="button" className="flex-1" onClick={() => setBatchIndex((i) => i + 1)}>
                  Próxima <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button type="button" className="flex-1" onClick={saveBatchAll} disabled={batchSaving}>
                  {batchSaving ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Salvando...</> : `Registrar ${batchTrades.length} operações`}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // SINGLE TRADE FORM
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-2xl mx-auto px-0">
      <Card>
        <CardHeader>
          <CardTitle>Registrar Operação</CardTitle>
        </CardHeader>
        <CardContent>
          {/* OCR Banner */}
          <div className="mb-5">
            {ocrStatus === "idle" && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/30 py-3 px-4 text-sm font-medium text-violet-600 dark:text-violet-400 hover:border-violet-400 dark:hover:border-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/50 transition-all cursor-pointer"
              >
                <ScanLine className="h-4 w-4" />
                Escanear relatório com IA — Profit, Tryd, MT5
              </button>
            )}
            {ocrStatus === "scanning" && (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 py-3 px-4 text-sm text-violet-600 dark:text-violet-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analisando com IA...
              </div>
            )}
            {ocrStatus === "done" && (
              <div className={cn(
                "flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm",
                ocrConfidence === "low"
                  ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                  : "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
              )}>
                <div className="flex items-center gap-2">
                  {ocrConfidence === "low" ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
                  <span>{ocrConfidence === "low" ? "Dados extraídos — confira antes de salvar" : "Dados extraídos — confira e registre"}</span>
                </div>
                <button type="button" onClick={() => { setOcrStatus("idle"); setOcrConfidence(null); }} className="opacity-60 hover:opacity-100 ml-2">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {ocrStatus === "error" && (
              <div className="flex items-center justify-between rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{ocrError || "Não foi possível extrair. Preencha manualmente."}</span>
                </div>
                <button type="button" onClick={() => setOcrStatus("idle")} className="opacity-60 hover:opacity-100 ml-2">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleOcrUpload} className="sr-only" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <input type="hidden" name="asset" value={asset} />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Data</label>
                <Input type="date" name="date" required value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Entrada</label>
                <Input type="time" name="time" step="1" required value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Saída</label>
                <Input type="time" step="1" value={exitTime} onChange={(e) => setExitTime(e.target.value)} placeholder="Opcional" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Duração</label>
                {(() => {
                  const calcSecs = calcDurationSecs(time, exitTime);
                  const autoVal = calcSecs != null ? String(Math.max(1, Math.round(calcSecs / 60))) : "";
                  return (
                    <div className="relative">
                      <Input
                        type="number"
                        name="durationMinutes"
                        min="0"
                        placeholder={calcSecs != null ? formatDuration(calcSecs) : "min"}
                        value={durationMinutes || autoVal}
                        onChange={(e) => setDurationMinutes(e.target.value)}
                        className={calcSecs != null && !durationMinutes ? "text-zinc-400" : ""}
                        readOnly={calcSecs != null && !durationMinutes}
                      />
                      {calcSecs != null && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 pointer-events-none">
                          {formatDuration(calcSecs)}
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Direção</label>
              <div className="grid grid-cols-2 gap-3">
                {["COMPRA", "VENDA"].map((d) => (
                  <label key={d} className="relative flex cursor-pointer">
                    <input type="radio" name="direction" value={d} checked={direction === d} onChange={() => setDirection(d)} className="peer sr-only" />
                    <div className={cn(
                      "flex w-full items-center justify-center rounded-lg border-2 py-3 text-sm font-medium transition-all",
                      "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400",
                      direction === d && d === "COMPRA" && "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400",
                      direction === d && d === "VENDA" && "border-rose-500 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400",
                    )}>{d}</div>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Entrada</label>
                <Input type="number" name="entryPrice" placeholder="Ex: 128500" step="any" required value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Saída</label>
                <Input type="number" name="exitPrice" placeholder="Ex: 128650" step="any" required value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Contratos</label>
              <Input type="number" name="contracts" min="1" required value={contracts} onChange={(e) => setContracts(e.target.value)} />
            </div>

            {/* Resultado financeiro */}
            {(() => {
              const ep = parseFloat(entryPrice); const xp = parseFloat(exitPrice);
              const ct = parseInt(contracts) || 1;
              const pv = (ASSET_CONFIG[asset] || ASSET_CONFIG.WIN).pointValue;
              const pts = direction === "COMPRA" ? xp - ep : ep - xp;
              const calc = !isNaN(pts) && !isNaN(ep) && !isNaN(xp) ? pts * pv * ct : null;
              return (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Resultado (R$)
                    {calc != null && !financialResultOverride && (
                      <span className={cn("ml-2 text-xs font-normal", calc > 0 ? "text-emerald-500" : calc < 0 ? "text-rose-500" : "text-zinc-400")}>
                        calculado: {calc > 0 ? "+" : ""}{calc.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    )}
                  </label>
                  <Input
                    type="number"
                    name="financialResultOverride"
                    step="0.01"
                    placeholder={calc != null ? `${calc >= 0 ? "+" : ""}${calc.toFixed(2)} (automático)` : "Ex: -45.80"}
                    value={financialResultOverride}
                    onChange={(e) => setFinancialResultOverride(e.target.value)}
                  />
                  <p className="text-xs text-zinc-400">Opcional — preencha apenas se o valor da corretora for diferente do calculado</p>
                </div>
              );
            })()}

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Setup</label>
              <input type="hidden" name="setup" value={selectedSetup} />
              <div className="flex flex-wrap gap-1.5">
                {setupOptions.map((s) => (
                  <button key={s.value} type="button" onClick={() => setSelectedSetup(selectedSetup === s.value ? "" : s.value)}
                    className={cn("rounded-full px-2.5 py-1 text-xs font-medium border transition-all cursor-pointer",
                      selectedSetup === s.value ? "bg-violet-500 text-white border-violet-500"
                        : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-violet-300 dark:hover:border-violet-700"
                    )}>{s.value}</button>
                ))}
              </div>
            </div>

            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-4">
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Registre a Operação <span className="normal-case font-normal">(opcional)</span>
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Como você se sentiu?</label>
                <input type="hidden" name="emotions" value={JSON.stringify(selectedEmotions)} />
                <div className="flex flex-wrap gap-1.5">
                  {EMOTIONS.map((e) => {
                    const selected = selectedEmotions.includes(e.value);
                    const isNeg = ["ANSIEDADE", "FURIA", "FRUSTRACAO", "MEDO", "INSEGURANCA"].includes(e.value);
                    return (
                      <button key={e.value} type="button"
                        onClick={() => setSelectedEmotions(selected ? selectedEmotions.filter((v) => v !== e.value) : [...selectedEmotions, e.value])}
                        className={cn("rounded-full px-2.5 py-1 text-xs font-medium border transition-all cursor-pointer",
                          selected ? isNeg ? "bg-rose-500 text-white border-rose-500" : "bg-emerald-500 text-white border-emerald-500"
                            : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500"
                        )}>{e.label}</button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Relato da operação</label>
                <input type="hidden" name="notes" value={relato} />
                <RelatoEditor value={relato} onChange={setRelato} placeholder="Descreva o que aconteceu: contexto, execução, o que funcionou, o que pode melhorar... Cole prints com Ctrl+V" rows={4} />
              </div>
            </div>

            {/* Screenshot */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Print do gráfico</label>
              <input type="hidden" name="screenshotUrl" value={screenshotUrl} />
              <input ref={screenshotRef} type="file" accept="image/*" className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadScreenshot(f); e.target.value = ""; }} />
              {screenshotPreview ? (
                <div className="relative group w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={screenshotPreview} alt="Print do gráfico" className="w-full max-h-64 object-contain bg-zinc-50 dark:bg-zinc-900" />
                  {screenshotUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                  <button type="button" onClick={() => { setScreenshotPreview(""); setScreenshotUrl(""); }}
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => screenshotRef.current?.click()}
                  onPaste={(e) => { const f = e.clipboardData.files[0]; if (f?.type.startsWith("image/")) { e.preventDefault(); uploadScreenshot(f); } }}
                  className="w-full flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 py-6 text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-500 transition-all cursor-pointer focus:outline-none focus:border-violet-400">
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-xs">Clique para selecionar ou cole com Ctrl+V</span>
                </button>
              )}
            </div>

            {error && <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-950 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Salvando..." : "Registrar"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
