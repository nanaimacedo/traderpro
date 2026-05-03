import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MENTOR_SYSTEM_PROMPT } from "@/lib/mentor-prompt";

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

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY não configurada" },
        { status: 500 }
      );
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

    let systemContent = MENTOR_SYSTEM_PROMPT;
    if (hasImage) systemContent += VISION_PROMPT;
    if (tradesContext) systemContent += `\n\n## DADOS ATUAIS DO TRADER\n${tradesContext}`;

    const contents: any[] = [];

    for (const msg of conversation.messages.slice(-10)) {
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
      contents.push({
        role: "user",
        parts: [{ text: message }],
      });
    }

    const model = "gemini-2.5-flash";
    const convId = conversation.id;

    // Use streaming endpoint
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemContent }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errorData);
      return NextResponse.json(
        { error: `Gemini erro ${geminiResponse.status}: ${errorData.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const encoder = new TextEncoder();
    let fullContent = "";

    const stream = new ReadableStream({
      async start(controller) {
        // Send conversationId first
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ conversationId: convId })}\n\n`));

        const reader = geminiResponse.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

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
                if (text) {
                  fullContent += text;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                }
              } catch {
                // skip malformed chunks
              }
            }
          }

          // Save full response to DB
          if (fullContent) {
            await prisma.mentorMessage.create({
              data: {
                role: "assistant",
                content: fullContent,
                conversationId: convId,
              },
            });
          }

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
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
