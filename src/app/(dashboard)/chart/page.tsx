"use client";

import { useState, useCallback, useEffect } from "react";
import { Brain, RefreshCw, TrendingUp, TrendingDown, Minus, AlertTriangle, Target, Shield, Zap, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ASSETS = [
  { value: "WIN", label: "WIN — Mini Índice", tv: "BMFBOVESPA:WINM26" },
  { value: "WDO", label: "WDO — Mini Dólar", tv: "BMFBOVESPA:WDOM26" },
  { value: "PETR4", label: "PETR4", tv: "BMFBOVESPA:PETR4" },
  { value: "VALE3", label: "VALE3", tv: "BMFBOVESPA:VALE3" },
  { value: "ITUB4", label: "ITUB4", tv: "BMFBOVESPA:ITUB4" },
  { value: "BBDC4", label: "BBDC4", tv: "BMFBOVESPA:BBDC4" },
  { value: "IBOV", label: "IBOVESPA", tv: "BMFBOVESPA:IBOV" },
  { value: "BTC", label: "Bitcoin", tv: "BINANCE:BTCUSDT" },
];

const INTERVALS = [
  { value: "1m", label: "1m" },
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "30m", label: "30m" },
  { value: "1h", label: "1h" },
  { value: "1d", label: "1D" },
];

const TV_INTERVAL_MAP: Record<string, string> = {
  "1m": "1",
  "5m": "5",
  "15m": "15",
  "30m": "30",
  "1h": "60",
  "1d": "D",
};

const METHODOLOGIES = [
  { value: "oliver-velez", label: "Oliver Velez" },
  { value: "al-brooks", label: "Al Brooks" },
  { value: "ict", label: "ICT" },
  { value: "tape-reading", label: "Tape Reading" },
];

interface Analysis {
  trend: string;
  strength: string;
  market_structure: string;
  key_support: number;
  key_resistance: number;
  entry: { direction: string; price_zone_min: number; price_zone_max: number; trigger: string };
  stop: number;
  target1: number;
  target2: number;
  rr_ratio: number;
  confidence: number;
  reasoning: string;
  alerts: string[];
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "alta") return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (trend === "baixa") return <TrendingDown className="h-4 w-4 text-rose-500" />;
  return <Minus className="h-4 w-4 text-zinc-400" />;
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 70 ? "bg-emerald-500" : value >= 40 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium tabular-nums">{value}%</span>
    </div>
  );
}

