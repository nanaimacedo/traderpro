import { prisma } from "@/lib/prisma";

const SUMMARY_PROMPT = `Resuma esta conversa em 2-3 frases curtas focando em:
- Insights técnicos ou erros identificados
- Estado emocional do trader
- Decisões ou compromissos feitos
- Evolução observada

Escreva como notas pessoais do mentor para si mesmo. Seja direto. Exemplo:
"Trader entrou em BT na MA200 do 15min — gain de 150 pontos. Confiança alta. Combinou de manter max 4 entradas. Risco: euforia pós-gain."`;

/**
 * Generate and save a conversation summary using Gemini/Groq
 */
export async function generateConversationSummary(
  conversationId: string,
  messages: { role: string; content: string }[]
): Promise<string | null> {
  if (messages.length < 3) return null; // too short to summarize

  const geminiKeys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  // Build a compact version of the conversation for summarization
  const conversationText = messages
    .slice(-8) // last 8 messages max
    .map((m) => `${m.role === "assistant" ? "Mentor" : "Trader"}: ${m.content.slice(0, 300)}`)
    .join("\n");

  const prompt = `${SUMMARY_PROMPT}\n\nConversa:\n${conversationText}`;

  let summary: string | null = null;

  // Try Gemini first (use flash-lite for summaries — cheaper)
  for (const key of geminiKeys) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 256 },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        summary = data.candidates?.[0]?.content?.parts?.[0]?.text || null;
        break;
      }
    } catch {
      continue;
    }
  }

  // Fallback to Groq
  if (!summary && process.env.GROQ_API_KEY) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 256,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        summary = data.choices?.[0]?.message?.content || null;
      }
    } catch {
      // silent fail
    }
  }

  if (summary) {
    await prisma.mentorConversation.update({
      where: { id: conversationId },
      data: { summary },
    });
  }

  return summary;
}

/**
 * Get recent conversation memories to inject into mentor context
 */
export async function getRecentMemories(limit = 15): Promise<string> {
  const conversations = await prisma.mentorConversation.findMany({
    where: { summary: { not: null } },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      summary: true,
      updatedAt: true,
    },
  });

  if (conversations.length === 0) return "";

  const memories = conversations
    .map((c) => {
      const date = c.updatedAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      return `[${date}] ${c.summary}`;
    })
    .join("\n");

  return `## MEMÓRIA DO MENTOR (últimas ${conversations.length} conversas)\nUse essas memórias para referenciar conversas anteriores, mostrar evolução e personalizar respostas.\n${memories}`;
}
