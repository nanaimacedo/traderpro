import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MENTOR_SYSTEM_PROMPT } from "@/lib/mentor-prompt";
import { getRelevantKnowledge } from "@/lib/mentor-knowledge";

const VISION_PROMPT = `\n\n## ANÁLISE DE GRÁFICO — INSTRUÇÕES ESPECIAIS
Quando receber uma imagem de gráfico/tela de mercado, analise como um ORGANISMO VIVO:

1. **Primeira impressão** — O que você VÊ? Descreva o cenário geral (tendência, lateralidade, range).
2. **Localização** — Onde o preço está em relação às médias (MA20, MA200, VWAP)? Está em zona de valor?
3. **Setups visíveis** — Identifique setups do Oliver Velez: Elephant Bars, Bottoming/Topping Tails, RBI/GBI, NRBs.
4. **Marcações do trader** — Se houver marcações, linhas ou anotações do trader, analise e comente.
5. **Leitura barra a barra** — Descreva as últimas barras significativas e o que estão dizendo.
6. **Opinião como mentor** — "Se eu estivesse na tela agora, eu faria..." Seja específico. Dê preço, stop e alvo se possível.
7. **Alertas** — Tem armadilha? Resistência pesada logo acima? Volume secando? Avise.
8. **Conexão emocional** — Se o trader enviou em momento de dúvida, encoraje. Se enviou em momento de euforia, alerte.

Seja ESPECÍFICO. Não diga "o gráfico mostra uma tendência". Diga "o gráfico de 5 minutos mostra tendência de alta com preço acima da MA20, testando a região de X pontos. A barra atual é uma NRB, sinalizando possível explosão."`;

// --- Provider abstraction ---

async function callGemini(
  systemContent: string,
  contents: any[],
  maxTokens: number,
  apiKeys: string[]
): Promise<Response | null> {
  // Try best model first, fallback to lighter if unavailable
  const models = ["gemini-2.5-flash", "gemini-2.0-flash"];

  // Try each model + key combination until one works
  for (const model of models) {
    const requestBody = JSON.stringify({
      systemInstruction: { parts: [{ text: systemContent }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens },
    });

    for (let i = 0; i < apiKeys.length; i++) {
      const key = apiKeys[i];
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${key}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: requestBody }
      );

      if (res.ok) {
        if (model !== models[0] || i > 0) console.log(`Gemini: ${model} key #${i + 1}`);
        return res;
      }

      if (res.status !== 429) {
        const errorData = await res.text();
        console.error(`Gemini ${model} key #${i + 1} error ${res.status}:`, errorData.slice(0, 200));
        continue;
      }

      console.warn(`Gemini ${model} key #${i + 1} quota exceeded, trying next...`);
    }
  }

  return null;
}

async function callGroq(
  systemContent: string,
  contents: any[],
  maxTokens: number,
  apiKey: string
): Promise<Response | null> {
  // Convert Gemini format to OpenAI format (Groq uses OpenAI-compatible API)
  const messages: any[] = [{ role: "system", content: systemContent }];

  for (const c of contents) {
    const role = c.role === "model" ? "assistant" : "user";
    const text = c.parts?.map((p: any) => p.text).filter(Boolean).join("\n") || "";
    if (text) messages.push({ role, content: text });
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  return res.ok ? res : null;
}

// --- Stream parsers ---

function parseGeminiStream(
  body: ReadableStream<Uint8Array>,
  onChunk: (text: string) => void,
  onDone: () => void
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === "[DONE]") continue;
          try {
            const chunk = JSON.parse(jsonStr);
            const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) onChunk(text);
          } catch { /* skip */ }
        }
      }
    } finally {
      onDone();
    }
  })();
}

function parseGroqStream(
  body: ReadableStream<Uint8Array>,
  onChunk: (text: string) => void,
  onDone: () => void
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === "[DONE]") continue;
          try {
            const chunk = JSON.parse(jsonStr);
            const text = chunk.choices?.[0]?.delta?.content;
            if (text) onChunk(text);
          } catch { /* skip */ }
        }
      }
    } finally {
      onDone();
    }
  })();
}

// --- Main handler ---

