"use client";

import { createTradeWithDiary } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SETUP_TAGS, GENERIC_SETUPS } from "@/lib/methodology-plugins";
import { cn } from "@/lib/utils";
import { ScanLine, Loader2, CheckCircle2, AlertTriangle, X, ImagePlus } from "lucide-react";

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

export default function NewTradePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [methodology, setMethodology] = useState("oliver-velez");
  const [selectedSetup, setSelectedSetup] = useState("");
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);

  // OCR
  const [ocrStatus, setOcrStatus] = useState<"idle" | "scanning" | "done" | "error">("idle");
  const [ocrConfidence, setOcrConfidence] = useState<"high" | "medium" | "low" | null>(null);
  const [ocrError, setOcrError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Screenshot do gráfico
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [screenshotUploading, setScreenshotUploading] = useState(false);
  const screenshotRef = useRef<HTMLInputElement>(null);

  // Controlled fields (needed for OCR pre-fill)
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [direction, setDirection] = useState("COMPRA");
  const [asset, setAsset] = useState("WIN");
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [contracts, setContracts] = useState("1");
  const [durationMinutes, setDurationMinutes] = useState("");

  useEffect(() => {
    fetch("/api/profile/check")
      .then((r) => r.json())
      .then((d) => { if (d.profile?.methodology) setMethodology(d.profile.methodology); })
      .catch(() => {});
  }, []);

  const setupOptions = [...(SETUP_TAGS[methodology] || []), ...GENERIC_SETUPS];

  async function handleOcrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setOcrStatus("scanning");
    setOcrError("");

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/trades/ocr", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok || !data.trade) {
        setOcrError(data.error || "Não foi possível extrair os dados.");
        setOcrStatus("error");
        return;
      }

      const t = data.trade;
      if (t.date) setDate(t.date);
      if (t.time) setTime(t.time);
      if (t.direction) setDirection(t.direction);
      if (t.asset) setAsset(t.asset);
      if (t.entryPrice != null) setEntryPrice(String(t.entryPrice));
      if (t.exitPrice != null) setExitPrice(String(t.exitPrice));
      if (t.contracts != null) setContracts(String(t.contracts));
      if (t.durationMinutes != null) setDurationMinutes(String(t.durationMinutes));

      setOcrConfidence(t.confidence ?? "medium");
      setOcrStatus("done");
    } catch {
      setOcrError("Erro de conexão. Tente novamente.");
      setOcrStatus("error");
    }
  }

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
    } catch {
      setScreenshotPreview("");
    }
    setScreenshotUploading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await createTradeWithDiary(formData);
      router.push("/trades");
    } catch (err: any) {
      setError(err.message || "Erro ao salvar");
      setLoading(false);
    }
  }

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
                Escanear relatório com IA — importe do Profit, Tryd ou MT5
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
                  {ocrConfidence === "low"
                    ? <AlertTriangle className="h-4 w-4 shrink-0" />
                    : <CheckCircle2 className="h-4 w-4 shrink-0" />
                  }
                  <span>
                    {ocrConfidence === "low"
                      ? "Dados extraídos — confira antes de salvar"
                      : "Dados extraídos com sucesso — confira e registre"
                    }
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { setOcrStatus("idle"); setOcrConfidence(null); }}
                  className="opacity-60 hover:opacity-100 transition-opacity ml-2"
                  title="Limpar OCR"
                >
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
                <button
                  type="button"
                  onClick={() => setOcrStatus("idle")}
                  className="opacity-60 hover:opacity-100 transition-opacity ml-2"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleOcrUpload}
              className="sr-only"
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Hidden fields */}
            <input type="hidden" name="asset" value={asset} />

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Data</label>
                <Input
                  type="date"
                  name="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Horário</label>
                <Input
                  type="time"
                  name="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            {/* Direction */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Direção</label>
              <div className="grid grid-cols-2 gap-3">
                <label className="relative flex cursor-pointer">
                  <input
                    type="radio"
                    name="direction"
                    value="COMPRA"
                    checked={direction === "COMPRA"}
                    onChange={() => setDirection("COMPRA")}
                    className="peer sr-only"
                  />
                  <div className="flex w-full items-center justify-center rounded-lg border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-3 text-sm font-medium text-zinc-600 dark:text-zinc-400 transition-all peer-checked:border-emerald-500 peer-checked:bg-emerald-50 dark:peer-checked:bg-emerald-950 peer-checked:text-emerald-700 dark:peer-checked:text-emerald-400">
                    COMPRA
                  </div>
                </label>
                <label className="relative flex cursor-pointer">
                  <input
                    type="radio"
                    name="direction"
                    value="VENDA"
                    checked={direction === "VENDA"}
                    onChange={() => setDirection("VENDA")}
                    className="peer sr-only"
                  />
                  <div className="flex w-full items-center justify-center rounded-lg border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-3 text-sm font-medium text-zinc-600 dark:text-zinc-400 transition-all peer-checked:border-rose-500 peer-checked:bg-rose-50 dark:peer-checked:bg-rose-950 peer-checked:text-rose-700 dark:peer-checked:text-rose-400">
                    VENDA
                  </div>
                </label>
              </div>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Entrada</label>
                <Input
                  type="number"
                  name="entryPrice"
                  placeholder="Ex: 128500"
                  step="any"
                  required
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Saída</label>
                <Input
                  type="number"
                  name="exitPrice"
                  placeholder="Ex: 128650"
                  step="any"
                  required
                  value={exitPrice}
                  onChange={(e) => setExitPrice(e.target.value)}
                />
              </div>
            </div>

            {/* Contracts and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Contratos</label>
                <Input
                  type="number"
                  name="contracts"
                  min="1"
                  required
                  value={contracts}
                  onChange={(e) => setContracts(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Duração (min)</label>
                <Input
                  type="number"
                  name="durationMinutes"
                  placeholder="Opcional"
                  min="0"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                />
              </div>
            </div>

            {/* Setup Tag */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Setup</label>
              <input type="hidden" name="setup" value={selectedSetup} />
              <div className="flex flex-wrap gap-1.5">
                {setupOptions.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSelectedSetup(selectedSetup === s.value ? "" : s.value)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium border transition-all cursor-pointer",
                      selectedSetup === s.value
                        ? "bg-violet-500 text-white border-violet-500"
                        : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-violet-300 dark:hover:border-violet-700"
                    )}
                  >
                    {s.value}
                  </button>
                ))}
              </div>
            </div>

            {/* Diário */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-4">
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Registre a Operação <span className="normal-case font-normal">(opcional)</span>
              </p>

              {/* Emoções */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Como você se sentiu?</label>
                <input type="hidden" name="emotions" value={JSON.stringify(selectedEmotions)} />
                <div className="flex flex-wrap gap-1.5">
                  {EMOTIONS.map((e) => {
                    const selected = selectedEmotions.includes(e.value);
                    const isNegative = ["ANSIEDADE", "FURIA", "FRUSTRACAO", "MEDO", "INSEGURANCA"].includes(e.value);
                    return (
                      <button
                        key={e.value}
                        type="button"
                        onClick={() =>
                          setSelectedEmotions(
                            selected ? selectedEmotions.filter((v) => v !== e.value) : [...selectedEmotions, e.value]
                          )
                        }
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-medium border transition-all cursor-pointer",
                          selected
                            ? isNegative
                              ? "bg-rose-500 text-white border-rose-500"
                              : "bg-emerald-500 text-white border-emerald-500"
                            : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500"
                        )}
                      >
                        {e.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* O que fiz certo */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">O que eu fiz certo?</label>
                <Textarea name="whatWentRight" placeholder="Ex: Respeitei o setup, aguardei a confirmação..." rows={2} className="text-sm" />
              </div>

              {/* Onde posso melhorar */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Onde posso melhorar?</label>
                <Textarea name="whereToImprove" placeholder="Ex: Entrei cedo demais, não esperei o fechamento da barra..." rows={2} className="text-sm" />
              </div>
            </div>

            {/* Screenshot do gráfico */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Print do gráfico</label>
              <input type="hidden" name="screenshotUrl" value={screenshotUrl} />
              <input
                ref={screenshotRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadScreenshot(f); e.target.value = ""; }}
              />

              {screenshotPreview ? (
                <div className="relative group w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={screenshotPreview} alt="Print do gráfico" className="w-full max-h-64 object-contain bg-zinc-50 dark:bg-zinc-900" />
                  {screenshotUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => { setScreenshotPreview(""); setScreenshotUrl(""); }}
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => screenshotRef.current?.click()}
                  onPaste={(e) => { const f = e.clipboardData.files[0]; if (f?.type.startsWith("image/")) { e.preventDefault(); uploadScreenshot(f); } }}
                  className="w-full flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 py-6 text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-500 transition-all cursor-pointer focus:outline-none focus:border-violet-400"
                >
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-xs">Clique para selecionar ou cole com Ctrl+V</span>
                </button>
              )}
            </div>

            {error && (
              <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-950 rounded-lg px-3 py-2">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Salvando..." : "Registrar"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
