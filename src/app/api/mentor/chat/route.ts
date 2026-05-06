import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { MENTOR_SYSTEM_PROMPT } from "@/lib/mentor-prompt";
import { getRelevantKnowledge } from "@/lib/mentor-knowledge";
import { getMethodologyPrompt } from "@/lib/methodology-plugins";
import { getRecentMemories, generateConversationSummary } from "@/lib/mentor-memory";
import { getTodayEvents, formatEventsForMentor } from "@/lib/economic-calendar";
import { calculateMetrics } from "@/lib/calculations";
import { generateWeeklyInsights } from "@/lib/insights";
import { formatCurrency, formatDate } from "@/lib/utils";

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

// --- Historical patterns builder ---

async function buildHistoricalPatterns(userId: string, allTrades: any[]): Promise<string> {
  if (allTrades.length < 5) return "";

  let out = `## PADRÕES HISTÓRICOS (${allTrades.length} trades no total)\n`;

  // By setup
  const bySetup = new Map<string, { wins: number; losses: number; zeros: number; total: number; pnl: number }>();
  for (const t of allTrades) {
    const key = t.setup || "(sem setup)";
    const s = bySetup.get(key) || { wins: 0, losses: 0, zeros: 0, total: 0, pnl: 0 };
    s.total++;
    s.pnl += t.financialResult;
    if (t.result === "GAIN") s.wins++;
    else if (t.result === "LOSS") s.losses++;
    else s.zeros++;
    bySetup.set(key, s);
  }
  const setupLines = Array.from(bySetup.entries())
    .filter(([, s]) => s.total >= 3)
    .sort((a, b) => b[1].pnl - a[1].pnl)
    .map(([name, s]) => {
      const wr = ((s.wins / s.total) * 100).toFixed(0);
      return `  • ${name}: ${s.total}t | WR ${wr}% | ${s.pnl >= 0 ? "+" : ""}${formatCurrency(s.pnl)}`;
    });
  if (setupLines.length > 0) {
    out += `**Por setup** (mín 3 trades):\n${setupLines.join("\n")}\n`;
  }

  // By hour
  const byHour = new Map<string, { wins: number; total: number; pnl: number }>();
  for (const t of allTrades) {
    const hour = t.time?.slice(0, 2) + "h";
    const h = byHour.get(hour) || { wins: 0, total: 0, pnl: 0 };
    h.total++;
    h.pnl += t.financialResult;
    if (t.result === "GAIN") h.wins++;
    byHour.set(hour, h);
  }
  const hourLines = Array.from(byHour.entries())
    .filter(([, h]) => h.total >= 3)
    .sort((a, b) => b[1].pnl - a[1].pnl)
    .slice(0, 6)
    .map(([hour, h]) => `  • ${hour}: WR ${((h.wins / h.total) * 100).toFixed(0)}% | ${h.pnl >= 0 ? "+" : ""}${formatCurrency(h.pnl)}`);
  if (hourLines.length > 0) {
    out += `**Por horário** (top 6):\n${hourLines.join("\n")}\n`;
  }

  // Top 3 best and worst individual trades ever
  const sorted = [...allTrades].sort((a, b) => b.financialResult - a.financialResult);
  const best3 = sorted.slice(0, 3);
  const worst3 = sorted.slice(-3).reverse();
  const fmt = (t: any) => {
    const d = new Date(t.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
    return `  • ${d} ${t.time} | ${t.asset} ${t.direction} ${t.contracts}ct | E:${t.entryPrice}→${t.exitPrice}${t.setup ? ` | ${t.setup}` : ""} | ${formatCurrency(t.financialResult)}${t.notes ? ` — "${t.notes.slice(0, 80)}"` : ""}`;
  };
  out += `**3 melhores trades de todos os tempos:**\n${best3.map(fmt).join("\n")}\n`;
  out += `**3 piores trades de todos os tempos:**\n${worst3.map(fmt).join("\n")}\n`;

  return out + "\n";
}

// --- Trade context builder (always fresh, server-side) ---

async function buildTradesContext(userId: string): Promise<string> {
  // Always use Brazil timezone (UTC-3) to determine "today"
  const nowUtc = new Date();
  const BRT_OFFSET_MS = -3 * 60 * 60 * 1000;
  const now = new Date(nowUtc.getTime() + BRT_OFFSET_MS);

  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) - BRT_OFFSET_MS);
  const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59) - BRT_OFFSET_MS);

  const dayOfWeek = now.getUTCDay();
  const startOfWeek = new Date(now);
  startOfWeek.setUTCDate(now.getUTCDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  startOfWeek.setUTCHours(0, 0, 0, 0);
  const startOfWeekUtc = new Date(startOfWeek.getTime() - BRT_OFFSET_MS);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 4);
  endOfWeek.setUTCHours(23, 59, 59, 999);
  const endOfWeekUtc = new Date(endOfWeek.getTime() - BRT_OFFSET_MS);

  // today in BRT: midnight to 23:59:59 converted to UTC for DB query
  const todayBrtY = now.getUTCFullYear(), todayBrtM = now.getUTCMonth(), todayBrtD = now.getUTCDate();
  const todayStart = new Date(Date.UTC(todayBrtY, todayBrtM, todayBrtD, 0, 0, 0) - BRT_OFFSET_MS);
  const todayEnd = new Date(Date.UTC(todayBrtY, todayBrtM, todayBrtD, 23, 59, 59) - BRT_OFFSET_MS);

  const [monthTrades, lastTrades, todayTrades, allTrades, diaryEntries, replays, reports, profile] = await Promise.all([
    prisma.trade.findMany({
      where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
      orderBy: { date: "asc" },
    }),
    prisma.trade.findMany({
      where: { userId },
      orderBy: [{ date: "desc" }, { time: "desc" }],
      take: 12,
    }),
    prisma.trade.findMany({
      where: { userId, date: { gte: todayStart, lte: todayEnd } },
      orderBy: { time: "asc" },
    }),
    prisma.trade.findMany({
      where: { userId },
      orderBy: { date: "asc" },
      select: { date: true, time: true, asset: true, direction: true, entryPrice: true, exitPrice: true, contracts: true, result: true, points: true, financialResult: true, setup: true, notes: true },
    }),
    prisma.diaryEntry.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.replay.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.brokerReport.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 3,
    }),
    prisma.traderProfile.findUnique({ where: { userId } }),
  ]);

  const weekTrades = monthTrades.filter(
    (t) => new Date(t.date) >= startOfWeekUtc && new Date(t.date) <= endOfWeekUtc
  );

  let context = "";

  // Today's trades — always first, explicit and unambiguous
  const todayLabel = now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: "America/Sao_Paulo" });
  if (todayTrades.length === 0) {
    context += `## OPERAÇÕES DE HOJE (${todayLabel})\nNenhuma operação registrada hoje ainda.\n\n`;
  } else {
    const todayNet = todayTrades.reduce((s, t) => s + t.financialResult, 0);
    const todayPts = todayTrades.reduce((s, t) => s + t.points, 0);
    const todayGains = todayTrades.filter((t) => t.result === "GAIN").length;
    const todayLosses = todayTrades.filter((t) => t.result === "LOSS").length;
    context += `## OPERAÇÕES DE HOJE (${todayLabel})\n`;
    context += `- Total: ${todayTrades.length} operação${todayTrades.length > 1 ? "ões" : ""} | Gains: ${todayGains} | Losses: ${todayLosses}\n`;
    context += `- Resultado do dia: ${formatCurrency(Math.round(todayNet * 100) / 100)} | Pontos: ${todayPts > 0 ? "+" : ""}${todayPts.toFixed(1)}\n`;
    for (const t of todayTrades) {
      context += `  • ${t.time} | ${t.asset} ${t.direction} ${t.contracts}ct | E:${t.entryPrice}→${t.exitPrice} | ${t.result} ${t.points > 0 ? "+" : ""}${t.points.toFixed(1)}pts ${formatCurrency(t.financialResult)}${t.setup ? ` | ${t.setup}` : ""}\n`;
      if (t.notes) context += `    Relato: "${t.notes.slice(0, 120)}"\n`;
    }
    context += "\n";
  }

  // Monthly metrics
  if (monthTrades.length > 0) {
    const metrics = calculateMetrics(monthTrades);
    const payoff =
      metrics.losses > 0 && metrics.gains > 0
        ? Math.abs(metrics.totalGain / metrics.gains) / Math.abs(metrics.totalLoss / metrics.losses)
        : 0;
    const monthlyGoal = profile?.monthlyGoal ?? 4400;

    context += `## MÉTRICAS DO MÊS (${now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })})\n`;
    context += `- Total de trades: ${metrics.totalTrades}\n`;
    context += `- Win rate: ${metrics.winRate.toFixed(1)}%\n`;
    context += `- Resultado líquido: ${formatCurrency(metrics.netResult)}\n`;
    context += `- Gains: ${metrics.gains} | Losses: ${metrics.losses} | Zeros: ${metrics.zeros}\n`;
    context += `- Total pontos: ${metrics.totalPoints.toFixed(1)}\n`;
    context += `- Média pts/trade: ${metrics.avgPointsPerTrade.toFixed(1)}\n`;
    context += `- Payoff ratio: ${payoff > 0 ? payoff.toFixed(2) : "—"}\n`;
    context += `- Sequência vencedora max: ${metrics.maxWinStreak}\n`;
    context += `- Sequência perdedora max: ${metrics.maxLossStreak}\n`;
    context += `- Meta mensal: ${formatCurrency(monthlyGoal)} | Progresso: ${formatCurrency(metrics.netResult)} (${((metrics.netResult / monthlyGoal) * 100).toFixed(0)}%)\n\n`;
  }

  // Weekly insights
  if (weekTrades.length > 0) {
    const weekInsights = generateWeeklyInsights(weekTrades);
    if (weekInsights) {
      context += `## INSIGHTS DA SEMANA\n`;
      context += `- Trades: ${weekInsights.total} | Win rate: ${weekInsights.winRate.toFixed(1)}%\n`;
      context += `- Resultado: ${formatCurrency(weekInsights.netResult)}\n`;
      context += `- Payoff: ${weekInsights.payoff > 0 ? weekInsights.payoff.toFixed(2) : "—"}\n`;
      if (weekInsights.bestHour)
        context += `- Melhor horário: ${weekInsights.bestHour.hour} (${formatCurrency(weekInsights.bestHour.result)})\n`;
      if (weekInsights.worstHour && weekInsights.worstHour.result < 0)
        context += `- Pior horário: ${weekInsights.worstHour.hour} (${formatCurrency(weekInsights.worstHour.result)})\n`;
      weekInsights.insights.forEach((i) => { context += `- ${i}\n`; });
      context += "\n";
    }
  }

  // Recent trades — full detail
  if (lastTrades.length > 0) {
    context += `## OPERAÇÕES RECENTES (últimas ${lastTrades.length})\n`;
    for (const t of lastTrades) {
      const emotions = (() => {
        try { return (JSON.parse(t.emotions || "[]") as string[]).join(", "); } catch { return ""; }
      })();
      context += `- ${formatDate(t.date)} ${t.time} | ${t.asset} | ${t.direction} | ${t.contracts}ct`;
      context += ` | E:${t.entryPrice}→${t.exitPrice}`;
      context += ` | ${t.result} ${t.points > 0 ? "+" : ""}${t.points.toFixed(1)}pts ${formatCurrency(t.financialResult)}`;
      if (t.setup) context += ` | Setup:${t.setup}`;
      if (t.durationMinutes) {
        const m = Math.floor(t.durationMinutes / 60), s = t.durationMinutes % 60;
        context += ` | ${m > 0 ? `${m}m ` : ""}${s}s`.trimEnd();
      }
      if (emotions) context += ` | Emocoes:[${emotions}]`;
      context += "\n";
      if (t.notes) context += `  Relato: "${t.notes}"\n`;
      if (t.whatWentRight) context += `  Certo: "${t.whatWentRight}"\n`;
      if (t.whereToImprove) context += `  Melhorar: "${t.whereToImprove}"\n`;
    }
    context += "\n";
  }

  // Historical patterns (all-time)
  if (allTrades.length >= 5) {
    const patterns = await buildHistoricalPatterns(userId, allTrades);
    if (patterns) context += patterns;
  }

  // Diary entries
  if (diaryEntries.length > 0) {
    context += `## DIÁRIO DO TRADER (últimas ${diaryEntries.length} entradas)\n`;
    for (const d of diaryEntries) {
      context += `### ${formatDate(d.date)} — ${d.title}${d.mood ? ` [${d.mood}]` : ""}\n`;
      context += `${d.content}\n\n`;
    }
  }

  // Replays
  if (replays.length > 0) {
    context += `## REPLAYS (últimos ${replays.length} estudos)\n`;
    for (const r of replays) {
      const wr = r.entries > 0 ? ((r.gains / r.entries) * 100).toFixed(0) : "0";
      context += `- ${formatDate(r.date)} | "${r.title}" | ${r.entries} ent | ${r.gains}G/${r.losses}L | WR:${wr}% | ${r.points > 0 ? "+" : ""}${r.points.toFixed(1)}pts${r.mood ? ` | [${r.mood}]` : ""}\n`;
      if (r.content) context += `  ${r.content}\n`;
    }
    context += "\n";
  }

  // Broker reports
  if (reports.length > 0) {
    context += `## RELATÓRIOS DA CORRETORA\n`;
    for (const r of reports) {
      context += `- ${formatDate(r.date)} | ${r.originalName} | ${r.totalTrades ?? "?"}t | Ganhos:${r.totalGain ? formatCurrency(r.totalGain) : "?"} | Perdas:${r.totalLoss ? formatCurrency(Math.abs(r.totalLoss)) : "?"} | Líquido:${r.netResult ? formatCurrency(r.netResult) : "?"}\n`;
    }
    context += "\n";
  }

  if (!context) {
    return "O trader ainda não registrou nenhuma operação no sistema.";
  }

  context += `## SITUAÇÃO ATUAL\n`;
  context += `- Data/hora: ${nowUtc.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" })} ${nowUtc.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })} (horário de Brasília)\n`;
  context += `- Replays realizados: ${replays.length} | Entradas no diário: ${diaryEntries.length}\n`;

  return context;
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

    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const { message, images, conversationId } = await request.json();
    const imageList: string[] = Array.isArray(images) ? images : images ? [images] : [];

    if (!message?.trim() && imageList.length === 0) {
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
        data: { title, userId: session.userId },
        include: { messages: true },
      });
    }

    await prisma.mentorMessage.create({
      data: {
        role: "user",
        content: imageList.length > 0
          ? `[${imageList.length} imagem${imageList.length > 1 ? "ns" : ""} enviada${imageList.length > 1 ? "s" : ""}]\n${message || "Analise este gráfico"}`
          : message,
        conversationId: conversation.id,
      },
    });

    const hasImage = imageList.length > 0;
    const isFirstMessage = conversation.messages.length <= 1;
    const msgLower = (message || "").toLowerCase();

    // Load trader profile for personalized mentoring
    const traderProfile = await prisma.traderProfile.findUnique({
      where: { userId: session.userId },
    });

    let systemContent = MENTOR_SYSTEM_PROMPT;

    // Inject dynamic profile data
    if (traderProfile) {
      systemContent += `\n\n## PERFIL DO TRADER (DADOS ATUAIS)
- **Nome:** ${traderProfile.name}${traderProfile.nickname ? ` (pode chamá-lo de "${traderProfile.nickname}" em momentos de motivação)` : ""}
- **Ativo:** ${traderProfile.asset} — cada ponto vale R$ ${traderProfile.pointValue.toFixed(2)} por contrato
${traderProfile.currentJob ? `- **Profissão:** ${traderProfile.currentJob}` : ""}
- **Meta mensal:** R$ ${traderProfile.monthlyGoal.toFixed(2)}
- **Limite operacional:** Máximo de ${traderProfile.maxEntries} entradas por dia
- **Metodologia:** ${traderProfile.methodology}
${traderProfile.philosophy ? `- **Filosofia:** ${traderProfile.philosophy}` : ""}
${traderProfile.motivation ? `- **Motivação:** ${traderProfile.motivation}` : ""}
- **Início da mentoria:** ${traderProfile.mentoringSince.toLocaleDateString("pt-BR")}`;
    }

    // Inject methodology plugin from profile (default: oliver-velez)
    const methodologyId = traderProfile?.methodology || "oliver-velez";
    const methodology = getMethodologyPrompt(methodologyId);
    if (methodology) systemContent += `\n\n${methodology}`;

    const knowledge = getRelevantKnowledge(message || "");
    if (knowledge) systemContent += `\n\n${knowledge}`;

    // Inject mentor memories from past conversations (scoped to this user)
    const memories = await getRecentMemories(15, session.userId);
    if (memories) systemContent += `\n\n${memories}`;

    // Inject economic calendar for pre-market and context
    const todayEvents = await getTodayEvents();
    const calendarContext = formatEventsForMentor(todayEvents);
    if (calendarContext) systemContent += `\n\n${calendarContext}`;

    if (hasImage) systemContent += VISION_PROMPT;

    const needsContext =
      isFirstMessage ||
      hasImage ||
      /\b(bom dia|fechei|acabou|resultado|meta|trade|operac|semana|m[eê]s|win rate|payoff|como (foi|estou|ta|tá)|review|p[oó]s.?mercado|diario|diary|replay|relat[oó]rio|quantas|hoje|hj|sess[aã]o|fiz|perdi|ganhei|lucr|prejuiz)\b/i.test(msgLower);

    if (needsContext) {
      const tradesContext = await buildTradesContext(session.userId);
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
      const parts: any[] = [
        { text: message || "Analise este gráfico usando a metodologia Oliver Velez." },
      ];
      for (const img of imageList) {
        const imageData = img.replace(/^data:image\/\w+;base64,/, "");
        const mimeMatch = img.match(/^data:(image\/\w+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
        parts.push({ inlineData: { mimeType, data: imageData } });
      }
      contents.push({ role: "user", parts });
    } else {
      contents.push({ role: "user", parts: [{ text: message }] });
    }

    const convId = conversation.id;
    const isProtocol = /\b(bom dia|fechei|acabou|review|p[oó]s.?mercado|o que acha|analisa|destaque|relatorio|relat[oó]rio|como foi|avalia)\b/i.test(msgLower);
    const maxTokens = hasImage ? 8192 : isProtocol || needsContext ? 16384 : 4096;

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

            // Generate memory summary in background (don't block response)
            const allMessages = await prisma.mentorMessage.findMany({
              where: { conversationId: convId },
              orderBy: { createdAt: "asc" },
              select: { role: true, content: true },
            });
            generateConversationSummary(convId, allMessages).catch(() => {});
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
