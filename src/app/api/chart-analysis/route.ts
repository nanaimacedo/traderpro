import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const GROQ_KEY = process.env.GROQ_API_KEY || "";

const METHODOLOGY_CONTEXT: Record<string, string> = {
  "oliver-velez": `Metodologia Oliver Velez — Tape Reading e Price Action puro:
- Identifique barras de força (power bars): corpo grande, fechamento perto da máxima/mínima
- Busque padrões de acumulação/distribuição nas zonas de suporte e resistência
- Setup principal: barra de força rompendo nível com volume, entrada no pull-back
- Stop sempre abaixo do candle de entrada ou do swing anterior
- Alvo: próximo nível de resistência significativo, relação R:R mínima de 2:1
- Contexto obrigatório: operação a favor da tendência do timeframe superior`,

  "al-brooks": `Metodologia Al Brooks — Price Action avançado:
- Foque na estrutura de micro tendências: HH/HL para alta, LH/LL para baixa
- Identifique barras de sinal (signal bars) e barras de entrada (entry bars)
- Setup principal: breakout de trading range com follow-through, ou pull-back em tendência forte
- Evite scalps contra tendências muito fortes
- Stop inicial de 1 tick além da barra de sinal
- Alvo medido pela altura do padrão ou nível anterior`,

  "ict": `Metodologia ICT (Inner Circle Trader):
- Identifique Order Blocks (OB): último candle bearish antes de impulso bullish (bullish OB) e vice-versa
- Fair Value Gaps (FVG): gaps entre high de vela N-1 e low de vela N+1
- Busque confluência: OB + FVG + nível de liquidez (equal highs/lows)
- Kill Zones: 9h-10h (NY open equivalente para B3), 11h-12h, 14h-15h (overlap)
- Entry em retest de OB ou FVG com confirmação de vela
- Stop além do OB ou da última estrutura relevante`,

  "tape-reading": `Tape Reading e Fluxo de Ordens:
- Analise a velocidade e agressividade das barras
- Barras com spread pequeno e volume alto = absorção (possível reversão)
- Barras com spread grande e volume alto = força direcional
- Busque climax moves (máxima velocidade) para identificar possíveis reversões
- Entrada em correções de barras de força (2-3 barras contra)
- Stop além do candle de exaustão/climax`,
};

