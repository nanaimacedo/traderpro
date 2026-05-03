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
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY não configurada" },
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
  const model = hasImage
    ? "meta-llama/llama-4-scout-17b-16e-instruct"
    : "llama-3.3-70b-versatile";

  let systemContent = MENTOR_SYSTEM_PROMPT;
  if (hasImage) systemContent += VISION_PROMPT;
  if (tradesContext) systemContent += `\n\n## DADOS ATUAIS DO TRADER\n${tradesContext}`;

  // Build messages for text-only history
  const chatMessages: any[] = [
    { role: "system", content: systemContent },
    ...conversation.messages.slice(-10).map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
  ];

  // Add current message (with image if present)
  if (hasImage) {
    const imageData = image.replace(/^data:image\/\w+;base64,/, "");
    const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/png";

    chatMessages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: message || "Analise este gráfico usando a metodologia Oliver Velez. Identifique setups, localização, médias e dê sua opinião como mentor.",
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${imageData}`,
          },
        },
      ],
    });
  } else {
    chatMessages.push({ role: "user", content: message });
  }

  const groqResponse = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    }
  );

  if (!groqResponse.ok) {
    const errorData = await groqResponse.text();
    console.error("Groq API error:", errorData);
    return NextResponse.json(
      { error: "Erro ao comunicar com o mentor" },
      { status: 502 }
    );
  }

  const data = await groqResponse.json();
  const assistantContent =
    data.choices?.[0]?.message?.content ||
    "Desculpe, não consegui gerar uma resposta.";

  await prisma.mentorMessage.create({
    data: {
      role: "assistant",
      content: assistantContent,
      conversationId: conversation.id,
    },
  });

  return NextResponse.json({
    conversationId: conversation.id,
    message: assistantContent,
  });
}
