import { prisma } from "@/lib/prisma";

const RULES_EXTRACTION_PROMPT = `Analise esta conversa e identifique APENAS preferências explícitas ou correções que o trader fez ao mentor.

Exemplos do que capturar:
- "não me chame de X" → "Não chamar o trader de 'X'"
- "para de perguntar tanto" → "Fazer no máximo 1 pergunta por resposta"
- "seja mais direto" → "Respostas mais curtas e diretas"
- "quero que você sempre cite o setup" → "Sempre citar o nome do setup na análise"
- "não precisa de citação filosófica todo dia" → "Usar citações filosóficas com moderação, não em toda resposta"

Regras para extrair:
1. Somente correções/preferências EXPLÍCITAS ditas pelo trader — não interprete comportamento
2. Máximo 3 regras por conversa
3. Se não houver nenhuma, responda exatamente: NENHUMA

Formato de resposta (uma por linha):
REGRA: [descrição clara e aplicável da regra]

Conversa:`;

const SUMMARY_PROMPT = `Resuma esta conversa em 2-3 frases curtas focando em:
- Insights tecnicos ou erros identificados
- Estado emocional do trader
- Decisoes ou compromissos feitos
- Evolucao observada

Escreva como notas pessoais do mentor para si mesmo. Seja direto. Exemplo:
"Trader entrou em BT na MA200 do 15min — gain de 150 pontos. Confianca alta. Combinou de manter max 4 entradas. Risco: euforia pos-gain."`;

export async function generateConversationSummary(
  conversationId: string,
  messages: { role: string; content: string }[]
): Promise<string | null> {
  if (messages.length < 3) return null;

  const conversationText = messages
    .slice(-8)
    .map((m) => `${m.role === "assistant" ? "Mentor" : "Trader"}: ${m.content.slice(0, 300)}`)
    .join("\n");

  const summary = await callAI(`${SUMMARY_PROMPT}\n\nConversa:\n${conversationText}`);

  if (summary) {
    await prisma.mentorConversation.update({
      where: { id: conversationId },
      data: { summary },
    });
  }

  return summary;
}

async function callAI(prompt: string): Promise<string | null> {
  const geminiKeys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "")
    .split(",").map((k) => k.trim()).filter(Boolean);

  for (const key of geminiKeys) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
      }
    } catch { continue; }
  }

  if (process.env.GROQ_API_KEY) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          max_tokens: 256,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content || null;
      }
    } catch { /* silent */ }
  }

  return null;
}

export async function extractAndSaveRules(
  conversationId: string,
  messages: { role: string; content: string }[],
  userId: string
): Promise<void> {
  if (messages.length < 3) return;

  const conversationText = messages
    .slice(-10)
    .map((m) => `${m.role === "assistant" ? "Mentor" : "Trader"}: ${m.content.slice(0, 400)}`)
    .join("\n");

  const result = await callAI(`${RULES_EXTRACTION_PROMPT}\n\n${conversationText}`);
  if (!result || result.trim() === "NENHUMA") return;

  const newRules = result
    .split("\n")
    .filter((l) => l.startsWith("REGRA:"))
    .map((l) => ({
      rule: l.replace("REGRA:", "").trim(),
      date: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }),
    }));

  if (newRules.length === 0) return;

  const profile = await prisma.traderProfile.findUnique({
    where: { userId },
    select: { mentorRules: true },
  });

  const existing: { rule: string; date: string }[] = (() => {
    try { return JSON.parse(profile?.mentorRules || "[]"); } catch { return []; }
  })();

  // Deduplicate: skip rules that are semantically similar (same first 40 chars)
  const existingKeys = new Set(existing.map((r) => r.rule.slice(0, 40).toLowerCase()));
  const toAdd = newRules.filter((r) => !existingKeys.has(r.rule.slice(0, 40).toLowerCase()));

  if (toAdd.length === 0) return;

  const updated = [...existing, ...toAdd].slice(-20); // keep last 20 rules max

  await prisma.traderProfile.update({
    where: { userId },
    data: { mentorRules: JSON.stringify(updated) },
  });
}

export async function getMentorRules(userId: string): Promise<string> {
  const profile = await prisma.traderProfile.findUnique({
    where: { userId },
    select: { mentorRules: true },
  });

  if (!profile?.mentorRules) return "";

  const rules: { rule: string; date: string }[] = (() => {
    try { return JSON.parse(profile.mentorRules); } catch { return []; }
  })();

  if (rules.length === 0) return "";

  const lines = rules.map((r) => `- ${r.rule} (aprendido em ${r.date})`).join("\n");
  return `## REGRAS APRENDIDAS (invioláveis — definidas pelo próprio trader)\nEssas regras foram definidas explicitamente pelo trader em conversas anteriores. Siga-as SEMPRE, sem exceção:\n${lines}`;
}

export async function getRecentMemories(limit = 15, userId?: string): Promise<string> {
  const conversations = await prisma.mentorConversation.findMany({
    where: {
      summary: { not: null },
      ...(userId ? { userId } : {}),
    },
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

  return `## MEMORIA DO MENTOR (ultimas ${conversations.length} conversas)\nUse essas memorias para referenciar conversas anteriores, mostrar evolucao e personalizar respostas.\n${memories}`;
}