function formatCandles(candles: any[], maxCandles = 100): string {
  const recent = candles.slice(-maxCandles);
  return recent.map((c) => {
    const date = new Date(c.time * 1000).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${date} | O:${c.open?.toFixed(0)} H:${c.high?.toFixed(0)} L:${c.low?.toFixed(0)} C:${c.close?.toFixed(0)} V:${c.volume ?? 0}`;
  }).join("\n");
}

function buildPrompt(asset: string, interval: string, candles: any[], currentPrice: number, methodology: string): string {
  const methodCtx = METHODOLOGY_CONTEXT[methodology] || METHODOLOGY_CONTEXT["oliver-velez"];
  const lastCandle = candles.at(-1);
  const firstCandle = candles[0];
  const highs = candles.map(c => c.high).filter(Boolean);
  const lows = candles.map(c => c.low).filter(Boolean);
  const sessionHigh = Math.max(...highs);
  const sessionLow = Math.min(...lows);

  return `Você é o Mentor de Trading pessoal deste trader — estrategista, coach operacional e psicólogo de performance especializado em day trade na B3. Você não é um robô: é direto, firme, humano e fala português brasileiro.

Sua tarefa agora é ler o gráfico abaixo e devolver uma análise técnica no formato JSON. Os campos de texto (market_structure, trigger, reasoning, alerts) devem ser escritos na sua voz de mentor — clara, objetiva, sem rodeios, como se estivesse falando diretamente com o trader.

## METODOLOGIA ATIVA
${methodCtx}

## CONTEXTO DO MERCADO
Ativo: ${asset} | Timeframe: ${interval}
Preço atual: ${currentPrice}
Máxima do período: ${sessionHigh}
Mínima do período: ${sessionLow}
Variação: ${lastCandle && firstCandle ? ((lastCandle.close - firstCandle.open) / firstCandle.open * 100).toFixed(2) : "N/A"}%

## DADOS OHLCV (últimos ${Math.min(candles.length, 100)} candles — o mais recente é o último)
${formatCandles(candles)}

## REGRAS DE ANÁLISE (violá-las invalida o setup)
1. price_zone_min e price_zone_max DEVEM estar próximos ao preço atual (${currentPrice}) — máximo 1% de distância
2. COMPRA: stop ABAIXO de price_zone_min; target1 e target2 ACIMA de price_zone_max
3. VENDA: stop ACIMA de price_zone_max; target1 e target2 ABAIXO de price_zone_min
4. rr_ratio = distância até target1 / distância até stop — mínimo 1.5
5. Todos os níveis saem dos dados OHLCV reais — sem inventar
6. Sem setup claro → direction: "AGUARDAR"

## TOM DOS CAMPOS DE TEXTO
- market_structure: leitura direta do que o mercado está fazendo agora ("Mercado lateralizando abaixo da MM20, sem força compradora clara.")
- trigger: gatilho objetivo ("Rompimento com fechamento acima de X com volume.")
- reasoning: 3 a 5 frases como mentor falando com o trader — o que vê, o que pensa, o que recomenda. Sem blá-blá-blá.
- alerts: avisos curtos e diretos, máx 3 ("Não antecipe. Espera o candle fechar.")

## RESPOSTA — apenas JSON válido, sem markdown, sem texto extra:

{
  "trend": "alta" | "baixa" | "lateral",
  "strength": "forte" | "moderada" | "fraca",
  "market_structure": "string",
  "key_support": número,
  "key_resistance": número,
  "entry": {
    "direction": "COMPRA" | "VENDA" | "AGUARDAR",
    "price_zone_min": número,
    "price_zone_max": número,
    "trigger": "string"
  },
  "stop": número,
  "target1": número,
  "target2": número,
  "rr_ratio": número,
  "confidence": número (0-100),
  "reasoning": "string",
  "alerts": ["string"]
}`;
}

function parseAnalysis(text: string): any | null {
  try { return JSON.parse(text.trim()); } catch { /* */ }
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

function validateAnalysis(a: any): boolean {
  if (!a || !a.entry) return false;
  const dir = a.entry.direction;
  if (dir === "AGUARDAR") return true;
  const entryMin = a.entry.price_zone_min;
  const entryMax = a.entry.price_zone_max;
  if (!entryMin || !entryMax || !a.stop || !a.target1) return false;
  if (dir === "COMPRA") {
    return a.stop < entryMin && a.target1 > entryMax;
  }
  if (dir === "VENDA") {
    return a.stop > entryMax && a.target1 < entryMin;
  }
  return false;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!GROQ_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY não configurada" }, { status: 500 });
  }

  const { asset, interval, candles, currentPrice, methodology } = await req.json();

  if (!candles?.length) {
    return NextResponse.json({ error: "Sem dados de candles para analisar" }, { status: 400 });
  }

  const prompt = buildPrompt(asset, interval, candles, currentPrice, methodology || "oliver-velez");

  // Usa apenas Groq para não consumir quota Gemini do mentor
  if (GROQ_KEY) {
    try {
      console.log("[chart-analysis] Gemini unavailable, falling back to Groq");
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          max_tokens: 1024,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content ?? "";
        const analysis = parseAnalysis(text);
        if (analysis && validateAnalysis(analysis)) return NextResponse.json({ ok: true, analysis, model: "groq/llama-3.3-70b" });
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("[chart-analysis] Groq error", res.status, JSON.stringify(err));
      }
    } catch (e) {
      console.error("[chart-analysis] Groq exception", e);
    }
  }

  return NextResponse.json({ error: "Não foi possível gerar análise. Tente novamente." }, { status: 500 });
}
