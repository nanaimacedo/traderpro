import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateWeeklyInsights } from "@/lib/insights";

export async function GET() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 6=Sat

  // Get current week (Mon-Fri)
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

  return NextResponse.json({
    weekStart: startOfWeek.toISOString(),
    weekEnd: endOfWeek.toISOString(),
    insights,
  });
}
