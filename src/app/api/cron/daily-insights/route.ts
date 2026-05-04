import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { webPush } from "@/lib/web-push";
import { formatCurrency } from "@/lib/utils";

const DAILY_ANALYSIS_PROMPT = `Você é um mentor de trading experiente que combina análise técnica (Oliver Velez), psicologia de performance, PNL, estoicismo e fé cristã.

Analise o dia de operações abaixo e gere um INSIGHT DIÁRIO profundo e personalizado. Não seja genérico — seja específico sobre os números.

Regras:
- Máximo 4 parágrafos curtos
- Tom de mentor firme mas acolhedor
- Se o dia foi positivo: reconheça mas alerte sobre disciplina
- Se o dia foi negativo: identifique o padrão e dê direção clara
- Se não operou: encoraje o descanso consciente
- Use metáforas de Oliver Velez quando apropriado (localização, guarda da M8, elephant bars)
- Termine com uma frase de sabedoria (estoicismo, trading ou fé)
- Responda em português brasileiro`;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY não configurada" }, { status: 500 });
  }

  // Get first user (single-tenant for now)
  const user = await prisma.user.findFirst();
  if (!user) return NextResponse.json({ message: "No users" });

  // Today's trades
  const today = new Date();
  const dayStart = new Date(today);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(today);
  dayEnd.setHours(23, 59, 59, 999);

  const trades = await prisma.trade.findMany({
    where: { date: { gte: dayStart, lte: dayEnd } },
    orderBy: [{ time: "asc" }],
  });

  if (trades.length === 0) {
    return NextResponse.json({ message: "Sem trades hoje", sent: 0 });
  }

  // Calculate metrics
  const gains = trades.filter((t) => t.result === "GAIN");
  const losses = trades.filter((t) => t.result === "LOSS");
  const netResult = trades.reduce((s, t) => s + t.financialResult, 0);
  const totalPoints = trades.reduce((s, t) => s + t.points, 0);
  const winRate = (gains.length / trades.length) * 100;

  // Build context for Gemini
  const tradeLines = trades.map((t, i) =>
    `${i + 1}. ${t.time} | ${t.direction} | ${t.contracts}ct | ${t.entryPrice} → ${t.exitPrice} | ${t.points > 0 ? "+" : ""}${t.points.toFixed(1)}pts | ${formatCurrency(t.financialResult)} | ${t.result}`
  ).join("\n");

  const context = `## DIA: ${today.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}

### OPERAÇÕES
${tradeLines}

### RESUMO
- Total: ${trades.length} trades
- Gains: ${gains.length} | Losses: ${losses.length}
- Win Rate: ${winRate.toFixed(0)}%
- Resultado: ${formatCurrency(netResult)} (${totalPoints > 0 ? "+" : ""}${totalPoints.toFixed(1)} pontos)
- Sequência: ${getSequence(trades)}`;

  // Call Gemini for analysis
  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: DAILY_ANALYSIS_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: context }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 1024 },
      }),
    }
  );

  let aiInsight = "";
  if (geminiResponse.ok) {
    const data = await geminiResponse.json();
    aiInsight = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  // Save insight as a mentor message in a special conversation
  let insightConvo = await prisma.mentorConversation.findFirst({
    where: { title: "Insights Diários" },
  });

  if (!insightConvo) {
    insightConvo = await prisma.mentorConversation.create({
      data: { title: "Insights Diários", userId: user.id },
    });
  }

  const dateLabel = today.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  await prisma.mentorMessage.create({
    data: {
      role: "assistant",
      content: `## Análise do dia ${dateLabel}\n\n${aiInsight}\n\n---\n*${trades.length} trades | ${winRate.toFixed(0)}% WR | ${formatCurrency(netResult)}*`,
      conversationId: insightConvo.id,
    },
  });

  // Send push notification
  const emoji = netResult >= 0 ? "📈" : "📉";
  const pushTitle = `${emoji} Review do dia — ${dateLabel}`;
  const pushBody = `${trades.length} trades | WR ${winRate.toFixed(0)}% | ${formatCurrency(netResult)}\n${aiInsight.slice(0, 120)}...`;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { active: true },
  });

  let success = 0;
  let failed = 0;

  const payload = JSON.stringify({ title: pushTitle, body: pushBody, url: "/mentor" });

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        success++;
      } catch (error: unknown) {
        failed++;
        if (error && typeof error === "object" && "statusCode" in error) {
          const statusCode = (error as { statusCode: number }).statusCode;
          if (statusCode === 410 || statusCode === 404) {
            await prisma.pushSubscription.update({
              where: { id: sub.id },
              data: { active: false },
            });
          }
        }
      }
    })
  );

  await prisma.notificationLog.create({
    data: { title: pushTitle, body: pushBody, success, failed },
  });

  return NextResponse.json({
    message: "Insight diário gerado e enviado",
    trades: trades.length,
    netResult,
    pushSent: success,
    pushFailed: failed,
    insight: aiInsight.slice(0, 200),
  });
}

function getSequence(trades: { result: string }[]) {
  let streak = 0;
  let type = "";
  for (let i = trades.length - 1; i >= 0; i--) {
    if (i === trades.length - 1) {
      type = trades[i].result;
      streak = 1;
    } else if (trades[i].result === type) {
      streak++;
    } else {
      break;
    }
  }
  return `${streak}x ${type}`;
}
