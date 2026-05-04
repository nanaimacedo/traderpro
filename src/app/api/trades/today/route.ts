import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ count: 0, dailyResult: 0 });

    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const trades = await prisma.trade.findMany({
      where: {
        userId: session.userId,
        date: { gte: dayStart, lte: dayEnd },
      },
      select: { financialResult: true },
    });

    const dailyResult = trades.reduce((sum, t) => sum + t.financialResult, 0);

    return NextResponse.json({ count: trades.length, dailyResult });
  } catch {
    return NextResponse.json({ count: 0, dailyResult: 0 }, { status: 500 });
  }
}
