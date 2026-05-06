import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const GEMINI_KEYS = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "").split(",").filter(Boolean);
const GROQ_KEY = process.env.GROQ_API_KEY || "";
const MODELS = ["gemini-2.0-flash", "gemini-2.5-flash-preview-04-17", "gemini-1.5-flash"];

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

  return `Você é um analista técnico especialista. Analise o mercado e sugira operações com base nos dados abaixo.

## METODOLOGIA ATIVA
${methodCtx}

## ATIVO: ${asset} | TIMEFRAME: ${interval}
Preço atual: ${currentPrice}
Abertura da sessão: ${firstCandle?.open ?? "N/A"}
Máxima da sessão: ${sessionHigh}
Mínima da sessão: ${sessionLow}
Variação: ${lastCandle && firstCandle ? ((lastCandle.close - firstCandle.open) / firstCandle.open * 100).toFixed(2) : "N/A"}%

## DADOS OHLCV (últimos ${Math.min(candles.length, 100)} candles)
${formatCandles(candles)}

## TAREFA
Com base na metodologia acima e nos dados OHLCV fornecidos, execute uma análise técnica completa e retorne APENAS um JSON válido (sem markdown, sem texto extra):

{
  "trend": "alta" | "baixa" | "lateral",
  "strength": "forte" | "moderada" | "fraca",
  "market_structure": "descrição da estrutura de mercado atual em 1-2 frases",
  "key_support": número (suporte mais relevante),
  "key_resistance": número (resistência mais relevante),
  "entry": {
    "direction": "COMPRA" | "VENDA" | "AGUARDAR",
    "price_zone_min": número,
    "price_zone_max": número,
    "trigger": "descrição do gatilho de entrada em 1 frase"
  },
  "stop": número,
  "target1": número,
  "target2": número,
  "rr_ratio": número (relação risco/retorno arredondada para 1 casa decimal),
  "confidence": número (0 a 100),
  "reasoning": "análise detalhada em 3-5 frases explicando a leitura do mercado",
  "alerts": ["alerta 1", "alerta 2"] (máx 3 alertas importantes)
}`;
}

async function parseAnalysis(text: string): Promise<any | null> {
  try { return JSON.parse(text.trim()); } catch { /* */ }
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!GEMINI_KEYS.length && !GROQ_KEY) {
    return NextResponse.json({ error: "Nenhuma API key configurada (GEMINI_API_KEYS ou GROQ_API_KEY)" }, { status: 500 });
  }

  const { asset, interval, candles, currentPrice, methodology } = await req.json();

  if (!candles?.length) {
    return NextResponse.json({ error: "Sem dados de candles para analisar" }, { status: 400 });
  }

  const prompt = buildPrompt(asset, interval, candles, currentPrice, methodology || "oliver-velez");

  // Try Gemini keys first
  for (const model of MODELS) {
    for (const key of GEMINI_KEYS) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
            }),
          }
        );

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          console.error(`[chart-analysis] Gemini ${model} status=${res.status}`, JSON.stringify(errBody));
          continue;
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        if (!text) continue;

        const analysis = await parseAnalysis(text);
        if (!analysis) continue;
        return NextResponse.json({ ok: true, analysis, model });
      } catch {
        continue;
      }
    }
  }

  // Fallback: Groq (llama-3.3-70b)
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
        const analysis = await parseAnalysis(text);
        if (analysis) return NextResponse.json({ ok: true, analysis, model: "groq/llama-3.3-70b" });
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
