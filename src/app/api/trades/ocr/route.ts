import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const GEMINI_KEYS = (process.env.GEMINI_API_KEYS || "").split(",").filter(Boolean);

const OCR_PROMPT = `Você é um extrator de dados de operações de day trade.

Analise a imagem (pode ser screenshot do Profit/Nelogica, MT5, Tryd, ou qualquer plataforma de trading brasileira) e extraia os dados da operação de trading visível.

Se houver múltiplas operações, retorne a primeira ou a mais destacada.

Retorne APENAS um JSON válido, sem markdown, sem explicação, sem texto extra:
{
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "asset": "WIN" ou "WDO" ou ticker do ativo (ex: "PETR4", "VALE3", "BTC"),
  "direction": "COMPRA" ou "VENDA",
  "entryPrice": número (sem separador de milhar, use ponto decimal se necessário),
  "exitPrice": número,
  "contracts": número inteiro (quantidade de contratos/lotes),
  "durationMinutes": número inteiro ou null,
  "confidence": "high" se todos os campos foram extraídos com certeza, "medium" se alguns campos são estimativas, "low" se a imagem não é clara
}

Se não conseguir extrair um campo, use null para ele.
Data no formato YYYY-MM-DD.
Horário no formato HH:MM (24h).`;

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

  for (const key of GEMINI_KEYS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: OCR_PROMPT },
                  { inlineData: { mimeType, data: base64 } },
                ],
              },
            ],
            generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
          }),
        }
      );

      if (!res.ok) {
        if (res.status === 429) continue;
        console.error("Gemini OCR error:", res.status);
        continue;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      const match = text.match(/\{[\s\S]*\}/);
      if (!match) continue;

      const trade = JSON.parse(match[0]);
      return NextResponse.json({ ok: true, trade });
    } catch (err) {
      console.error("OCR parse error:", err);
      continue;
    }
  }

  return NextResponse.json(
    { error: "Não foi possível extrair os dados. Preencha manualmente." },
    { status: 500 }
  );
}
