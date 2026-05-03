import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { webPush } from "@/lib/web-push";
import { generateWeeklyInsights } from "@/lib/insights";
import { formatCurrency } from "@/lib/utils";

// GET — chamado por cron toda sexta as 15:00 BRT (18:00 UTC)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const now = new Date();
  const dayOfWeek = now.getDay();

  // Semana atual (seg-sex)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 4);
  endOfWeek.setHours(23, 59, 59, 999);

  const trades = await prisma.trade.findMany({
    where: { date: { gte: startOfWeek, lte: endOfWeek } },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  const insights = generateWeeklyInsights(trades);

  if (!insights || insights.total === 0) {
    return NextResponse.json({ message: "Sem trades na semana", sent: 0 });
  }

  // Montar mensagem de push
  const emoji = insights.netResult >= 0 ? "📈" : "📉";
  const title = `${emoji} Resumo da Semana — TraderPro`;

  const lines = [
    `${insights.total} trades | Win Rate: ${insights.winRate.toFixed(0)}%`,
    `Resultado: ${formatCurrency(insights.netResult)}`,
    `Payoff: ${insights.payoff > 0 ? insights.payoff.toFixed(2) : "—"}`,
    `${insights.gains}G / ${insights.losses}L`,
  ];

  // Adicionar insight principal
  if (insights.insights.length > 0) {
    lines.push(`💡 ${insights.insights[0]}`);
  }

  const body = lines.join("\n");

  // Enviar push
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { active: true },
  });

  let success = 0;
  let failed = 0;

  const payload = JSON.stringify({
    title,
    body,
    url: "/",
  });

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
    data: { title, body, success, failed },
  });

  return NextResponse.json({
    message: "Insights semanais enviados",
    success,
    failed,
    total: subscriptions.length,
    insights: insights.insights,
  });
}
