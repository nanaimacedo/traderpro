import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MENTOR_SYSTEM_PROMPT } from "@/lib/mentor-prompt";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY não configurada" },
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

  let systemContent = MENTOR_SYSTEM_PROMPT;
  if (tradesContext) {
    systemContent += `\n\n## DADOS ATUAIS DO TRADER\n${tradesContext}`;
  }

  const messages = [
    { role: "system" as const, content: systemContent },
    ...conversation.messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user" as const, content: message },
  ];

  const groqResponse = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
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
