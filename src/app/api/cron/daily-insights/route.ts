import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { webPush } from "@/lib/web-push";
import { formatCurrency } from "@/lib/utils";

const DAILY_ANALYSIS_PROMPT = `Voce e um mentor de trading experiente que combina analise tecnica, psicologia de performance, PNL, estoicismo e fe.

Analise o dia de operacoes abaixo e gere um INSIGHT DIARIO profundo e personalizado. Nao seja generico — seja especifico sobre os numeros.

Regras:
- Maximo 4 paragrafos curtos
- Tom de mentor firme mas acolhedor
- Se o dia foi positivo: reconheca mas alerte sobre disciplina
- Se o dia foi negativo: identifique o padrao e de direcao clara
- Se nao operou: encoraje o descanso consciente
- Termine com uma frase de sabedoria
- Responda em portugues brasileiro`;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const geminiKey = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "").split(",")[0]?.trim();
  if (!geminiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY nao configurada" }, { status: 500 });
  }

  const today = new Date();
  const dayStart = new Date(today);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(today);
  dayEnd.setHours(23, 59, 59, 999);

  const users = await prisma.user.findMany({ select: { id: true } });
  let totalPush = 0;

  for (const user of users) {
    const trades = await prisma.trade.findMany({
      where: { userId: user.id, date: { gte: dayStart, lte: dayEnd } },
      orderBy: [{ time: "asc" }],
    });

    if (trades.length === 0) continue;

    const gains = trades.filter((t) => t.result === "GAIN");
    const losses = trades.filter((t) => t.result === "LOSS");
    const netResult = trades.reduce((s, t) => s + t.financialResult, 0);
    const totalPoints = trades.reduce((s, t) => s + t.points, 0);
    const winRate = (gains.length / trades.length) * 100;

    const tradeLines = trades.map((t, i) =>
      `${i + 1}. ${t.time} | ${t.direction} | ${t.contracts}ct | ${t.entryPrice} -> ${t.exitPrice} | ${t.points > 0 ? "+" : ""}${t.points.toFixed(1)}pts | ${formatCurrency(t.financialResult)} | ${t.result}${t.setup ? ` | ${t.setup}` : ""}`
    ).join("\n");

    const context = `## DIA: ${today.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}

### OPERACOES
${tradeLines}

### RESUMO
- Total: ${trades.length} trades
- Gains: ${gains.length} | Losses: ${losses.length}
- Win Rate: ${winRate.toFixed(0)}%
- Resultado: ${formatCurrency(netResult)} (${totalPoints > 0 ? "+" : ""}${totalPoints.toFixed(1)} pontos)
- Sequencia: ${getSequence(trades)}`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
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

    let insightConvo = await prisma.mentorConversation.findFirst({
      where: { userId: user.id, title: "Insights Diarios" },
    });

    if (!insightConvo) {
      insightConvo = await prisma.mentorConversation.create({
        data: { userId: user.id, title: "Insights Diarios" },
      });
    }

    const dateLabel = today.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

    await prisma.mentorMessage.create({
      data: {
        role: "assistant",
        content: `## Analise do dia ${dateLabel}\n\n${aiInsight}\n\n---\n*${trades.length} trades | ${winRate.toFixed(0)}% WR | ${formatCurrency(netResult)}*`,
        conversationId: insightConvo.id,
      },
    });

    const emoji = netResult >= 0 ? "📈" : "📉";
    const pushTitle = `${emoji} Review do dia — ${dateLabel}`;
    const pushBody = `${trades.length} trades | WR ${winRate.toFixed(0)}% | ${formatCurrency(netResult)}\n${aiInsight.slice(0, 120)}...`;

    const subs = await prisma.pushSubscription.findMany({
      where: { userId: user.id, active: true },
    });

    const payload = JSON.stringify({ title: pushTitle, body: pushBody, url: "/mentor" });

    for (const sub of subs) {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        totalPush++;
      } catch (error: unknown) {
        if (error && typeof error === "object" && "statusCode" in error) {
          const statusCode = (error as { statusCode: number }).statusCode;
          if (statusCode === 410 || statusCode === 404) {
            await prisma.pushSubscription.update({ where: { id: sub.id }, data: { active: false } });
          }
        }
      }
    }
  }

  await prisma.notificationLog.create({
    data: { title: "Insights Diarios", body: `${users.length} usuarios`, success: totalPush, failed: 0 },
  });

  return NextResponse.json({ message: "Insights diarios gerados", pushSent: totalPush });
}

function getSequence(trades: { result: string }[]) {
  let streak = 0;
  let type = "";
  for (let i = trades.length - 1; i >= 0; i--) {
    if (i === trades.length - 1) { type = trades[i].result; streak = 1; }
    else if (trades[i].result === type) { streak++; }
    else { break; }
  }
  return `${streak}x ${type}`;
}
