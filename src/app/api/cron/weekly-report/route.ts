import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { webPush } from "@/lib/web-push";
import { generateWeeklyInsights } from "@/lib/insights";
import { formatCurrency } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const now = new Date();
  const dayOfWeek = now.getDay();

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 4);
  endOfWeek.setHours(23, 59, 59, 999);

  // Get all users with trades this week
  const users = await prisma.user.findMany({
    select: { id: true, name: true },
  });

  let totalSent = 0;

  for (const user of users) {
    const trades = await prisma.trade.findMany({
      where: {
        userId: user.id,
        date: { gte: startOfWeek, lte: endOfWeek },
      },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });

    if (trades.length === 0) continue;

    const insights = generateWeeklyInsights(trades);
    if (!insights || insights.total === 0) continue;

    // Generate PDF-like HTML report and save as mentor conversation
    const weekLabel = `${startOfWeek.toLocaleDateString("pt-BR")} - ${endOfWeek.toLocaleDateString("pt-BR")}`;

    const reportContent = `## Relatorio Semanal — ${weekLabel}

### Resumo
- **Trades:** ${insights.total}
- **Win Rate:** ${insights.winRate.toFixed(0)}%
- **Resultado:** ${formatCurrency(insights.netResult)}
- **Payoff Ratio:** ${insights.payoff > 0 ? insights.payoff.toFixed(2) : "—"}
- **Gains:** ${insights.gains} | **Losses:** ${insights.losses}

### Melhor horario
${insights.bestHour ? `${insights.bestHour.hour} — ${formatCurrency(insights.bestHour.result)}` : "Sem dados suficientes"}

### Pior horario
${insights.worstHour ? `${insights.worstHour.hour} — ${formatCurrency(insights.worstHour.result)}` : "Sem dados suficientes"}

### Insights
${insights.insights.map((i: string) => `- ${i}`).join("\n")}

---
*Gerado automaticamente pelo TraderPro*`;

    // Save as mentor conversation
    let reportConvo = await prisma.mentorConversation.findFirst({
      where: { userId: user.id, title: "Relatorios Semanais" },
    });

    if (!reportConvo) {
      reportConvo = await prisma.mentorConversation.create({
        data: { userId: user.id, title: "Relatorios Semanais" },
      });
    }

    await prisma.mentorMessage.create({
      data: {
        role: "assistant",
        content: reportContent,
        conversationId: reportConvo.id,
      },
    });

    // Send push notification
    const subs = await prisma.pushSubscription.findMany({
      where: { userId: user.id, active: true },
    });

    const emoji = insights.netResult >= 0 ? "📈" : "📉";
    const payload = JSON.stringify({
      title: `${emoji} Relatorio Semanal — TraderPro`,
      body: `${insights.total} trades | WR ${insights.winRate.toFixed(0)}% | ${formatCurrency(insights.netResult)}`,
      url: "/mentor",
    });

    for (const sub of subs) {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        totalSent++;
      } catch (error: unknown) {
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
    }
  }

  await prisma.notificationLog.create({
    data: {
      title: "Relatorio Semanal",
      body: `Enviado para ${totalSent} subscribers`,
      success: totalSent,
      failed: 0,
    },
  });

  return NextResponse.json({
    message: "Relatorios semanais gerados e enviados",
    pushSent: totalSent,
  });
}