export default function ChartPage() {
  const [asset, setAsset] = useState("WIN");
  const [interval, setInterval] = useState("5m");
  const [methodology, setMethodology] = useState("oliver-velez");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const selectedAsset = ASSETS.find(a => a.value === asset) || ASSETS[0];
  const tvSymbol = selectedAsset.tv;
  const tvInterval = TV_INTERVAL_MAP[interval] || "5";

  const tvSrc = `https://www.tradingview.com/widgetsnippet/symbol-overview/?symbols=${tvSymbol}&interval=${tvInterval}&theme=dark&style=1&locale=br&timezone=America%2FSao_Paulo&hide_side_toolbar=0&allow_symbol_change=0&save_image=1&details=1&hotlist=0&calendar=0`;

  const chartSrc = `https://www.tradingview.com/chart/?symbol=${tvSymbol}&interval=${tvInterval}&theme=dark&style=1&timezone=America%2FSao_Paulo`;

  async function analyze() {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch OHLC data
      const dataRes = await fetch(`/api/chart-data?asset=${asset}&interval=${interval}`);
      const dataJson = await dataRes.json();

      if (!dataRes.ok || dataJson.error) {
        throw new Error(dataJson.error || "Erro ao buscar dados de mercado");
      }

      // 2. Send to Gemini for analysis
      const analysisRes = await fetch("/api/chart-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset,
          interval,
          candles: dataJson.candles,
          currentPrice: dataJson.currentPrice,
          methodology,
        }),
      });

      const analysisJson = await analysisRes.json();
      if (!analysisRes.ok || analysisJson.error) {
        throw new Error(analysisJson.error || "Erro na análise");
      }

      setAnalysis(analysisJson.analysis);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  const directionColor = (dir: string) =>
    dir === "COMPRA" ? "text-emerald-600 dark:text-emerald-400" :
    dir === "VENDA" ? "text-rose-500" : "text-amber-500";

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Asset */}
        <select
          value={asset}
          onChange={e => setAsset(e.target.value)}
          className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
        >
          {ASSETS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>

        {/* Interval */}
        <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          {INTERVALS.map(i => (
            <button
              key={i.value}
              onClick={() => setInterval(i.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                interval === i.value
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 bg-white dark:bg-zinc-900"
              )}
            >{i.label}</button>
          ))}
        </div>

        {/* Methodology */}
        <select
          value={methodology}
          onChange={e => setMethodology(e.target.value)}
          className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
        >
          {METHODOLOGIES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>

        {/* Analyze button */}
        <button
          onClick={analyze}
          disabled={loading}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {loading
            ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Analisando...</>
            : <><Brain className="h-3.5 w-3.5" /> Analisar com IA</>
          }
        </button>

        {lastUpdated && (
          <span className="text-xs text-zinc-400">
            Atualizado {lastUpdated.toLocaleTimeString("pt-BR")}
          </span>
        )}
      </div>

      {/* Main layout */}
      <div className="flex flex-col xl:flex-row gap-4 flex-1 min-h-0">
        {/* TradingView Chart */}
        <div className="flex-1 min-h-[480px] xl:min-h-0 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
          <iframe
            key={`${tvSymbol}-${tvInterval}`}
            src={chartSrc}
            className="w-full h-full min-h-[480px]"
            allowFullScreen
            title={`Gráfico ${asset}`}
          />
        </div>

        {/* Analysis Panel */}
        <div className="xl:w-80 shrink-0 space-y-3">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 p-3 text-sm text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {!analysis && !error && !loading && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6 text-center">
              <Brain className="h-10 w-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Selecione o ativo e timeframe</p>
              <p className="text-xs text-zinc-400 mt-1">Clique em "Analisar com IA" para obter sugestões de entrada e saída</p>
            </div>
          )}

          {loading && (
            <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 p-6 text-center">
              <RefreshCw className="h-8 w-8 text-violet-500 mx-auto mb-3 animate-spin" />
              <p className="text-sm text-violet-600 dark:text-violet-400">Gemini analisando {asset} no {interval}...</p>
            </div>
          )}

          {analysis && !loading && (
            <>
              {/* Trend & Confidence */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendIcon trend={analysis.trend} />
                    <span className={cn(
                      "text-sm font-bold capitalize",
                      analysis.trend === "alta" ? "text-emerald-600 dark:text-emerald-400" :
                      analysis.trend === "baixa" ? "text-rose-500" : "text-zinc-500"
                    )}>{analysis.trend}</span>
                    <span className="text-xs text-zinc-400 font-normal">— {analysis.strength}</span>
                  </div>
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full",
                    analysis.entry.direction === "COMPRA" ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400" :
                    analysis.entry.direction === "VENDA" ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400" :
                    "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400"
                  )}>{analysis.entry.direction}</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{analysis.market_structure}</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Confiança</span>
                  </div>
                  <ConfidenceBar value={analysis.confidence} />
                </div>
              </div>

              {/* Entry / Stop / Targets */}
              {analysis.entry.direction !== "AGUARDAR" && (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Operação Sugerida</p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Zap className="h-3.5 w-3.5 text-violet-500" />
                        Zona de Entrada
                      </div>
                      <span className={cn("text-sm font-bold tabular-nums", directionColor(analysis.entry.direction))}>
                        {analysis.entry.price_zone_min.toLocaleString("pt-BR")} – {analysis.entry.price_zone_max.toLocaleString("pt-BR")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Shield className="h-3.5 w-3.5 text-rose-500" />
                        Stop Loss
                      </div>
                      <span className="text-sm font-bold tabular-nums text-rose-500">
                        {analysis.stop.toLocaleString("pt-BR")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Target className="h-3.5 w-3.5 text-emerald-500" />
                        Alvo 1
                      </div>
                      <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {analysis.target1.toLocaleString("pt-BR")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Target className="h-3.5 w-3.5 text-emerald-400" />
                        Alvo 2
                      </div>
                      <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {analysis.target2.toLocaleString("pt-BR")}
                      </span>
                    </div>

                    <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <span className="text-xs text-zinc-400">R:R Ratio</span>
                      <span className={cn(
                        "text-sm font-bold",
                        analysis.rr_ratio >= 2 ? "text-emerald-600 dark:text-emerald-400" :
                        analysis.rr_ratio >= 1.5 ? "text-amber-500" : "text-rose-500"
                      )}>1:{analysis.rr_ratio}</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-2">
                    <span className="font-medium text-zinc-600 dark:text-zinc-300">Gatilho: </span>
                    {analysis.entry.trigger}
                  </p>
                </div>
              )}

              {/* Key Levels */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-2">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Níveis-Chave</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Resistência</span>
                  <span className="text-sm font-bold tabular-nums text-rose-500">{analysis.key_resistance.toLocaleString("pt-BR")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Suporte</span>
                  <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{analysis.key_support.toLocaleString("pt-BR")}</span>
                </div>
              </div>

              {/* Reasoning */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-2">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart2 className="h-3.5 w-3.5" /> Análise
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{analysis.reasoning}</p>
              </div>

              {/* Alerts */}
              {analysis.alerts?.length > 0 && (
                <div className="space-y-1.5">
                  {analysis.alerts.map((alert, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      {alert}
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[10px] text-zinc-300 dark:text-zinc-600 text-center">
                Análise gerada por IA — não é recomendação de investimento. Sempre use seu próprio julgamento.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
