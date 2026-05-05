import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const GEMINI_KEYS = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "").split(",").filter(Boolean);

const OCR_PROMPT = `Você é um extrator preciso de dados de operações de day trade.

Analise a imagem (screenshot do Profit/Nelogica, MT5, Tryd ou similar) e extraia TODAS as operações visíveis.

REGRAS CRÍTICAS:
- Preserve TODOS os dígitos dos preços. Ex: 128.500 → 128500, nunca 12850 ou 1285.
- Preços de futuros brasileiros (WIN, WDO) têm 5-6 dígitos. Se parece pouco, revise.
- Duração: se mostrada em segundos (ex: "125s"), converta para minutos arredondando (125s → 2). Se em HH:MM, converta para minutos totais.
- Direção: "C" ou "Compra" → "COMPRA". "V" ou "Venda" → "VENDA".
- Data: use a data do header/título da tela se não estiver por operação.

Retorne APENAS um JSON array válido, sem markdown, sem texto extra:
[
  {
    "date": "YYYY-MM-DD",
    "time": "HH:MM",
    "asset": "WIN" | "WDO" | ticker (ex: "PETR4"),
    "direction": "COMPRA" | "VENDA",
    "entryPrice": número inteiro ou decimal (ex: 128500),
    "exitPrice": número inteiro ou decimal,
    "contracts": número inteiro,
    "durationMinutes": número inteiro ou null,
    "confidence": "high" | "medium" | "low"
  }
]

Se houver apenas uma operação, retorne array com um elemento.
Se não conseguir extrair um campo, use null.`;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!GEMINI_KEYS.length) {
    return NextResponse.json({ error: "OCR não configurado (GEMINI_API_KEYS ausente)" }, { status: 500 });
  }

  let file: File;
  try {
    const formData = await req.formData();
    file = formData.get("image") as File;
    if (!file || !file.size) throw new Error("No image");
  } catch {
    return NextResponse.json({ error: "Imagem inválida" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const mimeType = file.type || "image/jpeg";

  const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

  for (const model of MODELS) {
    for (const key of GEMINI_KEYS) {
      try {
        const body: any = {
          contents: [{ parts: [{ text: OCR_PROMPT }, { inlineData: { mimeType, data: base64 } }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
        };
        if (model === "gemini-2.5-flash") body.generationConfig.thinkingConfig = { thinkingBudget: 0 };

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
        );

        if (!res.ok) {
          const errText = await res.text();
          console.error(`Gemini OCR [${model}] ${res.status}:`, errText.slice(0, 300));
          if (res.status === 429) continue;
          break; // try next model
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

        if (!text) {
          console.error(`Gemini OCR [${model}]: empty text, finish=${data.candidates?.[0]?.finishReason}`);
          break;
        }

        // Try array first, then single object fallback
        const arrMatch = text.match(/\[[\s\S]*\]/);
        const objMatch = text.match(/\{[\s\S]*\}/);
        if (!arrMatch && !objMatch) { console.error(`Gemini OCR [${model}]: no JSON:`, text.slice(0, 200)); break; }

        let trades: any[];
        if (arrMatch) {
          trades = JSON.parse(arrMatch[0]);
          if (!Array.isArray(trades)) trades = [trades];
        } else {
          trades = [JSON.parse(objMatch![0])];
        }
        return NextResponse.json({ ok: true, trades });
      } catch (err) {
        console.error(`OCR [${model}] exception:`, err);
        break;
      }
    }
  }

  return NextResponse.json(
    { error: "Não foi possível extrair os dados. Preencha manualmente." },
    { status: 500 }
  );
}
