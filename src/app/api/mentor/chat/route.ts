import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MENTOR_SYSTEM_PROMPT } from "@/lib/mentor-prompt";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY nao configurada. Adicione no .env" },
      { status: 500 }
    );
  }

  const { message, conversationId, tradesContext } = await request.json();

  if (!message?.trim()) {
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
    const title = message.slice(0, 60) + (message.length > 60 ? "..." : "");
    conversation = await prisma.mentorConversation.create({
      data: { title },
      include: { messages: true },
    });
  }

  await prisma.mentorMessage.create({
    data: {
      role: "user",
      content: message,
      conversationId: conversation.id,
    },
  });

  let systemInstruction = MENTOR_SYSTEM_PROMPT;
  if (tradesContext) {
    systemInstruction += `\n\n## DADOS ATUAIS DO TRADER\n${tradesContext}`;
  }

  const history = conversation.messages.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  history.push({ role: "user", parts: [{ text: message }] });

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: history,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!geminiResponse.ok) {
    const errorData = await geminiResponse.text();
    console.error("Gemini API error:", errorData);
    return NextResponse.json(
      { error: "Erro ao comunicar com o Gemini" },
      { status: 502 }
    );
  }

  const data = await geminiResponse.json();
  const assistantContent =
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Desculpe, nao consegui gerar uma resposta.";

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