export async function POST(request: NextRequest) {
  try {
    const geminiKeys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    const groqKey = process.env.GROQ_API_KEY;

    if (geminiKeys.length === 0 && !groqKey) {
      return NextResponse.json({ error: "Nenhuma API key configurada (GEMINI_API_KEYS ou GROQ_API_KEY)" }, { status: 500 });
    }

    const { message, image, conversationId, tradesContext } = await request.json();

    if (!message?.trim() && !image) {
      return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
    }

    let conversation;
    if (conversationId) {
      conversation = await prisma.mentorConversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
    }

    if (!conversation) {
      const title = (message || "Análise de gráfico").slice(0, 60);
      conversation = await prisma.mentorConversation.create({
        data: { title },
        include: { messages: true },
      });
    }

    await prisma.mentorMessage.create({
      data: {
        role: "user",
        content: image ? `[Imagem enviada]\n${message || "Analise este gráfico"}` : message,
        conversationId: conversation.id,
      },
    });

    const hasImage = !!image;
    const isFirstMessage = conversation.messages.length <= 1;
    const msgLower = (message || "").toLowerCase();

    let systemContent = MENTOR_SYSTEM_PROMPT;

    const knowledge = getRelevantKnowledge(message || "");
    if (knowledge) systemContent += `\n\n${knowledge}`;

    if (hasImage) systemContent += VISION_PROMPT;

    const needsContext =
      isFirstMessage ||
      hasImage ||
      /\b(bom dia|fechei|acabou|resultado|meta|trade|operac|semana|m[eê]s|win rate|payoff|como (foi|estou|ta|tá)|review|p[oó]s.?mercado|diario|diary|replay|relat[oó]rio)\b/i.test(msgLower);

    if (tradesContext && needsContext) {
      systemContent += `\n\n## DADOS ATUAIS DO TRADER\n${tradesContext}`;
    }

    const contents: any[] = [];

    for (const msg of conversation.messages.slice(-6)) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }

    if (hasImage) {
      const imageData = image.replace(/^data:image\/\w+;base64,/, "");
      const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
      contents.push({
        role: "user",
        parts: [
          { text: message || "Analise este gráfico usando a metodologia Oliver Velez." },
          { inlineData: { mimeType, data: imageData } },
        ],
      });
    } else {
      contents.push({ role: "user", parts: [{ text: message }] });
    }

    const convId = conversation.id;
    const isProtocol = /\b(bom dia|fechei|acabou|review|p[oó]s.?mercado)\b/i.test(msgLower);
    const maxTokens = isProtocol || hasImage ? 4096 : 2048;

    // Try Gemini first, then Groq as fallback
    let providerResponse: Response | null = null;
    let provider: "gemini" | "groq" = "gemini";

    if (geminiKeys.length > 0) {
      providerResponse = await callGemini(systemContent, contents, maxTokens, geminiKeys);
    }

    if (!providerResponse && groqKey && !hasImage) {
      // Groq doesn't support vision, skip if image
      console.log("Gemini unavailable, falling back to Groq (llama-3.3-70b)");
      providerResponse = await callGroq(systemContent, contents, maxTokens, groqKey);
      provider = "groq";
    }

    if (!providerResponse) {
      return NextResponse.json(
        { error: "Todos os provedores de IA estão indisponíveis. Verifique as API keys e quotas." },
        { status: 429 }
      );
    }

    // Stream response to client
    const encoder = new TextEncoder();
    let fullContent = "";

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ conversationId: convId })}\n\n`));

        const onChunk = (text: string) => {
          fullContent += text;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
        };

        const onDone = async () => {
          if (fullContent) {
            await prisma.mentorMessage.create({
              data: { role: "assistant", content: fullContent, conversationId: convId },
            });
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        };

        try {
          if (provider === "gemini") {
            parseGeminiStream(providerResponse!.body!, onChunk, onDone);
          } else {
            parseGroqStream(providerResponse!.body!, onChunk, onDone);
          }
        } catch (err) {
          console.error("Stream error:", err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Mentor chat error:", errorMessage);
    return NextResponse.json(
      { error: `Erro interno: ${errorMessage.slice(0, 200)}` },
      { status: 500 }
    );
  }
}
